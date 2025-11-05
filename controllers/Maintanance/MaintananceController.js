// jobs/maintenance.js
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const oracledb = require("oracledb");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { checkServerIdentity } = require("tls");

const TIMEZONE = process.env.TZ || "Asia/Ho_Chi_Minh";
const CRON_EXPR = process.env.MAINTENANCE_CRON || "0 8 * * *"; // 08:00 hàng ngày
const NOTIFY_KIND_D3 = "D-3";

const MAIL_RATE = {
  rateDelta: 60000, // trong 60 giây
  rateLimit: 25,     // tối đa 25 mail/60s (chỉnh tùy server bạn)
  maxConnections: 1, // 1 kết nối ổn định
  maxMessages: 100,  // tối đa 100 mail mỗi kết nối trước khi recycle
};
// ---------- Mailer ----------
function createTransporter() {
  const tls={
    servername: process.env.SMTP_SERVERNAME || process.env.SMTP_HOST,
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    // QUAN TRỌNG: dùng pool + rate limit để né throttling
    pool: true,
    maxConnections: MAIL_RATE.maxConnections,
    maxMessages: MAIL_RATE.maxMessages,
    rateDelta: MAIL_RATE.rateDelta,
    rateLimit: MAIL_RATE.rateLimit,

    requireTLS: false,
    tls,
    logger: true
  });
}
const transporter = createTransporter();

// ---------- Helpers ----------
function parseEmails(raw) {
  if (!raw) return [];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((e, i, arr) => arr.indexOf(e) === i);
}

function toIcsDateUTC(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function buildIcsEvent({
  uid,
  summary,
  description,
  startISO,
  endISO,
  location,
}) {
  const now = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `BEGIN:VCALENDAR
PRODID:-//YourCompany//Maintenance//VN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${toIcsDateUTC(now)}
DTSTART:${toIcsDateUTC(start)}
DTEND:${toIcsDateUTC(end)}
SUMMARY:${summary || ""}
DESCRIPTION:${(description || "").replace(/\r?\n/g, "\\n")}
LOCATION:${location || "Factory"}
END:VEVENT
END:VCALENDAR`;
}

function formatLocalHCM(d) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

async function sendEmailWithOptionalIcs({
  toList,
  subject,
  html,
  icsContent,
  attachments,
}) {
  if (!toList?.length) return { ok: false, info: "No recipients" };

  // ----- THÊM CHỮ KÝ TẠI ĐÂY -----
  const signature = fs.readFileSync(
    "./controllers/Maintanance/templates/emailSignature.html",
    "utf8"
  );
  // Nếu nội dung mail chưa có chữ ký → nối vào cuối
  const finalHtml = (html || "") + signature;

  if (String(process.env.DRY_RUN || "").toLowerCase() === "true") {
    console.log(
      "[DRY_RUN] to:",
      toList.join(", "),
      "subject:",
      subject,
      "date:",
      new Date()
    );
    return { ok: true, info: "Dry run", content: finalHtml, date: new Date() };
  }
  const mail = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: toList.join(", "),
    subject,
    finalHtml,
    attachments: attachments || [],
  };
  const info = await transporter.sendMail(mail);
  return { ok: true, info };
}

function buildEmailHtml(row, whenLocalStr) {
  return `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;">
    <p><strong>[Nhắc lịch bảo dưỡng D-3]</strong></p>
    <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;">
      <tr><td><b>Factory</b></td><td>${row.FACTORY || ""}</td></tr>
      <tr><td><b>Line</b></td><td>${row.LINE || ""}</td></tr>
      <tr><td><b>Machine</b></td><td>${row.MACHINE_NAME || ""}</td></tr>
      <tr><td><b>Thời gian bảo dưỡng</b></td><td>${whenLocalStr} (${TIMEZONE})</td></tr>
      ${row.NOTE ? `<tr><td><b>Ghi chú</b></td><td>${row.NOTE}</td></tr>` : ""}
    </table>
    <p>Vui lòng sắp xếp nhân lực & vật tư. File .ics đính kèm để thêm vào lịch.</p>
    <hr/>
    <p style="color:#888">Email tự động từ hệ thống bảo dưỡng.</p>
  </div>`;
}

// ---------- DB ops ----------
async function fetchMaintenancesD3(pool) {
  const sql = `
    SELECT m.ID, m.FACTORY, m.LINE, m.MACHINE_NAME, m.MAINTENANCE_DATE,
           m.MANAGER_EMAILS, m.NOTE
      FROM MAINTENANCE m
     WHERE m.MAINTENANCE_DATE >= TRUNC(CAST(SYSTIMESTAMP AT TIME ZONE :tz AS DATE)) + 3
       AND m.MAINTENANCE_DATE <  TRUNC(CAST(SYSTIMESTAMP AT TIME ZONE :tz AS DATE)) + 4
       AND NOT EXISTS (
             SELECT 1 FROM MAINTENANCE_NOTIFICATIONS n
              WHERE n.MAINTENANCE_ID = m.ID AND n.KIND = :kind
           )
  ORDER BY m.MAINTENANCE_DATE ASC`;
  const binds = { tz: TIMEZONE, kind: NOTIFY_KIND_D3 };

  const conn = await pool.getConnection();
  try {
    const rs = await conn.execute(sql, binds);
    return rs.rows || [];
  } finally {
    await conn.close();
  }
}

async function insertNotifyLog(
  pool,
  { maintenanceId, kind, recipients, subject, status }
) {
  if (!maintenanceId) return; // cho API custom có thể không log theo maintenanceId
  const sql = `
    INSERT INTO MAINTENANCE_NOTIFICATIONS (MAINTENANCE_ID, KIND, RECIPIENTS, SUBJECT, STATUS)
    VALUES (:mid, :kind, :recipients, :subject, :status)
  `;
  const binds = { mid: maintenanceId, kind, recipients, subject, status };
  const conn = await pool.getConnection();
  try {
    await conn.execute(sql, binds, { autoCommit: true });
  } catch (err) {
    // Nếu đã có (UNIQUE) thì bỏ qua
    if (
      !(
        String(err.message || "")
          .toLowerCase()
          .includes("unique") || err.errorNum === 1
      )
    ) {
      throw err;
    }
  } finally {
    await conn.close();
  }
}

// ---------- Core job ----------
async function processMaintenanceD3(pool, logger = console) {
  const rows = await fetchMaintenancesD3(pool);
  if (!rows.length) {
    logger.log("[MAINT] Không có lịch D+3 hôm nay.");
    return;
  }

  for (const row of rows) {
    const toList = parseEmails(row.MANAGER_EMAILS);
    if (!toList.length) {
      logger.warn(`[MAINT] maintenance ${row.ID} chưa có email người nhận`);
      continue;
    }

    const when = new Date(row.MAINTENANCE_DATE);
    const whenStr = formatLocalHCM(when);
    const subject = `[Maintenance Reminder D-3] ${row.FACTORY || ""} - ${
      row.LINE || ""
    } - ${row.MACHINE_NAME || ""} @ ${whenStr}`;
    const html = buildEmailHtml(row, whenStr);

    const startISO = when.toISOString();
    const endISO = new Date(when.getTime() + 60 * 60 * 1000).toISOString();

    const ics = buildIcsEvent({
      uid: `maintenance-${row.ID}-${NOTIFY_KIND_D3}@yourcompany`,
      summary: `Maintenance: ${row.FACTORY || ""}/${row.LINE || ""}/${
        row.MACHINE_NAME || ""
      }`,
      description: `Bảo dưỡng theo kế hoạch. ${row.NOTE || ""}`,
      startISO,
      endISO,
      location: `${row.FACTORY || "Factory"} - ${row.LINE || ""}`,
    });

    try {
      const sent = await sendEmailWithOptionalIcs({
        toList,
        subject,
        html,
        icsContent: ics,
      });
      await insertNotifyLog(pool, {
        maintenanceId: row.ID,
        kind: NOTIFY_KIND_D3,
        recipients: toList.join(", "),
        subject,
        status: sent.ok ? "SENT" : "FAILED",
      });
      logger.log(`[MAINT] ${row.ID} -> ${sent.ok ? "SENT" : "FAILED"}`);
    } catch (err) {
      logger.error(`[MAINT] ${row.ID} gửi thất bại:`, err.message);
      try {
        await insertNotifyLog(pool, {
          maintenanceId: row.ID,
          kind: NOTIFY_KIND_D3,
          recipients: toList.join(", "),
          subject,
          status: "FAILED",
        });
      } catch (_) {}
    }
  }
}

async function buildExcelBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Top Errors");

  // Khai báo cột (tên cột Excel và key để map dữ liệu)
  ws.columns = [
    { header: "LINE", key: "LINE", width: 10 },
    { header: "LOCATION", key: "LOCATION", width: 10 },
    { header: "MACHINE_NAME", key: "MACHINE_NAME", width: 28 },
    // { header: 'MACHINE_RANK', key: 'MACHINE_RANK', width: 14 },
    {
      header: "TOTAL_TIME_ERROR_MACHINE",
      key: "TOTAL_TIME_ERROR_MACHINE",
      width: 24,
    },
    { header: "TOP5_ERRORS", key: "TOP5_ERRORS", width: 60 },
  ];

  // Thêm dòng
  rows.forEach((r) => {
    // r.top5_errors từ SQL có CHR(10) -> trong Node sẽ là "\n": ExcelJS hiểu xuống dòng
    ws.addRow({
      LINE: r.LINE,
      LOCATION: r.LOCATION,
      MACHINE_NAME: r.MACHINE_NAME,
      // MACHINE_RANK: r.MACHINE_RANK,
      TOTAL_TIME_ERROR_MACHINE: r.TOTAL_TIME_ERROR_MACHINE,
      TOP5_ERRORS: r.TOP5_ERRORS,
    });
  });

  // Style header
  ws.getRow(1).eachCell((c) => {
    c.font = { bold: true };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.border = { bottom: { style: "thin" } };
  });

  // Wrap text cho cột TOP5_ERRORS và căn lề hợp lý
  const top5Col = ws.getColumn("TOP5_ERRORS");
  top5Col.alignment = { wrapText: true, vertical: "top" };

  // Căn lề số/thông tin khác
  ws.getColumn("TOTAL_TIME_ERROR_MACHINE").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  ws.getColumn("MACHINE_NAME").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  ws.getColumn("LOCATION").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  let startRow = 2; // bỏ qua header
  while (startRow <= ws.rowCount) {
    const lineValue = ws.getCell(`A${startRow}`).value; // cột A = LINE
    let endRow = startRow;

    // tìm đoạn liên tiếp cùng LINE
    while (
      endRow + 1 <= ws.rowCount &&
      ws.getCell(`A${endRow + 1}`).value === lineValue
    ) {
      endRow++;
    }

    // nếu có nhiều hàng cùng LINE → merge
    if (endRow > startRow) {
      ws.mergeCells(`A${startRow}:A${endRow}`);
      ws.getCell(`A${startRow}`).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    }

    startRow = endRow + 1;
  }
  await wb.xlsx.writeFile(`./controllers/Maintanance/templates/test.xlsx`);
  // Auto height theo nội dung (Excel tự tính khi mở file)
  return wb.xlsx.writeBuffer();
}

const convertDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date1 = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const formarttedDate = `${year}-${month}-${date1} ${hours}:${minutes}:${seconds}`;
  return formarttedDate;
};

function getCurrentShiftTimeRange(date) {
  const now = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date1 = String(date.getDate()).padStart(2, "0");
  // dinh nghia cac ca lam viec
  const startDayShift = new Date(`${year}-${month}-${date1}T07:30:00`);
  const endDayShift = new Date(`${year}-${month}-${date1}T19:30:00`);
  const startNightShift = new Date(`${year}-${month}-${date1}T19:30:00`);
  const shift = new Date(`${year}-${month}-${date1}T23:59:59`);
  const prevDay = new Date(now);
  prevDay.setDate(prevDay.getDate() - 1);
  prevDay.setHours(19, 30, 0, 0);

  let shiftStart, shiftEnd, shiftName;
  if (now >= startDayShift && now < endDayShift) {
    shiftStart = convertDate(startDayShift);
    shiftEnd = convertDate(endDayShift);
    shiftName = `Ca ngày ${year}-${month}-${date1}`;
  } else {
    shiftStart = convertDate(prevDay);
    shiftEnd = convertDate(startDayShift);
    shiftName = `Ca đêm 19:30-07:00 ${year}-${month}-${date1}`;
  }
  return {
    dateFrom: shiftStart.toString(),
    dateTo: shiftEnd.toString(),
    name: shiftName,
  };
}

const MaintananceController = {
  sendEmailWithOptionalIcs,
  buildExcelBuffer,
  getCurrentShiftTimeRange,
  registerMaintenanceRoutes: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const {
        to,
        subject,
        html,
        text,
        includeIcs,
        startISO,
        endISO,
        summary,
        location,
        maintenanceId,
        kind = "CUSTOM",
      } = req.body || {};

      const toList = Array.isArray(to) ? to : parseEmails(to);
      if (!toList?.length)
        return res.status(400).json({ error: "Missing recipients" });
      if (!subject) return res.status(400).json({ error: "Missing subject" });

      const icsContent =
        includeIcs && startISO && endISO
          ? buildIcsEvent({
              uid: `maintenance-${
                maintenanceId || Date.now()
              }-${kind}@yourcompany`,
              summary,
              description: (text || "").toString(),
              startISO,
              endISO,
              location,
            })
          : null;

      const sent = await sendEmailWithOptionalIcs({
        toList,
        subject,
        html: html || (text ? `<pre>${text}</pre>` : ""),
        icsContent,
      });

      //   if (maintenanceId) {
      //     await insertNotifyLog(pool, {
      //       maintenanceId, kind,
      //       recipients: toList.join(', '), subject,
      //       status: sent.ok ? 'SENT' : 'FAILED'
      //     });
      //   }

      return res.json(sent);
    } catch (err) {
      console.error("[sendMail] error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },
  getMachineAnalysisDaily: async (date) => {
    const pool = global.oraclePool;
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await pool.getConnection();
      const sql = `
      WITH filtered AS (
        SELECT *
        FROM fatp_machine_data
        WHERE status = 'ERROR'
          AND START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
                              AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
      ),
      machine_agg AS (
        SELECT
          line,
          location,
          machine_name,
          SUM(time) AS total_time_error_machine
        FROM filtered
        GROUP BY line, location, machine_name
      ),
      top3_machines AS (
        SELECT
          m.*,
          DENSE_RANK() OVER (PARTITION BY line ORDER BY total_time_error_machine DESC) AS machine_rank
        FROM machine_agg m
      ),
      error_agg AS (
        SELECT
          line,
          location,
          machine_name,
          NVL(error_type, '(UNKNOWN)') AS error_type,
          SUM(time) AS total_time_error_type
        FROM filtered
        GROUP BY line, location, machine_name, NVL(error_type, '(UNKNOWN)')
      ),
      ranked_errors AS (
        SELECT
          t.line,
          t.location,
          t.machine_name,
          t.total_time_error_machine,
          t.machine_rank,
          e.error_type,
          e.total_time_error_type,
          DENSE_RANK() OVER (
            PARTITION BY t.line, t.location, t.machine_name
            ORDER BY e.total_time_error_type DESC
          ) AS error_rank
        FROM top3_machines t
        JOIN error_agg e
          ON e.line = t.line
        AND e.location = t.location
        AND e.machine_name = t.machine_name
        WHERE t.machine_rank <= 3
      )
      SELECT
        line,
        location,
        machine_name,
        NVL(TO_CHAR(ROUND(total_time_error_machine / 60, 2), 'FM9999990.00'), '0') || ' phút' AS total_time_error_machine,
        CASE
          WHEN COUNT(*) = 0 THEN '(no errors)'
          ELSE
            '- ' ||
            LISTAGG(
              error_type || ' (' || NVL(TO_CHAR(ROUND(total_time_error_type / 60, 2), 'FM9999990.00'), '0') || ' phút)',
              CHR(10) || ' - '
            ) WITHIN GROUP (ORDER BY total_time_error_type DESC)
        END AS top5_errors
      FROM ranked_errors
      WHERE error_rank <= 5
      GROUP BY
        line, location, machine_name, machine_rank, total_time_error_machine
      ORDER BY line, machine_rank, total_time_error_machine DESC
      `;

      const resultOracle = await connection.execute(sql, {
        dateFrom: date.dateFrom || timeR.dateFrom,
        dateTo: date.dateTo || timeR.dateTo,
      });
      return resultOracle.rows;
    } catch (err) {
      console.error("Error fetching: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = MaintananceController;
