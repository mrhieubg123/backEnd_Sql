// jobs/maintenance.js
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const oracledb = require("oracledb");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { checkServerIdentity } = require("tls");
const XlsxPopulate = require("xlsx-populate");
const path = require("path");
const TIMEZONE = process.env.TZ || "Asia/Ho_Chi_Minh";
const CRON_EXPR = process.env.MAINTENANCE_CRON || "0 8 * * *"; // 08:00 hàng ngày
const NOTIFY_KIND_D3 = "D-3";

const LIST_BP_SIGNATURE = {
  'PTH': 'cpe-vn-me-automation@mail.foxconn.com',
  'PM': 'cpe-vn-me-automation@mail.foxconn.com',
  'TE': 'cpe-vn-me-automation@mail.foxconn.com',
  'ME': 'cpe-vn-me-automation@mail.foxconn.com',
  'PQE': 'cpe-vn-me-automation@mail.foxconn.com',
  'PE': 'cpe-vn-me-automation@mail.foxconn.com',
  'PD': 'cpe-vn-me-automation@mail.foxconn.com',
  'QA': '',
  'QC': 'cpe-vn-me-automation@mail.foxconn.com',
  'R&D': 'cpe-vn-me-automation@mail.foxconn.com',
  'SQE': 'cpe-vn-me-automation@mail.foxconn.com',
  'PP': '',
  'MFG': '',
  'IE': '',
  'MET': '',
  'FQC': '',
  'PROD': '',
};

const MAIL_RATE = {
  rateDelta: 60000, // trong 60 giây
  rateLimit: 25, // tối đa 25 mail/60s (chỉnh tùy server bạn)
  maxConnections: 1, // 1 kết nối ổn định
  maxMessages: 100, // tối đa 100 mail mỗi kết nối trước khi recycle
};
// ---------- Mailer ----------
function createTransporter() {
  const tls = {
    servername: process.env.SMTP_SERVERNAME || process.env.SMTP_HOST,
    minVersion: "TLSv1.2",
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  };
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
    logger: true,
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
    html: finalHtml,
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
async function fetchMaintenancesD3() {
  const sql = `
    SELECT line, date_check
      FROM checklist_result_detail 
     WHERE to_date(date_check,'YYYY-MM-DD') >= TRUNC(CAST(SYSTIMESTAMP AS DATE)) + 2
       AND to_date(date_check,'YYYY-MM-DD') <  TRUNC(CAST(SYSTIMESTAMP AS DATE)) + 3
       group by line, date_check
  ORDER BY line`;

  const pool = global.oraclePool;
  const conn = await pool.getConnection();
  try {
    const rs = await conn.execute(sql);
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

function renderResponsePage(title, message, isSuccess = true) {
  const bgColor = isSuccess ? "#e8f5e9" : "#ffebee";
  const iconColor = isSuccess ? "#2e7d32" : "#c62828";
  const icon = isSuccess ? "✓" : "✗";

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .card {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          text-align: center;
          max-width: 450px;
          width: 90%;
        }
        .icon-circle {
          width: 72px;
          height: 72px;
          background-color: ${bgColor};
          color: ${iconColor};
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 36px;
          font-weight: bold;
          margin: 0 auto 24px;
        }
        h1 {
          color: #333333;
          margin: 0 0 16px;
          font-size: 24px;
        }
        p {
          color: #666666;
          line-height: 1.6;
          margin: 0 0 30px;
          font-size: 16px;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          color: #ffffff;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(25, 118, 210, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(25, 118, 210, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-circle">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="javascript:window.close()" class="btn">Đóng Cửa Sổ</a>
      </div>
    </body>
    </html>
  `;
}

async function sendApprovalRequestEmail({ req, id, bp, line, factory, note, document }) {
  const email = LIST_BP_SIGNATURE[bp];
  if (!email) return;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const acceptLink = `${baseUrl}/api/maintenance/approvalFATPMaintenance?id=${id}&bp=${bp}&action=accept`;
  const denyLink = `${baseUrl}/api/maintenance/approvalFATPMaintenance?id=${id}&bp=${bp}&action=deny`;

  const subject = `[FATP Maintenance Approval] Yêu cầu ký duyệt bảo trì Line ${line} - Bộ phận ${bp}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Yêu Cầu Ký Duyệt Bảo Trì</h2>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Bộ phận cần phê duyệt: <strong style="color: #ffe082;">${bp}</strong></p>
      </div>
      <div style="padding: 24px; background-color: #fafafa; color: #333333; line-height: 1.6;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 30%;"><strong>Mã ID:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">#${id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Factory:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${factory || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Line:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1976d2;">${line || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; vertical-align: top;"><strong>Ghi chú:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; white-space: pre-wrap;">${note || "Không có ghi chú."}</td>
          </tr>
          ${document ? `
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; vertical-align: top;"><strong>Tài liệu đính kèm:</strong></td>
            <td style="padding: 8px 0; font-size: 14px;">${document.split(',').map(d => `<a href="${baseUrl}/${d}" target="_blank" style="color: #1976d2; text-decoration: none; word-break: break-all;">[Xem tài liệu/ảnh]</a>`).join('<br/>')}</td>
          </tr>` : ''}
        </table>
        <p style="font-size: 14px; margin-bottom: 24px; color: #555555; text-align: center; font-style: italic;">Vui lòng kiểm tra thông tin và chọn một trong hai hành động dưới đây:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptLink}" style="display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; color: #ffffff; background-color: #2e7d32; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(46,125,50,0.2); margin-right: 15px; text-decoration: none;">Đồng Ý (Accept)</a>
          <a href="${denyLink}" style="display: inline-block; padding: 12px 30px; font-size: 14px; font-weight: bold; color: #ffffff; background-color: #c62828; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(198,40,40,0.2); text-decoration: none;">Từ Chối (Deny)</a>
        </div>
      </div>
      <div style="background-color: #f1f1f1; padding: 16px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0;">Email tự động gửi từ Hệ thống Quản lý Bảo dưỡng.</p>
        <p style="margin: 4px 0 0;">Vui lòng không trả lời trực tiếp email này.</p>
      </div>
    </div>
  `;

  await sendEmailWithOptionalIcs({
    toList: [email],
    subject,
    html
  });
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
    const subject = `[Maintenance Reminder D-3] ${row.FACTORY || ""} - ${row.LINE || ""
      } - ${row.MACHINE_NAME || ""} @ ${whenStr}`;
    const html = buildEmailHtml(row, whenStr);

    const startISO = when.toISOString();
    const endISO = new Date(when.getTime() + 60 * 60 * 1000).toISOString();

    const ics = buildIcsEvent({
      uid: `maintenance-${row.ID}-${NOTIFY_KIND_D3}@yourcompany`,
      summary: `Maintenance: ${row.FACTORY || ""}/${row.LINE || ""}/${row.MACHINE_NAME || ""
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
      } catch (_) { }
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

async function buildExcelBuffer2(rows) {
  const template = path.resolve(
    "./controllers/Maintanance/templates/top_error_template.xlsx"
  );
  const outPath = path.resolve(
    "./controllers/Maintanance/templates/test1.xlsx"
  );

  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  // Mở file mẫu và ghi dữ liệu vào sheet "Data"
  const wb = await XlsxPopulate.fromFileAsync(template);
  const ws = wb.sheet("Data");
  const ws1 = wb.sheet("Availability");
  const ws2 = wb.sheet("Top5Error");

  // Template đang dùng 3 cột: A=LINE, B=MACHINE_NAME, C=TOTAL_TIME_ERROR_MACHINE
  // (Chart đọc B2:B1001 và C2:C1001)
  // → Xóa vùng cũ rồi ghi mới (không xóa/di chuyển hàng 1 vì là header)
  ws.range("A2:E1001").clear();
  ws1.range("B2:B1001").clear();
  ws2.range("A2:B1001").clear();

  rows[0].forEach((r, idx) => {
    const row = 2 + idx;
    ws.cell(`A${row}`).value(r.LINE ?? "");
    ws.cell(`B${row}`).value(r.LOCATION ?? "");
    ws.cell(`C${row}`).value(r.MACHINE_NAME ?? "");
    ws.cell(`D${row}`).value(Number(r.TOTAL_TIME_ERROR_MACHINE) || 0);
    ws.cell(`E${row}`).value(r.TOP5_ERRORS ?? "");
  });

  rows[1].forEach((r, idx) => {
    ws1.cell(`B${2}`).value(Number(r.AVAILABILITY) || 0);
    ws1.cell(`B${3}`).value(Number(r.DOWNTIME) || 0);
  });

  rows[2].forEach((r, idx) => {
    const row = 2 + idx;
    ws2.cell(`A${row}`).value(r.ERROR_TYPE ?? "");
    ws2.cell(`B${row}`).value(Number(r.TOTAL_ERROR_HOURS) || 0);
  });

  // Lưu file: chart vẫn còn nguyên
  await wb.toFileAsync(outPath);

  // Nếu bạn vẫn muốn lấy buffer trả về:
  const buffer = await wb.outputAsync(); // Buffer
  return buffer;
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

function getAllDayOfYear(date) {
  const year = date.getFullYear();
  return {
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`,
  };
}

function getMaintenancePlanOngoing() { }

const MaintananceController = {
  sendEmailWithOptionalIcs,
  buildExcelBuffer,
  buildExcelBuffer2,
  getCurrentShiftTimeRange,
  fetchMaintenancesD3,
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
            uid: `maintenance-${maintenanceId || Date.now()
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
        FROM fatp_machine_data f
        WHERE status = 'ERROR'
          AND ( :line IS NULL OR f.line = :line )
          AND START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
                              AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
          AND NOT EXISTS (
                  SELECT 1
                  FROM   over_time_data m
                  WHERE  m.line = f.line
                    AND  m.type = 'Maintenance'
                    AND  f.start_time < m.end_time
                    AND  f.start_time  > m.start_time
                )
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
        NVL(TO_CHAR(ROUND(total_time_error_machine / 60, 2), 'FM9999990.00'), '0') AS total_time_error_machine,
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
        line: date.line?.[0]?.LINE || null,
      });
      const sql1 = `
        SELECT
          ROUND(SUM(CASE WHEN STATUS = 'RUN'
                        THEN (NVL(END_TIME, SYSDATE) - START_TIME) * 24
                        ELSE 0 END), 2) AS Availability,
          ROUND(SUM(CASE WHEN STATUS = 'ERROR'
                        THEN (NVL(END_TIME, SYSDATE) - START_TIME) * 24
                        ELSE 0 END), 2) AS DownTime
        FROM FATP_MACHINE_DATA f
        WHERE START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
          AND ( :line IS NULL OR f.line = :line )
          AND NOT EXISTS (
                  SELECT 1
                  FROM   over_time_data m
                  WHERE  m.line = f.line
                    AND  m.type = 'Maintenance'
                    AND  f.start_time < m.end_time
                    AND  f.start_time  > m.start_time
                )
      `;
      const resultOracle1 = await connection.execute(sql1, {
        dateFrom: date.dateFrom || timeR.dateFrom,
        line: date.line?.[0]?.LINE || null,
        dateTo: date.dateTo || timeR.dateTo,
      });
      const sql2 = `
        SELECT
          ERROR_TYPE,
          ROUND(SUM( (NVL(END_TIME, SYSDATE) - START_TIME) * 24 ), 2) AS TOTAL_ERROR_HOURS
        FROM FATP_MACHINE_DATA
        WHERE STATUS = 'ERROR'
          AND ( :line IS NULL OR line = :line )
          AND START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
        GROUP BY ERROR_TYPE
        ORDER BY TOTAL_ERROR_HOURS DESC
        FETCH FIRST 5 ROWS ONLY
      `;
      console.log(date);
      const resultOracle2 = await connection.execute(sql2, {
        dateFrom: date.dateFrom || timeR.dateFrom,
        line: date.line?.[0]?.LINE || null,
        dateTo: date.dateTo || timeR.dateTo,
      });
      // buildExcelBuffer2([resultOracle.rows,resultOracle1.rows]);
      return [resultOracle.rows, resultOracle1.rows, resultOracle2.rows];
    } catch (err) {
      console.error("Error fetching: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  getMachineAnalysisDailyApi: async (req, res) => {
    const pool = global.oraclePool;
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `
      WITH filtered AS (
        SELECT *
        FROM fatp_machine_data f
        WHERE status = 'ERROR'
          AND START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
                              AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
          AND NOT EXISTS (
                  SELECT 1
                  FROM   over_time_data m
                  WHERE  m.line = f.line
                    AND  m.type = 'Maintenance'
                    AND  f.start_time < m.end_time
                    AND  f.start_time  > m.start_time
                )
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
        NVL(TO_CHAR(ROUND(total_time_error_machine / 60, 2), 'FM9999990.00'), '0') AS total_time_error_machine,
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
        dateFrom: req.body.dateFrom || timeR.dateFrom,
        dateTo: req.body.dateTo || timeR.dateTo,
      });
      const sql1 = `
        SELECT
          ROUND(SUM(CASE WHEN STATUS = 'RUN'
                        THEN (NVL(END_TIME, SYSDATE) - START_TIME) * 24
                        ELSE 0 END), 2) AS Availability,
          ROUND(SUM(CASE WHEN STATUS = 'ERROR'
                        THEN (NVL(END_TIME, SYSDATE) - START_TIME) * 24
                        ELSE 0 END), 2) AS DownTime
        FROM FATP_MACHINE_DATA f
        WHERE START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
          AND NOT EXISTS (
                  SELECT 1
                  FROM   over_time_data m
                  WHERE  m.line = f.line
                    AND  m.type = 'Maintenance'
                    AND  f.start_time < m.end_time
                    AND  f.start_time  > m.start_time
                )
      `;
      const resultOracle1 = await connection.execute(sql1, {
        dateFrom: req.body.dateFrom || timeR.dateFrom,
        dateTo: req.body.dateTo || timeR.dateTo,
      });
      const sql2 = `
        SELECT
          ERROR_TYPE,
          ROUND(SUM( (NVL(END_TIME, SYSDATE) - START_TIME) * 24 ), 2) AS TOTAL_ERROR_HOURS
        FROM FATP_MACHINE_DATA
        WHERE STATUS = 'ERROR'
          AND START_TIME BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')
        GROUP BY ERROR_TYPE
        ORDER BY TOTAL_ERROR_HOURS DESC
        FETCH FIRST 5 ROWS ONLY
      `;
      const resultOracle2 = await connection.execute(sql2, {
        dateFrom: req.body.dateFrom || timeR.dateFrom,
        dateTo: req.body.dateTo || timeR.dateTo,
      });
      buildExcelBuffer2([
        resultOracle.rows,
        resultOracle1.rows,
        resultOracle2.rows,
      ]);
      return res.json({
        data1: resultOracle.rows,
        data2: resultOracle1.rows,
        data3: resultOracle2.rows,
      });
    } catch (err) {
      console.error("Error fetching: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  getMaintenancePlanApi: async (req, res) => {
    const pool = global.oraclePool;
    let connection;
    try {
      const now = new Date();
      const timeR = getAllDayOfYear(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `SELECT * FROM checklist_result_detail 
      where TO_DATE(date_check,'YYYY-MM-DD') 
        BETWEEN TO_DATE(:dateFrom,'YYYY-MM-DD') and TO_DATE(:dateTo,'YYYY-MM-DD')
        and id in (SELECT max(id) FROM checklist_result_detail group by name_machine, line, code_machine, qr_code, date_check)`;
      const resultOracle = await connection.execute(sql, {
        dateFrom: req.body.dateFrom || timeR.dateFrom,
        dateTo: req.body.dateTo || timeR.dateTo,
      });
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getMaintenancePlanApi: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  getFATPMaintenance: async (req, res) => {
    const pool = global.oraclePool;
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `select m.ID,m.FACTORY,m.LINE,m.LOCATION,m.CATEGORY,m.MACHINE_TYPE,
        m.MACHINE_NAME,c.STATUS,c.NOTE,c.DOCUMENT,c.DATE_CHECK,c.UPDATED_AT 
        from machine_list m
        LEFT JOIN fatp_maintenance_result_data c
            ON c.line = m.line 
            and m.factory = c.factory
            and c.date_check >= TRUNC(SYSDATE, 'MM')
            and c.date_check < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
            where m.factory = :factory`;
      const resultOracle = await connection.execute(sql, {
        factory: req.body.factory || "A02",
      });
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getFATPMaintenance: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  getFATPMaintenanceMultiMonth: async (req, res) => {
    const pool = global.oraclePool;
    let connection;
    try {
      const now = new Date();
      const timeR = getAllDayOfYear(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `select m.ID,m.FACTORY,m.LINE,m.LOCATION,m.CATEGORY,m.MACHINE_TYPE,
        m.MACHINE_NAME,c.STATUS,c.NOTE,c.DOCUMENT,c.DATE_CHECK,c.UPDATED_AT 
        from machine_list m
        LEFT JOIN fatp_maintenance_result_data c
            ON c.line = m.line 
            and m.factory = c.factory
            and TRUNC(c.date_check) 
              BETWEEN TO_DATE(:dateFrom,'YYYY-MM-DD') and TO_DATE(:dateTo,'YYYY-MM-DD')
            where m.factory = :factory`;
      const resultOracle = await connection.execute(sql, {
        factory: req.body.factory || "A02",
        dateFrom: req.body.dateFrom || timeR.dateFrom,
        dateTo: req.body.dateTo || timeR.dateTo,
      });
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getFATPMaintenanceMultiMonth: ", err);
      return null;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  addFATPMaintenancePlan: async (req, res) => {
    let connection;
    try {
      const { line, note, factory, idConfirm } = req.body;
      const files = req.files || [];
      const document = files.map(file => `uploads/imageMaintenance/${file.filename}`).join(',');
      const stages = Object.keys(LIST_BP_SIGNATURE)
        .filter(key => {
          const val = LIST_BP_SIGNATURE[key];
          return val !== "" && val !== null;
        })
        .map(key => ({
          key: key,
          label: key
        }));

      const initialStatus = stages[0]?.key || 'ME';

      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `INSERT INTO fatp_maintenance_result_data 
      (LINE, FACTORY, NOTE, STATUS, DOCUMENT, IDCONFIRM)
        VALUES (:line, :factory, :note, :status, :document, :idConfirm)
        RETURNING ID INTO :out_id`;

      const resultOracle = await connection.execute(sql, {
        line: line,
        factory: factory,
        note: note,
        status: initialStatus,
        document: document,
        idConfirm: idConfirm,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }, {
        autoCommit: true,
      });

      const newId = resultOracle.outBinds?.out_id?.[0] ?? null;

      // Send initial approval email to the first stage
      if (newId && initialStatus) {
        try {
          await sendApprovalRequestEmail({
            req,
            id: newId,
            bp: initialStatus,
            line,
            factory,
            note,
            document
          });
        } catch (mailErr) {
          console.error("Failed to send initial approval email:", mailErr);
        }
      }

      return res.json({
        id: newId,
        line,
        status: initialStatus,
        factory,
        note,
        document,
      });
    } catch (err) {
      console.error("Error executing addFATPMaintenancePlan: ", err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  updateFATPMaintenancePlan: async (req, res) => {
    let connection;
    try {
      const { id, status } = req.body;

      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `UPDATE fatp_maintenance_result_data 
      SET STATUS = :status
      WHERE ID = :id`;
      const resultOracle = await connection.execute(sql, {
        status: status,
        id: id,
      }, {
        autoCommit: true,
      });

      return res.json({
        id,
        status,
      });
    } catch (err) {
      console.error("Error executing updateFATPMaintenancePlan: ", err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  approvalFATPMaintenancePlan: async (req, res) => {
    let connection;
    try {
      const { id, bp, action } = req.query;

      if (!id || !bp || !action) {
        return res.status(400).send(renderResponsePage("Lỗi Yêu Cầu", "Thiếu tham số (id, bp, action).", false));
      }

      const cleanAction = action.trim().toLowerCase();
      if (cleanAction !== "accept" && cleanAction !== "deny") {
        return res.status(400).send(renderResponsePage("Lỗi Yêu Cầu", "Hành động (action) không hợp lệ.", false));
      }

      // Check if bp is a key in LIST_BP_SIGNATURE
      if (!LIST_BP_SIGNATURE.hasOwnProperty(bp)) {
        return res.status(400).send(renderResponsePage("Lỗi Yêu Cầu", `Bộ phận '${bp}' không hợp lệ.`, false));
      }

      const validBps = Object.keys(LIST_BP_SIGNATURE).filter(
        key => LIST_BP_SIGNATURE[key] !== "" && LIST_BP_SIGNATURE[key] !== null
      );

      connection = await req.app.locals.oraclePool.getConnection();

      // Fetch the plan details to verify it exists and get properties
      const fetchSql = `SELECT LINE, FACTORY, NOTE, DOCUMENT, STATUS FROM fatp_maintenance_result_data WHERE ID = :id`;
      const fetchResult = await connection.execute(fetchSql, { id });

      if (!fetchResult.rows || fetchResult.rows.length === 0) {
        return res.status(404).send(renderResponsePage("Không Tìm Thấy", "Không tìm thấy kế hoạch bảo trì tương ứng.", false));
      }

      const row = fetchResult.rows[0];
      const { LINE, FACTORY, NOTE, DOCUMENT, STATUS } = row;

      // Check if it's already approved or denied
      if (STATUS === 'OK' || STATUS === 'Approved') {
        return res.send(renderResponsePage("Đã Phê Duyệt", `Kế hoạch bảo trì Line ${LINE} đã được hoàn thành duyệt toàn bộ trước đó.`, true));
      }

      if (STATUS && STATUS.toLowerCase().startsWith('deny')) {
        return res.send(renderResponsePage("Đã Từ Chối", `Kế hoạch bảo trì Line ${LINE} đã bị từ chối trước đó (${STATUS}).`, false));
      }

      const bpIndex = validBps.indexOf(bp);

      if (cleanAction === "accept") {
        // Enforce sequence: cannot sign off if the database status is already ahead of or behind this bp.
        if (STATUS !== bp) {
          const dbIndex = validBps.indexOf(STATUS);
          if (dbIndex > bpIndex) {
            return res.send(renderResponsePage("Đã Ký Duyệt", `Bộ phận ${bp} đã ký duyệt bước này trước đó. Trạng thái hiện tại: ${STATUS}.`, true));
          }
          return res.status(400).send(renderResponsePage("Không Đúng Lượt", `Chưa đến lượt ký duyệt của bộ phận ${bp}. Trạng thái hiện tại: ${STATUS}.`, false));
        }

        // Check if bp is the last key
        if (bpIndex === validBps.length - 1) {
          // Last stage: update status to OK
          const updateSql = `UPDATE fatp_maintenance_result_data SET STATUS = 'OK' WHERE ID = :id`;
          await connection.execute(updateSql, { id }, { autoCommit: true });

          return res.send(renderResponsePage("Hoàn Tất Phê Duyệt", `Kế hoạch bảo trì Line ${LINE} đã được duyệt hoàn tất thành công bởi tất cả bộ phận.`));
        } else {
          // Not the last stage: move to next bp
          const nextBp = validBps[bpIndex + 1];
          const nextEmail = LIST_BP_SIGNATURE[nextBp];

          const updateSql = `UPDATE fatp_maintenance_result_data SET STATUS = :nextBp WHERE ID = :id`;
          await connection.execute(updateSql, { nextBp, id }, { autoCommit: true });

          // Send email to next bp
          try {
            await sendApprovalRequestEmail({
              req,
              id,
              bp: nextBp,
              line: LINE,
              factory: FACTORY,
              note: NOTE,
              document: DOCUMENT
            });
          } catch (mailErr) {
            console.error(`Failed to send approval email to next department (${nextBp}):`, mailErr);
          }

          return res.send(renderResponsePage("Đã Phê Duyệt", `Bạn đã duyệt thành công bước này (${bp}). Đã chuyển yêu cầu và gửi email phê duyệt đến bộ phận tiếp theo: ${nextBp} (${nextEmail}).`));
        }
      } else if (cleanAction === "deny") {
        // Deny: update status to 'Deny by BP'
        const denyStatus = `Deny by ${bp}`;
        const updateSql = `UPDATE fatp_maintenance_result_data SET STATUS = :status WHERE ID = :id`;
        await connection.execute(updateSql, { status: denyStatus, id }, { autoCommit: true });

        return res.send(renderResponsePage("Đã Từ Chối", `Bạn đã từ chối phê duyệt kế hoạch bảo trì Line ${LINE}. Trạng thái đã được cập nhật thành "${denyStatus}".`, false));
      }
    } catch (err) {
      console.error("Error executing approvalFATPMaintenancePlan: ", err);
      return res.status(500).send(renderResponsePage("Lỗi Hệ Thống", `Đã xảy ra lỗi trong quá trình xử lý: ${err.message}`, false));
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = MaintananceController;
