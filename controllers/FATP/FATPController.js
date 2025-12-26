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
    `${year}-${month}-${date1cong1}T07:30:00`
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

const FATPController = {
  getFATPMachineStatus: async (req, res) => { 
    let connection;
    try {
      //connect oracle
      connection = await req.app.locals.oraclePool.getConnection();
      // 1. Lấy danh sách distinct location
      const locResult = await connection.execute(`
        SELECT DISTINCT location FROM PTHNEW.FATP_MACHINE_DATA order by TO_NUMBER(LOCATION)
      `);

      // 2. Xây chuỗi location cho pivot
      const locations = locResult.rows.map((row) => row.LOCATION);
      const pivotCols = locations.map((l) => `'M${l}' AS "M${l}"`).join(",");
      const resultOracle = await connection.execute(`
       WITH conn AS (
          SELECT line,
                MAX(datetime) AS last_dt
          FROM FATP_MACHINE_DATA_CONNECT
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
              || '-/-' || TO_CHAR(f.start_time, 'YYYY-MM-DD HH24:MI:SS') AS val
          FROM FATP_MACHINE_DATA f
          LEFT JOIN conn c
            ON c.line = f.line
          WHERE f.start_time = (
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

  getFATPMachineTotalTrend: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      connection = await req.app.locals.oraclePool.getConnection();
      console.log("getFATPMachineTotalTrend request", req.body);
      const resultOracle =
        await connection.execute(`
          WITH ot AS (
          -- Tất cả Over time (dạng TIMESTAMP)
          SELECT line,
                start_time AS ot_start,
                end_time AS ot_end
          FROM   over_time_data
          WHERE  TYPE = 'Over time'
          and (TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo)}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
            or TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateTo || convertDate2(now)}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
          )
        )
          SELECT DateT,NVL(RUN,'0') as OK , NVL(ERROR,'0') as NG  from (
                select STATUS,TO_CHAR(START_TIME, 'yyyy-MM-dd') as DateT,TIME 
                FROM FATP_MACHINE_DATA f
                where START_TIME BETWEEN TO_DATE('${
                  req.body.dateFrom || convertDate2(sevenDayAgo) + " 00:00:00"
                }','YYYY-MM-DD HH24:MI:SS')
                AND TO_DATE('${
                  req.body.dateTo || convertDate2(now) + " 23:59:59"
                }','YYYY-MM-DD HH24:MI:SS') 
                ${
                  convertArrToStr(req.body.arr) === ""
                    ? ""
                    : `and LINE || '-M' || LOCATION in (${convertArrToStr(
                        req.body.arr
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

  getFATPMachineAnalysis: async (req, res) => {
    let connection;
    try {
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
        WHERE START_TIME BETWEEN TO_DATE('${
          req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE('${
            req.body.dateTo || timeR.dateTo
          }', 'YYYY-MM-DD HH24:MI:SS')
          ${
            convertArrToStr(req.body.arr) === ""
              ? ""
              : `AND LINE || '-M' || LOCATION IN (${convertArrToStr(
                  req.body.arr
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
      WHERE a.START_TIME BETWEEN TO_DATE('${
        req.body.dateFrom || timeR.dateFrom
      }', 'YYYY-MM-DD HH24:MI:SS')
        AND TO_DATE('${
          req.body.dateTo || timeR.dateTo
        }', 'YYYY-MM-DD HH24:MI:SS')
        AND a.TIME > 300
        AND a.STATUS = 'ERROR'
        ${
          convertArrToStr(req.body.arr) === ""
            ? ""
            : `AND a.LINE || '-M' || a.LOCATION IN (${convertArrToStr(
                req.body.arr
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
              ${
                req.body.error === ""
                  ? `CONFIRM_TIME BETWEEN TO_DATE('${
                      req.body.dateFrom ||
                      convertDate2(sevenDayAgo) + " 00:00:00"
                    }', 'YYYY-MM-DD HH24:MI:SS')
                    AND TO_DATE('${
                      req.body.dateTo || convertDate2(now) + " 23:59:59"
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
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        WITH ot AS (
          -- Tất cả Over time (dạng TIMESTAMP)
          SELECT line,
                start_time AS ot_start,
                end_time AS ot_end
          FROM   over_time_data
          WHERE  TYPE = 'Over time'
          and (TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateFrom || timeR.dateFrom}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
            or TO_CHAR(START_TIME, 'YYYY-MM-DD') = TO_CHAR(TO_DATE('${req.body.dateTo || timeR.dateTo}', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD')
          )
        )
        select LINE,LOCATION,MACHINE_TYPE, MACHINE_NAME,STATUS,
              TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS START_TIME,
              TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS END_TIME,
              TIME,ERROR_CODE, ERROR_TYPE 
              FROM FATP_MACHINE_DATA f
        where START_TIME BETWEEN TO_DATE('${
                req.body.dateFrom || timeR.dateFrom
              }', 'YYYY-MM-DD HH24:MI:SS')
              AND TO_DATE('${
                req.body.dateTo || timeR.dateTo
              }', 'YYYY-MM-DD HH24:MI:SS') and STATUS like 'ERROR' 
              ${
                convertArrToStr(req.body.arr) === ""
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
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select ID ,LINE ,SHIFT_NAME ,
          TO_CHAR(START_TIME, 'YYYY-MM-DD HH24:MI:SS') AS START_TIME,
          TO_CHAR(END_TIME, 'YYYY-MM-DD HH24:MI:SS') AS END_TIME,
        TYPE ,ID_CONFIRM ,"Comment" from over_time_data
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
        (LINE, START_TIME, END_TIME, TYPE, ID_CONFIRM,"Comment") VALUES 
        (N'${req.body.line}',
          TO_TIMESTAMP('${startTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'), 
          TO_TIMESTAMP('${endTime}', 'YYYY-MM-DD HH24:MI:SS.FF3'), 
          N'${req.body.type}',N'${req.body.idConfirm || ""}','${
        req.body.comment || ""
      }')
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
        ID_CONFIRM = N'${req.body.idConfirm || ""}'
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
