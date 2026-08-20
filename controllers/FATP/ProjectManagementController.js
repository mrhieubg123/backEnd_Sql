const { normalizeForwardSlash, joinSafe } = require("../../utils/fs.js");
const path = require("path");
const fs = require("fs/promises");
const { UPLOAD_DIR } = require("../../middleware/upload.middleware.js");
const oracledb = require("oracledb");
const { downloadFile } = require("../File/fileController.js");

const ProjectManagementController = {
  getListProjectManagement: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select * from FATP_PROJECT_MANAGEMENT
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getListProjectManagement: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getListProjectManagementByStatus: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const { status, dateTo, dateFrom } = req.body;

      let sql = `select * from FATP_PROJECT_MANAGEMENT`;
      const binds = {};
      const conditions = [];

      if (status !== null && status !== undefined && status !== "") {
        conditions.push(`status = :status`);
        binds.status = status;
      }

      if (
        (dateFrom === null || dateFrom === undefined || dateFrom === "") &&
        (dateTo === null || dateTo === undefined || dateTo === "")
      ) {
        conditions.push(`
        CREATED_AT >= TRUNC(SYSDATE, 'YYYY')
        AND CREATED_AT < ADD_MONTHS(TRUNC(SYSDATE, 'YYYY'), 12)
      `);
      } else {
        if (dateFrom !== null && dateFrom !== undefined && dateFrom !== "") {
          conditions.push(`CREATED_AT > TO_DATE(:dateFrom, 'YYYY-MM-DD')`);
          binds.dateFrom = dateFrom;
        }

        if (dateTo !== null && dateTo !== undefined && dateTo !== "") {
          conditions.push(`CREATED_AT < TO_DATE(:dateTo, 'YYYY-MM-DD')`);
          binds.dateTo = dateTo;
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(" AND ");
      }

      const resultOracle = await connection.execute(sql, binds);

      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getListProjectManagementByStatus: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getEmailConfig: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        select * from FATP_EMAIL_CONFIG
      `);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error fetching getEmailConfig: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  addNewProject: async (req, res) => {
    let connection;
    const listStatus = ["RFQ", "NPI Projects", "MP Projects", "EOL"];
    const status = req.body.status || "RFQ";
    const currentIndex = listStatus.indexOf(status);

    let oldStatus = status;

    if (currentIndex > 0) {
      oldStatus = listStatus[currentIndex - 1];
    }

    try {
      const { project } = req.body;
      connection = await req.app.locals.oraclePool.getConnection();

      await connection.execute(
        `
        INSERT INTO FATP_PROJECT_MANAGEMENT
        (PROJECT, STATUS)
        VALUES
        (:project, :status)
      `,
        { project, status },
        {
          autoCommit: true,
        },
      );
      if (status !== "RFQ")
        await connection.execute(
          `
          UPDATE FATP_PROJECT_MANAGEMENT
          SET END_TIME = SYSDATE
          WHERE PROJECT = :project and STATUS = :oldStatus and END_TIME IS NULL
        `,
          { project, oldStatus },
          {
            autoCommit: true,
          },
        );

      return res.json({ success: true, message: `Đã thêm vào bảng` });
    } catch (err) {
      console.error("Error addNewProject: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  editProject: async (req, res) => {
    let connection;
    try {
      const basePath = path.join(__dirname, "../..", "fileUploads");
      const { headerParts, oldStatus, status, name, oldName, endTime } =
        req.body;

      const srcPath = path.join(basePath, headerParts, oldStatus, oldName); // vd: ProjectManagement/RFQ/CWA...
      const destPath = path.join(basePath, headerParts, status, name); // vd: ProjectManagement/NPI Projects/CWA...

      connection = await req.app.locals.oraclePool.getConnection();

      // ✅ Dùng bind để tránh lỗi + SQL injection (và Oracle không dùng N'...')
      await connection.execute(
        `
      UPDATE FATP_PROJECT_MANAGEMENT
      SET PROJECT = :name, END_TIME = :endTime
      WHERE PROJECT = :oldName and STATUS = :oldStatus
      `,
        { name, endTime, oldName, oldStatus },
        { autoCommit: true },
      );

      await connection.execute(
        `
      INSERT INTO FATP_PROJECT_MANAGEMENT 
        (PROJECT, STATUS) VALUES (:name,:status)
      `,
        { name, status },
        { autoCommit: true },
      );

      // ✅ tạo folder cha của destination
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // ✅ move folder/file
      // await fs.rename(srcPath, destPath);

      return res.json({ success: true, message: "Edit success" });
    } catch (err) {
      console.error("Error editProject: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  deleteProject: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM FATP_PROJECT_MANAGEMENT WHERE PROJECT = '${req.body.project}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete project success` });
    } catch (err) {
      console.error("Error deleteProject: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  addNewEmailConfig: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        INSERT INTO FATP_EMAIL_CONFIG 
        (NAME, EMAIL, CCEMAIL, PROJECT) VALUES 
        (N'${req.body.name}','${req.body.email}','${req.body.ccEmail}',
          '${req.body.projectString}')
      `);
      await connection.commit();
      return res.json({ success: true, message: `Đã thêm vào bảng` });
    } catch (err) {
      console.error("Error addNewEmailConfig: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  editEmailConfig: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        UPDATE FATP_EMAIL_CONFIG 
        SET 
        NAME = N'${req.body.name}',
        EMAIL = N'${req.body.email}',
        CCEMAIL = N'${req.body.ccEmail}',
        PROJECT = N'${req.body.project}'
        WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Edit success` });
    } catch (err) {
      console.error("Error editEmailConfig: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
  deleteEmailConfig: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle = await connection.execute(`
        DELETE FROM FATP_EMAIL_CONFIG WHERE ID = '${req.body.id}'
      `);
      await connection.commit();
      return res.json({ success: true, message: `Delete success` });
    } catch (err) {
      console.error("Error deleteEmailConfig: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  moveProject: async (req, res) => {
    let connection;
    try {
      const { basePath, folder, toFolder } = req.body;
      const fullPath = path.join(basePath, folder);
      const fullPathTo = path.join(basePath, toFolder);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.rename(src, fullPathTo);
    } catch (err) {
      console.error("[API] move Project error:", err);
      return res
        .status(500)
        .json({ message: "Move Project failed", msg: err.message });
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
        } catch { }
        console.error("[DB] Insert error:", dbErr);
        return res
          .status(500)
          .json({ message: "DB insert failed", detail: dbErr.message });
      } finally {
        try {
          await connection.close();
        } catch { }
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

module.exports = ProjectManagementController;

// CREATE TABLE FATP_EMAIL_CONFIG (
//     ID NUMBER GENERATED BY DEFAULT AS IDENTITY NOT NULL,
//     NAME NVARCHAR2(100),
//     EMAIL NVARCHAR2(100),
//     CCEMAIL NVARCHAR2(100),
//     PROJECT NVARCHAR2(500),
//     CONSTRAINT PK_FATP_EMAIL_CONFIG PRIMARY KEY (ID)
// )
// CREATE TABLE FATP_PROJECT_MANAGEMENT (
//     ID NUMBER GENERATED BY DEFAULT AS IDENTITY NOT NULL,
//     PROJECT_NAME NVARCHAR2(100),
//     CCEMAIL NVARCHAR2(100),
//     PROJECT NVARCHAR2(500),
//     STATUS NVARCHAR2(100),
//     CREATED_AT TIMESTAMP(0)
//                          DEFAULT CAST(SYSTIMESTAMP AS TIMESTAMP(0)) NOT NULL,
//     CONSTRAINT PK_FATP_PROJECT_MANAGEMENT PRIMARY KEY (ID)
// )
// CREATE TABLE FATP_MACHINE_FPY_DATA (
//     ID NUMBER GENERATED BY DEFAULT AS IDENTITY NOT NULL,
//     LINE VARCHAR2(50),
//     LOCATION VARCHAR2(50),
//     CATEGORY VARCHAR2(50),
//     MACHINE_TYPE VARCHAR2(50),
//     MACHINE_NAME VARCHAR2(50),
//     CAPACITY NUMBER(12,0),
//     CYCLE_TIME FLOAT,
//     FPY FLOAT,
//     CREATED_AT TIMESTAMP(0)
//                          DEFAULT CAST(SYSTIMESTAMP AS TIMESTAMP(0)) NOT NULL,
//     CONSTRAINT FATP_MACHINE_FPY_DATA PRIMARY KEY (ID)
// )

// ID	NUMBER	No	"PTHNEW"."ISEQ$$_79449".nextval
// LINE	VARCHAR2(50 BYTE)	No
// TYPE	VARCHAR2(50 BYTE)	No
// NAME	VARCHAR2(255 BYTE)	Yes
// PATH	VARCHAR2(1024 BYTE)	No
// CREATED_AT	TIMESTAMP(6)	Yes	SYSTIMESTAMP
// FACTORY	VARCHAR2(100 BYTE)	Yes
// MODEL	VARCHAR2(100 BYTE)	Yes
// SN	VARCHAR2(100 BYTE)	Yes
// SLOT	VARCHAR2(500 BYTE)	Yes
// ERROR	VARCHAR2(1024 BYTE)	Yes
// STATE	VARCHAR2(50 BYTE)	Yes
