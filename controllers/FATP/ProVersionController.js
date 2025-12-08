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

const ProVersionController = {
  checkProVersion: async (req, res) => {
    console.log("Program checkProVersion");
    let connection;
    try {
      const { proName, sha256, hostName } = req.body;
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `SELECT * from program_version WHERE pro_name = :proName`;
      const resultOracle = await connection.execute(sql, {
        proName,
      });
      if (resultOracle.rows.length == 0) {
        // Không có trong DB => ứng dụng này không cần quản chế
        console.log("Program not managed", resultOracle.rows);
        return res.json({ Allowed: true, Reason: "Program not managed" });
      }
      console.log("Program found", resultOracle.rows);
      const sql1 = `SELECT * from program_version WHERE pro_name = :proName and sha256 = :sha256`;
      const resultOracle1 = await connection.execute(sql1, {
        proName,
        sha256,
      });
      if (resultOracle1.rows.length == 0) {
        return res.json({
          Allowed: false,
          Reason: "Unknown version (hash mismatch)",
        });
      }
      return res.json({ Allowed: true, Reason: "Program allowed" });
    } catch (err) {
      console.error("Error getVcutMachineStatus: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataVcutMachineTotalTrend: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        SELECT ID ,FACTORY ,LINE ,LOCATION ,NAME_MACHINE ,TOTAL ,
          TO_CHAR(time, 'YYYY-MM-DD HH24:MI:SS') AS time
        FROM VCUT_MACHINE_DATA where time BETWEEN 
        TO_DATE('${
          req.body.dateFrom || convertDate2(sevenDayAgo) + " 00:00:00"
        }','YYYY-MM-DD HH24:MI:SS')
          AND TO_DATE('${
            req.body.dateTo || convertDate2(now) + " 23:59:59"
          }','YYYY-MM-DD HH24:MI:SS')
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getDataVcutMachineTotalTrend: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getKnifeVcutMachineHistory: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        SELECT
          k.LINE,
          k.LOCATION,
          k.NAME_MACHINE,
          k.START_TIME,
          k.FACTORY,
          vc.TOTAL AS TOTAL_AT_CHANGE
        FROM knife_vcut_machine_history k
        OUTER APPLY (
          SELECT v.TOTAL
          FROM VCUT_MACHINE_DATA v
          WHERE v.LINE = k.LINE
            AND v.LOCATION = k.LOCATION
            AND v.NAME_MACHINE = k.NAME_MACHINE
            AND v.factory = k.factory
            AND v.TIME <= k.START_TIME
          ORDER BY v.TIME DESC
          FETCH FIRST 1 ROWS ONLY
        ) vc
        where factory='${req.body.factory}'
          and line='${req.body.line}'
          and location='${req.body.location}'
        order by k.start_time desc
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getDataForceDefault: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  changeKnifeVcutmachine: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `
      INSERT INTO KNIFE_VCUT_MACHINE_HISTORY
        (LINE, LOCATION, NAME_MACHINE, START_TIME, "COMMENT", FACTORY)
      VALUES
        (:p_line, :p_location, :p_name, :p_start_time, :p_comment, :p_factory)
    `;

      const binds = {
        p_line: req.body.line ?? null,
        p_location: req.body.location ?? null,
        p_name: req.body.name ?? null,
        p_comment: req.body.comment ?? null,
        p_factory: req.body.factory ?? null,
        p_start_time: new Date(req.body.startTime), // JS Date là OK
      };
      const resultOracle = await connection.execute(sql, binds, {
        autoCommit: true,
      });
      return res.json({
        success: true,
        message: `change Knife Vcut machine success`,
      });
    } catch (err) {
      console.error("Error changeKinifeVcutmachine: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  editChangeKnifeVcutmachine: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        UPDATE KNIFE_VCUT_MACHINE_HISTORY 
        SET 
        START_TIME = ${new Date(req.body.startTime)},
        WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Edit success` });
    } catch (err) {
      console.error("Error editChangeKnifeVcutmachine: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  deleteChangeKnifeVcutmachine: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM KNIFE_VCUT_MACHINE_HISTORY WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete success` });
    } catch (err) {
      console.error("Error deleteChangeKnifeVcutmachine: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = ProVersionController;
