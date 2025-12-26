const { normalizeForwardSlash, joinSafe } = require("../../utils/fs.js");
const path = require("path");
const fs = require("fs");
const { UPLOAD_DIR } = require("../../middleware/upload.middleware.js");
const oracledb = require("oracledb");
const { downloadFile } = require("../File/fileController.js");

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

function convertArrToStr(arr) {
  const isArray = Array.isArray(arr);
  const queryArray = isArray ? arr : [];
  return queryArray.length > 0 ? arr.map((item) => `'${item}'`).join(`,`) : "";
}

const ScrewController = {
  getScrewMachineStatus: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const tableName =
        req.body.type === "Screw"
          ? "screw_force_info"
          : req.body.type === "Glue"
          ? "glue_force_info"
          : "shielding_cover_force_info";
      const resultOracle = await connection.execute(`
        SELECT line,location,name_machine,
          SUM(CASE WHEN lower(state) = 'pass' THEN 1 ELSE 0 END) AS pass_count,
          SUM(CASE WHEN lower(state) = 'fail' THEN 1 ELSE 0 END) AS fail_count
        FROM ${tableName}
        ---WHERE TIME_UPDATE BETWEEN TO_DATE('${
          req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          ---AND TO_DATE('${
            req.body.dateTo || timeR.dateTo
          }', 'YYYY-MM-DD HH24:MI:SS')
        GROUP BY line, name_machine,location
        ORDER BY line,name_machine
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getScrewMachineStatus: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataErrorHistory: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const tableName =
        req.body.type === "Screw"
          ? "screw_force_info"
          : req.body.type === "Glue"
          ? "glue_force_info"
          : "shielding_cover_force_info";
      const resultOracle = await connection.execute(`
        SELECT ID ,FACTORY ,LINE ,LOCATION ,NAME_MACHINE ,MODEL_NAME ,SERIAL_NUMBER ,FORCE_1 ,FORCE_2 ,FORCE_3 ,FORCE_4 ,STATE ,
          TO_CHAR(time_update, 'YYYY-MM-DD HH24:MI:SS') AS time_update
        FROM ${tableName} where state = 'FAIL'
        ---AND TIME_UPDATE BETWEEN TO_DATE('${
          req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          ---AND TO_DATE('${
            req.body.dateTo || timeR.dateTo
          }', 'YYYY-MM-DD HH24:MI:SS')
        order by time_update desc
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getDataErrorHistory: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataScrewMachineDetail: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      connection = await req.app.locals.oraclePool.getConnection();
      const tableName =
        req.body.type === "Screw"
          ? "screw_force_info"
          : req.body.type === "Glue"
          ? "glue_force_info"
          : "shielding_cover_force_info";
      const forceSelect =
        req.body.type === "Glue"
          ? `FORCE_1 ,FORCE_2 ,FORCE_3 ,FORCE_4,FORCE_5 ,FORCE_6 ,FORCE_7 ,FORCE_8,FORCE_9 ,FORCE_10 ,FORCE_11 ,FORCE_12`
          : `FORCE_1 ,FORCE_2 ,FORCE_3 ,FORCE_4`;
      const resultOracle = await connection.execute(`
        SELECT ID ,FACTORY ,LINE ,LOCATION ,NAME_MACHINE ,MODEL_NAME ,SERIAL_NUMBER ,${forceSelect} ,STATE ,
          TO_CHAR(time_update, 'YYYY-MM-DD HH24:MI:SS') AS time_update
        FROM ${tableName} where line = '${req.body.line}' and LOCATION = '${
        req.body.location
      }'
        ---AND TIME_UPDATE BETWEEN TO_DATE('${
          req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          ---AND TO_DATE('${
            req.body.dateTo || timeR.dateTo
          }', 'YYYY-MM-DD HH24:MI:SS')
        order by time_update desc
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getDataErrorHistory: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getScrewMachineAnalysis: async (req, res) => {
    let connection;
    try {
      const now = new Date();
      const timeR = getCurrentShiftTimeRange(now);
      const tableName =
        req.body.type === "Screw"
          ? "screw_force_info"
          : req.body.type === "Glue"
          ? "glue_force_info"
          : "shielding_cover_force_info";
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        SELECT LINE,
           name_machine,
           SUM(CASE WHEN state = 'PASS' THEN 1 ELSE 0 END) AS pass_count,          
           SUM(CASE WHEN state = 'FAIL' THEN 1 ELSE 0 END) AS fail_count,
           DateT,
           TimeT
        FROM (
        SELECT LINE,
               name_machine,
               state,
               TO_CHAR(time_update + INTERVAL '30' MINUTE, 'YYYY-MM-DD') AS DateT,
               TO_CHAR(time_update + INTERVAL '30' MINUTE, 'HH24') || ':30' AS TimeT
        FROM ${tableName}
        ---WHERE TIME_UPDATE BETWEEN TO_DATE('${
          req.body.dateFrom || timeR.dateFrom
        }', 'YYYY-MM-DD HH24:MI:SS')
          ---AND TO_DATE('${
            req.body.dateTo || timeR.dateTo
          }', 'YYYY-MM-DD HH24:MI:SS')
      ) bang1
      GROUP BY LINE, name_machine,DateT, TimeT
      ORDER BY DateT, TimeT
        `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getScrewMachineAnalysis: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataForceDefault: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select * from FORCE_DEFAULT
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

  addDataForceDefault: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        INSERT INTO FORCE_DEFAULT 
        (LINE, LOCATION, NAME_MACHINE, MIN_FORCE, MAX_FORCE, TYPE) VALUES 
        (N'${req.body.line}','${req.body.location}','${req.body.name || ""}',
          '${req.body.min}','${req.body.max}',
          N'${req.body.type}')
      `);
      await connection.commit();
      return res.json({ success: true, message: `Đã thêm vào bảng` });
    } catch (err) {
      console.error("Error addDataForceDefault: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  editDataForceDefault: async (req, res) => {
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
        UPDATE FORCE_DEFAULT 
        SET 
        LINE = N'${req.body.line}',
        LOCATION = N'${req.body.location}',
        MIN_FORCE = N'${req.body.min}',
        MAX_FORCE = N'${req.body.max}',
        TYPE = N'${req.body.type}',
        NAME_MACHINE = N'${req.body.name || ""}'
        WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Edit success` });
    } catch (err) {
      console.error("Error editDataForceDefault: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  deleteDataForceDefault: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM FORCE_DEFAULT WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete success` });
    } catch (err) {
      console.error("Error deleteDataForceDefault: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  uploadScrewDocumment: async (req, res) => {
    let connection;
    try {
      const { line, type } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Missing file" });
      }
      if (!line || !type) {
        return res
          .status(400)
          .json({ message: "Missing fields (line, type, name)" });
      }

      const savedPathFs = joinSafe(UPLOAD_DIR, req.file.filename);
      const savedPath = normalizeForwardSlash(savedPathFs);

      connection = await req.app.locals.oraclePool.getConnection();
      try {
        const sql = `
        INSERT INTO SCREW_DOCUMMENT_FILE_UPLOADS (LINE, TYPE, PATH)
        VALUES (:line, :type, :path)
        RETURNING ID INTO :out_id
      `;
        const binds = {
          line,
          type,
          path: savedPath,
          out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        };

        const result = await connection.execute(sql, binds, {
          autoCommit: true,
        });
        const newId = result.outBinds?.out_id?.[0] ?? null;

        return res.json({
          id: newId,
          line,
          type,
          path: savedPath, // đường dẫn nội bộ
          publicUrl: savedPath, // URL tĩnh nếu bật static
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
      } catch (dbErr) {
        // rollback file nếu DB fail
        try {
          fs.unlinkSync(savedPathFs);
        } catch {}
        console.error("[DB] Insert error:", dbErr);
        return res
          .status(500)
          .json({ message: "DB insert failed", detail: dbErr.message });
      } finally {
        try {
          await conn.close();
        } catch {}
      }
    } catch (err) {
      console.error("[API] Upload error:", err);
      return res
        .status(500)
        .json({ message: "Upload failed", msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getDataScrewDocummentUpload: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select ID ,LINE ,TYPE ,NAME ,PATH ,
          to_char(CREATED_AT,'YYYY-MM-DD HH24:MI:SS') as CREATED_AT  
        from SCREW_DOCUMMENT_FILE_UPLOADS order by id desc
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getDataScrewDocummentUpload: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  downloadScrewDocummentUpload: async (req, res) => {
    try {
      const qPath = (req.query.path || "").toString().trim();
      if (!qPath) return res.status(400).json({ message: "Missing path" });

      const uploadsRoot = path.resolve(UPLOAD_DIR);

      // Cho phép client gửi “uploads/xxx” hoặc “xxx”
      const rel = qPath.replace(/^\/?uploads\/?/i, "");
      const abs = path.resolve(uploadsRoot, rel);

      // Chặn traversal
      if (!abs.startsWith(uploadsRoot)) {
        return res.status(400).json({ message: "Invalid path" });
      }
      if (!fs.existsSync(abs)) {
        return res.status(404).json({ message: "File not found" });
      }

      return res.download(abs, path.basename(abs), (err) => {
        if (err && !res.headersSent) {
          res
            .status(500)
            .json({ message: "Download failed", detail: err.message });
        }
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Download failed", detail: e.message });
    }
  },

  deleteScrewDocummentUpload: async (req, res) => {
    let connection;
    try {
      const qPath = (req.body.path || "").toString().trim();
      if (!qPath) return res.status(400).json({ message: "Missing path" });

      const uploadsRoot = path.resolve(UPLOAD_DIR);

      // Cho phép client gửi “uploads/xxx” hoặc “xxx”
      const rel = qPath.replace(/^\/?uploads\/?/i, "");
      const abs = path.resolve(uploadsRoot, rel);
      fs.unlinkSync(abs);
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM SCREW_DOCUMMENT_FILE_UPLOADS WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete success` });
    } catch (err) {
      console.error("Error deleteDataForceDefault: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = ScrewController;
