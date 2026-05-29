// import dayjs from 'dayjs';

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
const convertDate2 = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date1 = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const formarttedDate = `${year}-${month}-${date1}`;
  return formarttedDate;
};

const convertDate2plus1 = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date1 = String(date.getDate() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const formarttedDate = `${year}-${month}-${date1}`;
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
    shiftName = "ca ngay";
  } else if (now >= startNightShift && now < shift) {
    shiftStart = convertDate(startNightShift);
    shiftEnd = convertDate(shift);
    shiftName = "ca dem 19:30-00:00";
  } else {
    shiftStart = convertDate(prevDay);
    shiftEnd = convertDate(startDayShift);
    shiftName = "ca dem 19:30-07:00";
  }
  return {
    dateFrom: shiftStart.toString(),
    dateTo: shiftEnd.toString(),
    name: shiftName,
  };
}
function getCurrentShiftOnDay(date) {
  const now = new Date(date.replace(" ", "T"));
  const idate = new Date(date.replace(" ", "T"));
  const year = idate.getFullYear();
  const month = String(idate.getMonth() + 1).padStart(2, "0");
  const date1 = String(idate.getDate()).padStart(2, "0");
  const date1cong1 = String(idate.getDate() + 1).padStart(2, "0");
  const date1tru1 = String(idate.getDate() - 1).padStart(2, "0");
  const startDayShiftcong1 = new Date(
    `${year}-${month}-${date1cong1}T07:30:00`,
  );
  const startDayShifttru1 = new Date(`${year}-${month}-${date1tru1}T07:30:00`);
  // dinh nghia cac ca lam viec
  const startDayShift = new Date(`${year}-${month}-${date1}T07:30:00`);
  const shift = new Date(`${year}-${month}-${date1}T00:00:00`);
  const prevDay = new Date(now);
  prevDay.setDate(prevDay.getDate() - 1);
  prevDay.setHours(19, 30, 0, 0);
  let shiftStart, shiftEnd, shiftName;
  if (now > shift && now < startDayShift) {
    shiftStart = convertDate(startDayShifttru1);
    shiftEnd = convertDate(startDayShift);
    shiftName = "ca 2";
  } else {
    shiftStart = convertDate(startDayShift);
    shiftEnd = convertDate(startDayShiftcong1);
    shiftName = "ca 1";
  }
  return {
    dateFrom: shiftStart.toString(),
    dateTo: shiftEnd.toString(),
    name: shiftName,
  };
}

function getCurrentTime30(date) {
  const now = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date1 = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");

  // dinh nghia cac ca lam viec
  const startTime1 = new Date(`${year}-${month}-${date1}T${hours}:30:00`);
  startTime1.setHours(startTime1.getHours() - 2);
  const endTime1 = new Date(`${year}-${month}-${date1}T${hours}:30:00`);
  endTime1.setHours(endTime1.getHours() - 1);
  const startTime2 = new Date(`${year}-${month}-${date1}T${hours}:30:00`);
  startTime2.setHours(startTime2.getHours() - 1);
  const endTime2 = new Date(`${year}-${month}-${date1}T${hours}:30:00`);
  const Time = new Date(`${year}-${month}-${date1}T${hours}:30:00`);
  const prevDay = new Date(now);

  prevDay.setDate(prevDay.getDate() - 1);
  prevDay.setHours(19, 30, 0, 0);
  let shiftStart, shiftEnd;
  if (now < Time) {
    shiftStart = convertDate(startTime1);
    shiftEnd = convertDate(endTime1);
  } else {
    shiftStart = convertDate(startTime2);
    shiftEnd = convertDate(endTime2);
  }

  return {
    dateFrom: shiftStart.toString(),
    dateTo: shiftEnd.toString(),
  };
}
function getCurrentDayPlusOne(date) {
  const date21 = new Date(date);
  const year = date21.getFullYear();
  const month = String(date21.getMonth() + 1).padStart(2, "0");
  const date1 = String(date21.getDate()).padStart(2, "0");
  const hours = String(date21.getHours()).padStart(2, "0");
  const startTime1 = new Date(`${year}-${month}-${date1}`);
  startTime1.setDate(startTime1.getDate() + 1);
  const year12 = startTime1.getFullYear();
  const month12 = String(startTime1.getMonth() + 1).padStart(2, "0");
  const date112 = String(startTime1.getDate()).padStart(2, "0");
  return `${year12}-${month12}-${date112}`;
}

function convertArrToStr(arr) {
  const isArray = Array.isArray(arr);
  const queryArray = isArray ? arr : [];
  return queryArray.length > 0 ? arr.map((item) => `'${item}'`).join(`,`) : "";
}

async function getHeartBeatLine() {
  const sql = `
    SELECT line, TO_CHAR(MAX(datetime), 'YYYY-MM-DD HH24:MI:SS') AS last_dt
    FROM FATP_MACHINE_DATA_CONNECT
    WHERE line IS NOT NULL
    GROUP BY line
    HAVING MAX(datetime) < (SYSTIMESTAMP - INTERVAL '22' MINUTE)`;

  const pool = global.oraclePool;
  if (!pool) {
    console.error("global.oraclePool is undefined");
    return [];
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rs = await conn.execute(sql);
    return rs.rows || [];
  } catch (err) {
    console.error("Error fetching getHeartBeatLine: ", err);
    return [];
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

const FATPController = {
  getHeartBeatLine,
  getFATPMachineStatus: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const factoryCondition2 = `f.factory='${factory}'`;

      //connect oracle
      connection = await req.app.locals.oraclePool.getConnection();
      // 1. Lấy danh sách distinct location
      const locResult = await connection.execute(`
        SELECT DISTINCT location FROM PTHNEW.FATP_MACHINE_DATA where ${factoryCondition1} order by TO_NUMBER(LOCATION)
      `);

      // 2. Xây chuỗi location cho pivot
      const locations = locResult.rows.map((row) => row.LOCATION);
      const pivotCols = locations.map((l) => `'M${l}' AS "M${l}"`).join(",");
      const resultOracle = await connection.execute(`
       WITH conn AS (
          SELECT line,
                MAX(datetime) AS last_dt
          FROM FATP_MACHINE_DATA_CONNECT
          where ${factoryCondition1}
          GROUP BY line
        )
        SELECT *
        FROM (
          SELECT
              f.line,
              'M' || f.location AS loc,
              (
                CASE
                  -- Line mất heartbeat > 15 phút => OFF toàn line
                  ---WHEN c.last_dt IS NULL
                  ---    OR c.last_dt < (SYSTIMESTAMP - INTERVAL '22' MINUTE)
                  ---THEN 'OFF'

                  -- Line đang Maintenance => OFF
                  WHEN EXISTS (
                    SELECT 1
                    FROM OVER_TIME_DATA o
                    WHERE o.line = f.line
                      AND f.factory = o.factory
                      AND o.type = 'Maintenance'
                      AND SYSTIMESTAMP BETWEEN o.start_time
                                          AND NVL(o.end_time, TIMESTAMP '9999-12-31 23:59:59')
                  )
                  THEN 'OFF'

                  ELSE f.status
                END
              )
              || '-/-' || f.machine_type
              || '-/-' || f.machine_name
              || '-/-' || 
              ( 
                case 
                  -- Line mất heartbeat > 15 phút => OFF toàn line
                  WHEN c.last_dt IS NULL
                      OR c.last_dt < (SYSTIMESTAMP - INTERVAL '22' MINUTE)
                  THEN 'Program turn off'
                  else f.error_type
                end
              )
              || '-/-' || f.error_code
              || '-/-' || TO_CHAR(f.start_time, 'YYYY-MM-DD HH24:MI:SS') || '-/-' || f.category AS val 
          FROM FATP_MACHINE_DATA f
          LEFT JOIN conn c
            ON c.line = f.line
          WHERE ${factoryCondition2} and f.start_time = (
            SELECT MAX(f2.start_time)
            FROM FATP_MACHINE_DATA f2
            WHERE f2.line = f.line
              AND f2.location = f.location
          )
        ) src
        PIVOT (
          MAX(val) FOR loc IN (${pivotCols})
        )
        ORDER BY line
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineFPY: async (req, res) => {
    let connection;
    try {
      const { line, location, dateFrom, dateTo, factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      connection = await req.app.locals.oraclePool.getConnection();

      let sql = `select * from FATP_MACHINE_FPY_DATA`;
      const binds = {};
      const conditions = [`${factoryCondition1}`];

      if (line !== null && line !== undefined && line !== "") {
        conditions.push(`line = :line`);
        binds.line = line;
      }

      if (location !== null && location !== undefined && location !== "") {
        conditions.push(`location = :location`);
        binds.location = location;
      }

      if (
        (dateFrom === null || dateFrom === undefined || dateFrom === "") &&
        (dateTo === null || dateTo === undefined || dateTo === "")
      ) {
        conditions.push(`CREATED_AT >= TRUNC(SYSDATE)`);
        conditions.push(`CREATED_AT < TRUNC(SYSDATE) + 1`);
      } else {
        if (dateFrom !== null && dateFrom !== undefined && dateFrom !== "") {
          conditions.push(
            `CREATED_AT > TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')`,
          );
          binds.dateFrom = dateFrom;
        }

        if (dateTo !== null && dateTo !== undefined && dateTo !== "") {
          conditions.push(
            `CREATED_AT < TO_DATE(:dateTo, 'YYYY-MM-DD HH24:MI:SS')`,
          );
          binds.dateTo = dateTo;
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(" AND ");
      }

      const resultOracle = await connection.execute(sql, binds);

      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getFATPMachineFPY: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getMinCycleTimeAndLatestRow: async (req, res) => {
    let connection;
    try {
      const { line, location, dateFrom, dateTo, factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      connection = await req.app.locals.oraclePool.getConnection();

      const binds = {};
      const conditions = [`${factoryCondition1}`];

      if (line !== null && line !== undefined && line !== "") {
        conditions.push(`LINE = :line`);
        binds.line = line;
      }

      if (location !== null && location !== undefined && location !== "") {
        conditions.push(`LOCATION = :location`);
        binds.location = location;
      }

      if (
        (dateFrom === null || dateFrom === undefined || dateFrom === "") &&
        (dateTo === null || dateTo === undefined || dateTo === "")
      ) {
        conditions.push(`CREATED_AT >= TRUNC(SYSDATE)`);
        conditions.push(`CREATED_AT < TRUNC(SYSDATE) + 1`);
      } else {
        if (dateFrom !== null && dateFrom !== undefined && dateFrom !== "") {
          conditions.push(
            `CREATED_AT > TO_TIMESTAMP(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')`,
          );
          binds.dateFrom = dateFrom;
        }

        if (dateTo !== null && dateTo !== undefined && dateTo !== "") {
          conditions.push(
            `CREATED_AT < TO_TIMESTAMP(:dateTo, 'YYYY-MM-DD HH24:MI:SS')`,
          );
          binds.dateTo = dateTo;
        }
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const sql = `
      SELECT *
      FROM (
        SELECT
          'MIN_CYCLE_TIME' AS ROW_TYPE,
          t.ID,
          t.LINE,
          t.LOCATION,
          t.CATEGORY,
          t.MACHINE_TYPE,
          t.MACHINE_NAME,
          t.CYCLE_TIME,
          t.CREATED_AT,
          t.PASS,
          t.FAIL
        FROM FATP_MACHINE_FPY_DATA t
        ${whereClause}
        ORDER BY t.CYCLE_TIME ASC NULLS LAST, t.CREATED_AT DESC
      )
      WHERE ROWNUM = 1

      UNION ALL

      SELECT *
      FROM (
        SELECT
          'LATEST_CREATED_AT' AS ROW_TYPE,
          t.ID,
          t.LINE,
          t.LOCATION,
          t.CATEGORY,
          t.MACHINE_TYPE,
          t.MACHINE_NAME,
          t.CYCLE_TIME,
          t.CREATED_AT,
          t.PASS,
          t.FAIL
        FROM FATP_MACHINE_FPY_DATA t
        ${whereClause}
        ORDER BY t.CREATED_AT DESC
      )
      WHERE ROWNUM = 1
    `;

      const resultOracle = await connection.execute(sql, binds);

      const minCycleTimeRow = resultOracle.rows.find(
        (row) => row.ROW_TYPE === "MIN_CYCLE_TIME",
      );
      const latestCreatedAtRow = resultOracle.rows.find(
        (row) => row.ROW_TYPE === "LATEST_CREATED_AT",
      );

      return res.json({
        minCycleTimeRow: minCycleTimeRow || null,
        latestCreatedAtRow: latestCreatedAtRow || null,
      });
    } catch (err) {
      console.error("Error fetching getMinCycleTimeAndLatestRow: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getMachineWeeklyDrilldownData: async (req, res) => {
    let connection;
    try {
      const { line, location, factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      connection = await req.app.locals.oraclePool.getConnection();

      const executeOptions = {
        outFormat: req.app.locals.oracledb?.OUT_FORMAT_OBJECT || undefined,
      };

      const daySql = `
      WITH raw_data AS (
        SELECT
          t.PASS,
          t.FAIL,
          t.CREATED_AT,
          CASE
            WHEN TO_CHAR(t.CREATED_AT, 'HH24MI') >= '0730' THEN TRUNC(t.CREATED_AT)
            ELSE TRUNC(t.CREATED_AT) - 1
          END AS production_date
        FROM FATP_MACHINE_FPY_DATA t
        WHERE t.LINE = :line
          AND t.LOCATION = :location
          AND ${factoryCondition1}
      ),
      calendar_days AS (
        SELECT (TRUNC(TRUNC(SYSDATE), 'IW') - 21) + (LEVEL - 1) AS production_date
        FROM dual
        CONNECT BY LEVEL <= 28
      ),
      grouped_days AS (
        SELECT
          production_date,
          TRUNC(production_date, 'IW') AS week_start,
          NVL(SUM(PASS), 0) AS pass_sum,
          NVL(SUM(FAIL), 0) AS fail_sum,
          NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0) AS output,
          CASE
            WHEN (NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0)) = 0 THEN 0
            ELSE NVL(SUM(FAIL), 0) / (NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0))
          END AS fail_rate
        FROM raw_data
        GROUP BY production_date
      )
      SELECT
        c.production_date,
        TRUNC(c.production_date, 'IW') AS week_start,
        NVL(g.pass_sum, 0) AS pass_sum,
        NVL(g.fail_sum, 0) AS fail_sum,
        NVL(g.output, 0) AS output,
        NVL(g.fail_rate, 0) AS fail_rate
      FROM calendar_days c
      LEFT JOIN grouped_days g
        ON c.production_date = g.production_date
      ORDER BY c.production_date
    `;

      const hourSql = `
      WITH raw_data AS (
        SELECT
          t.PASS,
          t.FAIL,
          t.CREATED_AT,
          CASE
            WHEN TO_CHAR(t.CREATED_AT, 'HH24MI') >= '0730' THEN TRUNC(t.CREATED_AT)
            ELSE TRUNC(t.CREATED_AT) - 1
          END AS production_date,
          FLOOR(
            (
              CAST(t.CREATED_AT AS DATE)
              - (
                  CASE
                    WHEN TO_CHAR(t.CREATED_AT, 'HH24MI') >= '0730' THEN TRUNC(t.CREATED_AT)
                    ELSE TRUNC(t.CREATED_AT) - 1
                  END
                  + (7.5 / 24)
                )
            ) * 24
          ) AS hour_no
        FROM FATP_MACHINE_FPY_DATA t
        WHERE t.LINE = :line
          AND t.LOCATION = :location
          AND ${factoryCondition1}
      ),
      filtered AS (
        SELECT *
        FROM raw_data
        WHERE hour_no BETWEEN 0 AND 23
      ),
      calendar_days AS (
        SELECT (TRUNC(TRUNC(SYSDATE), 'IW') - 21) + (LEVEL - 1) AS production_date
        FROM dual
        CONNECT BY LEVEL <= 28
      ),
      calendar_hours AS (
        SELECT LEVEL - 1 AS hour_no
        FROM dual
        CONNECT BY LEVEL <= 24
      ),
      grouped_hours AS (
        SELECT
          production_date,
          TRUNC(production_date, 'IW') AS week_start,
          hour_no,
          NVL(SUM(PASS), 0) AS pass_sum,
          NVL(SUM(FAIL), 0) AS fail_sum,
          NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0) AS output,
          CASE
            WHEN (NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0)) = 0 THEN 0
            ELSE NVL(SUM(FAIL), 0) / (NVL(SUM(PASS), 0) + NVL(SUM(FAIL), 0))
          END AS fail_rate
        FROM filtered
        GROUP BY production_date, hour_no
      )
      SELECT
        d.production_date,
        TRUNC(d.production_date, 'IW') AS week_start,
        h.hour_no,
        NVL(g.pass_sum, 0) AS pass_sum,
        NVL(g.fail_sum, 0) AS fail_sum,
        NVL(g.output, 0) AS output,
        NVL(g.fail_rate, 0) AS fail_rate
      FROM calendar_days d
      CROSS JOIN calendar_hours h
      LEFT JOIN grouped_hours g
        ON d.production_date = g.production_date
       AND h.hour_no = g.hour_no
      ORDER BY d.production_date, h.hour_no
    `;

      const [dayResult, hourResult] = await Promise.all([
        connection.execute(daySql, { line, location }, executeOptions),
        connection.execute(hourSql, { line, location }, executeOptions),
      ]);

      const dayRows = dayResult.rows || [];
      const hourRows = hourResult.rows || [];

      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };

      const formatHour = (hourNo) => {
        const h = (7 + hourNo) % 24;
        return `${String(h).padStart(2, "0")}:30`;
      };

      const dailyMap = new Map();

      dayRows.forEach((row) => {
        const key = formatDate(row.PRODUCTION_DATE);
        dailyMap.set(key, {
          day: key,
          weekStart: formatDate(row.WEEK_START),
          passSum: Number(row.PASS_SUM || 0),
          failSum: Number(row.FAIL_SUM || 0),
          value: Number(row.OUTPUT || 0),
          failRate: Number(row.FAIL_RATE || 0),
          hours: [],
        });
      });

      hourRows.forEach((row) => {
        const key = formatDate(row.PRODUCTION_DATE);
        const dayItem = dailyMap.get(key);
        if (!dayItem) return;

        dayItem.hours.push({
          hourNo: Number(row.HOUR_NO),
          time: formatHour(Number(row.HOUR_NO)),
          passSum: Number(row.PASS_SUM || 0),
          failSum: Number(row.FAIL_SUM || 0),
          value: Number(row.OUTPUT || 0),
          failRate: Number(row.FAIL_RATE || 0),
        });
      });

      const weekMap = new Map();

      dailyMap.forEach((d) => {
        if (!weekMap.has(d.weekStart)) {
          weekMap.set(d.weekStart, {
            weekStart: d.weekStart,
            totalFail: 0,
            value: 0,
            days: [],
          });
        }

        const w = weekMap.get(d.weekStart);
        w.totalFail += d.failSum;
        w.value += d.value;

        w.days.push({
          day: d.day,
          value: d.value,
          failRate: d.failRate,
          hours: d.hours
            .sort((a, b) => a.hourNo - b.hourNo)
            .map(({ hourNo, passSum, failSum, ...rest }) => rest),
        });
      });

      const getISOWeek = (dateStr) => {
        const d = new Date(dateStr);
        const target = new Date(
          Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
        );
        const dayNr = (target.getUTCDay() + 6) % 7;
        target.setUTCDate(target.getUTCDate() - dayNr + 3);
        const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
        const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
        firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
        return String(
          1 + Math.round((target - firstThursday) / 604800000),
        ).padStart(2, "0");
      };

      const weeklyData = Array.from(weekMap.values())
        .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
        .map((w) => ({
          week: `W${getISOWeek(w.weekStart)}`,
          value: w.value,
          failRate: w.value === 0 ? 0 : w.totalFail / w.value,
          days: w.days.sort((a, b) => new Date(a.day) - new Date(b.day)),
        }));

      return res.json(weeklyData);
    } catch (err) {
      console.error("Error fetching getMachineWeeklyDrilldownData: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getMachineError5Minutes: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (
        (currentHour === 11 && currentMinute >= 30) ||
        (currentHour === 12 && currentMinute <= 30) ||
        (currentHour === 23 && currentMinute >= 30) ||
        (currentHour === 0 && currentMinute <= 30)

      ) {
        return res.json([]);
      }

      connection = await req.app.locals.oraclePool.getConnection();

      const resultOracle = await connection.execute(
        `
        SELECT
            f.line,
            f.location,
            f.machine_name,
            f.error_type
        FROM (
            SELECT
                x.id,
                x.line,
                x.location,
                x.machine_name,
                x.status,
                x.error_type,
                x.start_time,
                ROW_NUMBER() OVER (
                    PARTITION BY x.line, x.location, x.machine_name
                    ORDER BY x.start_time DESC, x.id DESC
                ) AS rn
            FROM fatp_machine_data x
            WHERE x.factory = 'A02'
        ) f
        WHERE f.rn = 1
          AND f.status = 'ERROR'
          AND f.start_time <= (SYSDATE - NUMTODSINTERVAL(5, 'MINUTE'))
          AND NOT EXISTS (
              SELECT 1
              FROM over_time_data o
              WHERE o.line = f.line
                AND o.type = 'Maintenance'
                AND o.start_time < SYSDATE
                AND SYSDATE < o.end_time
          )
          AND f.line IN (
              SELECT line
              FROM FATP_MACHINE_DATA_CONNECT
              WHERE line IS NOT NULL
              GROUP BY line
              HAVING max(datetime) > (SYSTIMESTAMP - INTERVAL '22' MINUTE)
          )
        ORDER BY f.line, f.location, f.machine_name`,
      );

      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getMachineError5Minutes: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineTotalTrend: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      connection = await req.app.locals.oraclePool.getConnection();
      console.log("getFATPMachineTotalTrend request", req.body);
      const resultOracle = await connection.execute(`
          WITH ot AS (
          -- Tất cả Over time (dạng TIMESTAMP)
          SELECT line,
                start_time AS ot_start,
                end_time AS ot_end
          FROM over_time_data
          WHERE ${factoryCondition1} AND TYPE = 'Over time'
          and (TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo)}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
            or TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateTo || convertDate2(now)}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
          )
        )
          SELECT DateT,NVL(RUN,'0') as OK , NVL(ERROR,'0') as NG  from (
                select STATUS,TO_CHAR(START_TIME, 'yyyy-MM-dd') as DateT,TIME 
                FROM FATP_MACHINE_DATA f
                where ${factoryCondition1} AND START_TIME BETWEEN TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo) + " 00:00:00"
        }','YYYY-MM-DD HH24:MI:SS')
                AND TO_DATE('${req.body.dateTo || convertDate2(now) + " 23:59:59"
        }','YYYY-MM-DD HH24:MI:SS') 
                ${convertArrToStr(req.body.arr) === ""
          ? ""
          : `and LINE || '-M' || LOCATION in (${convertArrToStr(
            req.body.arr,
          )})`
        }
                AND (
                  (
                        -- Loại trừ 16:30:00 đến 19:30:00
                        TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '1630' AND '1930'
                              
                        -- LOẠI TRỪ VÀ KHÔNG NẰM TRONG 04:30:00 đến 07:30:00
                        AND TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '0400' AND '0700'
                    )
                  OR
                  ---- 3) Hoặc overlap với bất kỳ Over time thực tế nào (ot)
                  EXISTS (
                    SELECT 1 FROM ot
                    WHERE ot.line = f.line
                      AND f.start_time < ot.ot_end
                      AND f.start_time > ot.ot_start
                  )
                )
                -- Loại bỏ mọi bản ghi chồng lấn Maintenance (cùng LINE)
                AND NOT EXISTS (
                  SELECT 1
                  FROM   over_time_data m
                  WHERE  m.line = f.line
                    AND m.factory = f.factory
                    AND  m.type = 'Maintenance'
                    AND  f.start_time < m.end_time
                    AND  f.start_time  > m.start_time
                )
                ) bang1 pivot (SUM(TIME) for STATUS in ('RUN' AS RUN, 'ERROR' AS ERROR)) bang2`);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineFailureAnalysis: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      const dateFrom = req.body.dateFrom || timeR.dateFrom;
      const dateTo = req.body.dateTo || timeR.dateTo;
      connection = await req.app.locals.oraclePool.getConnection();
      console.log("getFATPMachineFailureAnalysis request", req.body);

      const arrCondition = convertArrToStr(req.body.arr) === "" ? "" : `AND LINE || '-M' || LOCATION IN (${convertArrToStr(req.body.arr)})`;

      const resultOracle = await connection.execute(`
        SELECT 
            LINE AS "line",
            MACHINE_NAME AS "machine",
            LOCATION AS "location",
            CATEGORY AS "category",
            ERROR_TYPE AS "error",
            TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS "start_time",
            TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS "end_time",
            ROUND(NVL(TIME, (SYSDATE - START_TIME) * 24 * 60 * 60) / 60) AS "duration"
        FROM FATP_MACHINE_DATA f
        WHERE STATUS = 'ERROR'
          AND ${factoryCondition1}
          ---AND START_TIME BETWEEN TO_DATE('${dateFrom}', 'YYYY-MM-DD HH24:MI:SS')
                             ---AND TO_DATE('${dateTo}', 'YYYY-MM-DD HH24:MI:SS')
          ${arrCondition}
          AND NOT EXISTS (
              SELECT 1
              FROM over_time_data o
              WHERE o.line = f.line
                AND o.type = 'Maintenance'
                AND o.start_time < f.start_time
                AND f.start_time < o.end_time
          )
        ORDER BY START_TIME DESC
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getFATPMachineFailureAnalysis: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getError7Day: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      connection = await req.app.locals.oraclePool.getConnection();
      console.log("getError7Day request", req.body);
      const resultOracle = await connection.execute(`
        SELECT LINE AS "line",
            MACHINE_NAME AS "machine",
            LOCATION AS "location",
            CATEGORY AS "category",
            ERROR_TYPE AS "error",
            TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS "start_time",
            TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS "end_time",
            ROUND(NVL(TIME, (SYSDATE - START_TIME) * 24 * 60 * 60) / 60) AS "duration"
        FROM FATP_MACHINE_DATA f
        WHERE STATUS = 'ERROR'
          AND ${factoryCondition1} AND START_TIME BETWEEN TO_DATE('${convertDate2(sevenDayAgo)} 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
                             AND TO_DATE('${convertDate2(now)} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')
          AND NOT EXISTS (
              SELECT 1
              FROM over_time_data o
              WHERE o.line = f.line
                AND o.factory = f.factory
                AND o.type = 'Maintenance'
                AND o.start_time < f.start_time
                AND f.start_time < o.end_time
          )
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getError7Day: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineAnalysis: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      // connection = await req.app.locals.oraclePool.getPool().getConnection();
      const resultOracle = await connection.execute(`
        WITH ot AS (
          -- Tất cả Over time (dạng TIMESTAMP)
          SELECT line,
                start_time AS ot_start,
                end_time AS ot_end
          FROM   over_time_data
          WHERE  TYPE = 'Over time'
          AND ${factoryCondition1}
          and (TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateFrom || timeR.dateFrom}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
            or TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateTo || timeR.dateTo}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
          )
        )
          SELECT LINE,
           MACHINE_NAME,
           STATUS,
           SUM(TIME) AS TotalTime,
           COUNT(TIME) AS FREN,
           ERROR_CODE,
           ERROR_TYPE AS ERROR,
           DateT,
           TimeT
        FROM (
        SELECT LINE,
               MACHINE_NAME,
               CASE 
                   WHEN STATUS = 'RUN' OR STATUS = 'WARNING' THEN 'OK' 
                   WHEN STATUS = 'ERROR' THEN 'NG'
                   ELSE 'STOP'
               END AS STATUS,
               NVL(TIME, 0) AS TIME,
               ERROR_CODE,
               ERROR_TYPE,
               TO_CHAR(START_TIME - INTERVAL '30' MINUTE, 'YYYY-MM-DD') AS DateT,
               TO_CHAR(START_TIME - INTERVAL '30' MINUTE, 'HH24') || ':30' AS TimeT
        FROM FATP_MACHINE_DATA f
        WHERE ${factoryCondition1} 
        AND START_TIME BETWEEN TO_DATE('${req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE('${req.body.dateTo || timeR.dateTo
        }', 'YYYY-MM-DD HH24:MI:SS')
          ${convertArrToStr(req.body.arr) === ""
          ? ""
          : `AND LINE || '-M' || LOCATION IN (${convertArrToStr(
            req.body.arr,
          )})`
        }
          AND (
            (
                  -- Loại trừ 16:30:00 đến 19:30:00
                  TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '1630' AND '1930'
                        
                  -- LOẠI TRỪ VÀ KHÔNG NẰM TRONG 04:30:00 đến 07:30:00
                  AND TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '0400' AND '0700'
              )
            OR
            ---- 3) Hoặc overlap với bất kỳ Over time thực tế nào (ot)
            EXISTS (
              SELECT 1 FROM ot
              WHERE ot.line = f.line
                AND f.start_time < ot.ot_end
                AND f.start_time > ot.ot_start
            )
          )
          -- Loại bỏ mọi bản ghi chồng lấn Maintenance (cùng LINE)
          AND NOT EXISTS (
            SELECT 1
            FROM   over_time_data m
            WHERE  m.line = f.line
              AND  m.factory = f.factory
              AND  m.type = 'Maintenance'
              AND  f.start_time < m.end_time
              AND  f.start_time  > m.start_time
          )
      ) bang1
      WHERE STATUS <> 'STOP'
      GROUP BY LINE, MACHINE_NAME, STATUS, ERROR_CODE, ERROR_TYPE, DateT, TimeT
      ORDER BY DateT, TimeT`);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineError5m: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
      SELECT a.LINE, 
            a.LOCATION, 
            a.MACHINE_TYPE, 
            a.MACHINE_NAME, 
            a.STATUS, 
            a.START_TIME, 
            a.END_TIME, 
            a.TIME,
            a.ERROR_TYPE, 
            a.ERROR_CODE,  
            b.CAUSE, 
            b.SOLUTION, 
            b.CARD_CODE, 
            b.NAME, 
            b.CONFIRM_TIME
      FROM FATP_MACHINE_DATA a
      LEFT JOIN (
          SELECT * FROM FATP_ERROR_CONFIRM
      ) b
        ON a.ID = b.MACHINE_ID
      WHERE ${factoryCondition1} AND
      a.START_TIME BETWEEN TO_DATE('${req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
        AND TO_DATE('${req.body.dateTo || timeR.dateTo
        }', 'YYYY-MM-DD HH24:MI:SS')
        AND a.TIME > 300
        AND a.STATUS = 'ERROR'
        ${convertArrToStr(req.body.arr) === ""
          ? ""
          : `AND a.LINE || '-M' || a.LOCATION IN (${convertArrToStr(
            req.body.arr,
          )})`
        }`);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPMachineErrorDetail: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
          SELECT bang1.ERROR_CODE, 
                bang1.ERROR_TYPE, 
                bang1.CAUSE, 
                bang1.SOLUTION, 
                NVL(bang2.Total, 0) AS Total
          FROM (
              SELECT * 
              FROM ERROR_LOG 
              WHERE ERROR_CODE LIKE '${req.body.error || ""}%'
          ) bang1
          LEFT JOIN (
              SELECT ERROR_CODE,
                    ERROR_TYPE,
                    CAUSE,
                    SOLUTION,
                    COUNT(CAUSE) AS Total
              FROM FATP_ERROR_CONFIRM
              WHERE 
              ${req.body.error === ""
          ? `CONFIRM_TIME BETWEEN TO_DATE('${req.body.dateFrom ||
          convertDate2(sevenDayAgo) + " 00:00:00"
          }', 'YYYY-MM-DD HH24:MI:SS')
                    AND TO_DATE('${req.body.dateTo || convertDate2(now) + " 23:59:59"
          }', 'YYYY-MM-DD HH24:MI:SS')
                    AND`
          : ""
        }
              ERROR_CODE LIKE '${req.body.error || ""}%'
              GROUP BY ERROR_CODE, ERROR_TYPE, CAUSE, SOLUTION
          ) bang2
          ON bang1.ERROR_CODE = bang2.ERROR_CODE
          AND bang1.ERROR_TYPE = bang2.ERROR_TYPE
          AND bang1.CAUSE = bang2.CAUSE
          AND bang1.SOLUTION = bang2.SOLUTION
          ORDER BY Total DESC
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getFATPErrorDetail: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        WITH ot AS (
          -- Tất cả Over time (dạng TIMESTAMP)
          SELECT line,
                start_time AS ot_start,
                end_time AS ot_end
          FROM over_time_data
          WHERE ${factoryCondition1} AND TYPE = 'Over time'
          and (TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateFrom || timeR.dateFrom}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
            or TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateTo || timeR.dateTo}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
          )
        )
        select LINE,LOCATION,MACHINE_TYPE, MACHINE_NAME,STATUS,
              TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS START_TIME,
              TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS END_TIME,
              TIME,ERROR_CODE, ERROR_TYPE 
              FROM FATP_MACHINE_DATA f
        WHERE ${factoryCondition1} AND START_TIME BETWEEN TO_DATE('${req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
              AND TO_DATE('${req.body.dateTo || timeR.dateTo
        }', 'YYYY-MM-DD HH24:MI:SS') and STATUS like 'ERROR' 
              ${convertArrToStr(req.body.arr) === ""
          ? ""
          : `and LINE || '-M' || LOCATION in (${convertArrToStr(req.body.arr)})`
        }
              AND (
                (
                      -- Loại trừ 16:30:00 đến 19:30:00
                      TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '1630' AND '1930'
                            
                      -- LOẠI TRỪ VÀ KHÔNG NẰM TRONG 04:30:00 đến 07:30:00
                      AND TO_CHAR(START_TIME, 'HH24MI') NOT BETWEEN '0400' AND '0700'
                  )
                OR
                ---- 3) Hoặc overlap với bất kỳ Over time thực tế nào (ot)
                EXISTS (
                  SELECT 1 FROM ot
                  WHERE ot.line = f.line
                    AND f.start_time < ot.ot_end
                    AND f.start_time > ot.ot_start
                )
              )
              -- Loại bỏ mọi bản ghi chồng lấn Maintenance (cùng LINE)
              AND NOT EXISTS (
                SELECT 1
                FROM   over_time_data m
                WHERE  m.line = f.line
                  AND  m.factory = f.factory
                  AND  m.type = 'Maintenance'
                  AND  f.start_time < m.end_time
                  AND  f.start_time  > m.start_time
              )
            `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataOverTimeFATP: async (req, res) => {
    let connection;
    try {
      const { factory } = req.body;
      const factoryCondition1 = `factory='${factory}'`;
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select ID ,LINE ,SHIFT_NAME ,
          TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS START_TIME,
          TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS END_TIME,
        TYPE ,ID_CONFIRM ,"Comment" from over_time_data where ${factoryCondition1} order by id desc
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getDataOverTimeFATP: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  addDataOverTimeFATP: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const startTime = (req.body.startTime || "")
        .replace("T", " ")
        .replace("Z", "");
      const endTime = (req.body.endTime || "")
        .replace("T", " ")
        .replace("Z", "");
      const resultOracle = await connection.execute(`
        INSERT INTO over_time_data 
        (LINE, START_TIME, END_TIME, TYPE, ID_CONFIRM,"Comment", FACTORY) VALUES 
        (N'${req.body.line}',
          TO_TIMESTAMP('${startTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'), 
          TO_TIMESTAMP('${endTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'), 
          N'${req.body.type}',N'${req.body.idConfirm || ""}','${req.body.comment || ""
        }','${req.body.factory}')
      `);
      await connection.commit();
      return res.json({ success: true, message: `Đã thêm vào bảng` });
    } catch (err) {
      console.error("Error addDataOverTimeFATP: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  editDataOverTimeFATP: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const startTime = (req.body.startTime || "")
        .replace("T", " ")
        .replace("Z", "");
      const endTime = (req.body.endTime || "")
        .replace("T", " ")
        .replace("Z", "");
      const resultOracle = await connection.execute(`
        UPDATE over_time_data 
        SET START_TIME = TO_TIMESTAMP('${startTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'),
        END_TIME = TO_TIMESTAMP('${endTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'), 
        LINE = N'${req.body.line}',
        "Comment" = '${req.body.comment || ""}',
        TYPE = N'${req.body.type}',
        ID_CONFIRM = N'${req.body.idConfirm || ""}',
        FACTORY = N'${req.body.factory}'
        WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Edit success` });
    } catch (err) {
      console.error("Error editDataOverTimeFATP: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  deleteDataOverTimeFATP: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM over_time_data WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete success` });
    } catch (err) {
      console.error("Error deleteDataOverTimeFATP: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = FATPController;
