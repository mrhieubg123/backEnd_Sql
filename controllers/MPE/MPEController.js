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

const MPEController = {
  createNewMachine: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      // Thực hiện truy vấn SQL
      const { formData, newProduct } = req.body;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!newProduct || newProduct.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu Excel!" });
      }

      const sql = `
        INSERT INTO MACHINE_SPARE_PARTS
            (Project, "Line", Machine, MachineName, MachineCode, "Location",
            Time_Start, Product_en, Product_vn, TimeControl, "Confirm", ID_Confirm, "Comment")
        VALUES
            (:project, :p_line, :machine, :machineName, :machineCode, :p_location,
            SYSDATE, :product_en, :product_vn, :time_control, :p_confirm, :id_confirm, :p_comment)
        `;
      const rows = Array.isArray(newProduct) ? newProduct : [newProduct];
      const binds = rows.map((row) => ({
        project: formData.project || "",
        p_line: formData.line || "",
        machine: formData.machine || "",
        machineName: formData.machineName || "",
        machineCode: formData.machineCode || "",
        p_location: formData.location || "",
        product_en: row.product_en || "",
        product_vn: row.product_vn || "",
        time_control: row.Time_Control.toString() || "",
        p_confirm: "", // bạn đang để '' trong SQL cũ
        id_confirm: "", // idem
        p_comment: "", // idem
      }));

      await connection.executeMany(sql, binds, { autoCommit: true });

      return res.json({ success: true, message: `Đã thêm vào bảng` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  // confirm spare parts
  confirmSpareParts: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!formData === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }
      let value2 = `(N'${formData.project || ""}', N'${
        formData.line || ""
      }', N'${formData.machine || ""}', N'${formData.machineName || ""}', N'${
        formData.machineCode || ""
      }', '${formData.location || ""}','${formData.DateTime || ""}', N'${
        formData.product_en || ""
      }', N'${formData.product_vn || ""}', '${
        formData.Time_Control || ""
      }','True','${formData.idConfirm || ""}', N'${formData.comment || ""}', '${
        formData.totalItemUse || ""
      }')`;
      const query = `INSERT INTO [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            ([Project] ,[Line] ,[Machine],[MachineName] ,[MachineCode] ,[Location] ,[Time_Start],[Product_en],[Product_vn],[TimeControl],[Confirm],[ID_Confirm],[Comment],[TotalItemUse])
              VALUES ${value2}`;
      await pool.request().query(query);

      return res.json({ success: true, message: `Xác nhận thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  //-- delete machine
  deleteItemSpareParts: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      const query = `Delete FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
            where [Project] like '${formData.project}' and [Line] like '${formData.line}' and [Machine] like '${formData.machine}' 
            and [MachineName] like '${formData.machineName}' and [Location] like '${formData.location}' and [MachineCode] like '${formData.machineCode}'
            and [Product_en] like '${formData.product_en}' and [Product_vn] COLLATE Vietnamese_CI_AS like N'%${formData.product_vn}%'`;
      await pool.request().query(query);

      return res.json({ success: true, message: `Đã xóa Item ` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Update Project & line
  editProjectAndLine: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!formData === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }
      const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set Project = N'${formData.newProject}' , Line = N'${formData.newLine}'
            Where Project like '${formData.project}' and Line like '${formData.line}'
            `;
      await pool.request().query(query);

      return res.json({ success: true, message: `Sửa đổi thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Update Machine
  editMachineName: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!formData === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }
      // let value2 = `(N'${formData.project}', N'${formData.line}', N'${formData.machine}', N'${formData.machineName}', N'${formData.machineCode}', '${formData.location}','${formData.DateTime}', N'${formData.product_en}', N'${formData.product_vn}', '${formData.Time_Control}','True','${formData.idConfirm}', N'${formData.comment}', '${formData.totalItemUse}')`
      const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set Machine = N'${formData.machine}' , MachineName = N'${formData.machineName}'
            Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}'
            `;
      await pool.request().query(query);

      return res.json({ success: true, message: `Sửa đổi thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Sửa đổi machine code
  editMachineCode: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!formData === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }
      // let value2 = `(N'${formData.project}', N'${formData.line}', N'${formData.machine}', N'${formData.machineName}', N'${formData.machineCode}', '${formData.location}','${formData.DateTime}', N'${formData.product_en}', N'${formData.product_vn}', '${formData.Time_Control}','True','${formData.idConfirm}', N'${formData.comment}', '${formData.totalItemUse}')`
      const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set MachineCode = N'${formData.machineCode}' 
            Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}' and Machine like '${formData.machine}' and MachineName like '${formData.machineName}'
            `;
      await pool.request().query(query);

      return res.json({ success: true, message: `Sửa đổi thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Sửa đổi Spare Part
  editSparePart: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { formData } = req.body;
      const pool = req.app.locals.db;
      // if (formData.department.toLowerCase() !== 'mpe') {
      //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
      // }
      if (!formData === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }
      const query = `
                Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
                set Product_en = N'${formData.newProduct_en}' , Product_vn =  N'${formData.newProduct_vn}'
                Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}' 
                and Machine like '${formData.machine}' and MachineName like '${formData.machineName}'
                and  Product_en = N'${formData.product_en}' and Product_vn =  N'${formData.product_vn}'`;
      await pool.request().query(query);

      return res.json({ success: true, message: `Sửa đổi thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getMachineSparePartsStatus: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      // 1. Lấy danh sách distinct location
      const locResult = await connection.execute(`
        SELECT DISTINCT "Location" FROM MACHINE_SPARE_PARTS order by TO_NUMBER("Location")
      `);

      // 2. Xây chuỗi location cho pivot
      const locations = locResult.rows.map((row) => row.Location);
      const pivotCols = locations.map((l) => `'M${l}' AS "M${l}"`).join(",");
      // Truy vấn lấy tất cả
      const result = await connection.execute(`
        select * from (
            SELECT  project,
            line,
            loc,
            machine || '-sta-' ||
            LISTAGG(station_time, '/-/') WITHIN GROUP (ORDER BY station_time) AS station_time
    FROM   (
        SELECT  NVL(project, '') AS project,
                NVL("Line", '') AS line,
                NVL(machine, '') || '//' || NVL(machinename, '') AS machine,
                NVL(machinecode, '') || '//' ||
                TO_CHAR(
                    TRUNC(
                        ( MIN(time_start + NVL(timecontrol, 0)) - SYSDATE ) * 24
                    )
                ) AS station_time,
                'M' || NVL("Location", '0') AS loc
        FROM   machine_spare_parts
        WHERE  id IN (
            SELECT MAX(id)
            FROM   machine_spare_parts
            GROUP BY project, "Line", machine, machinename, machinecode, "Location", product_en, product_vn
        )
        GROUP BY project, "Line", machine, machinename, machinecode, "Location"
    ) bang1
    group by Project,line, machine,loc
                    ) bang3 pivot(max(Station_Time) for loc in (${pivotCols})) pvt
                    ORDER BY  Project, line
                  `);
      // Trả về danh sách
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching getMachineSparePartsStatus: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getMachineSparePartsDetail: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      // Truy vấn lấy tất cả
      const result = await connection.execute(`
                SELECT Project,"Line",Machine,MachineName,'M'|| NVL("Location", '0') as Location,MachineCode, Product_en,
                Product_vn,Time_Start,TimeControl,nvl(TotalItemUse , '0') as TotalItemUse,ID_Confirm,"Comment"
                FROM MACHINE_SPARE_PARTS  where ID_Confirm is not null 
                and Time_Start between 
                TO_DATE('${
                  req.body.dateFrom || convertDate(oneDayAgo)
                }','YYYY-MM-DD HH24:MI:SS')
                AND TO_DATE('${
                  req.body.dateTo || convertDate(now)
                }','YYYY-MM-DD HH24:MI:SS')
                order by Time_Start DESC`);
      // Trả về danh sách
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching getMachineSparePartsDetail: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getHistorySparePartsDetails: async (req, res) => {
    try {
      const pool = req.app.locals.db; // Lấy kết nối từ app.locals
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      // Truy vấn lấy tất cả
      const result = await pool.request().query(`
                SELECT top(20) [Project],[Line],[Machine],[MachineName],'H'+ [Location] as [Location],[MachineCode],[Product_en],
                [Product_vn],[Time_Start],[TimeControl],isnull([TotalItemUse] , '0') as [TotalItemUse],[ID_Confirm],[Comment]
                FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where [Project] like N'${
                  req.body.project || ""
                }' and [Line] like N'${
        req.body.line || ""
      }' and [Machine] like N'${
        req.body.machine || ""
      }' and [MachineName] like N'${req.body.machineName || ""}' and 
                [Location] like '${
                  req.body.location || ""
                }' and [MachineCode] like N'${
        req.body.machineCode || ""
      }' and [Product_en] like N'${
        req.body.product_en || ""
      }' and [Product_vn] like N'${req.body.product_vn || ""}'
                order by [Time_Start] DESC
            `);
      // Trả về danh sách
      return res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getMachineCodeDetailsbyYear: async (req, res) => {
    try {
      const pool = req.app.locals.db; // Lấy kết nối từ app.locals
      // Truy vấn lấy tất cả
      const result = await pool.request().query(`
                SELECT [Project],[Line],[Machine],[MachineName],'H'+ [Location] as [Location],[MachineCode],[Product_en],
                [Product_vn],[Time_Start],[TimeControl],isnull([TotalItemUse] , '0') as [TotalItemUse],[ID_Confirm],[Comment]
                FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where [Project] like N'${
                  req.body.project || ""
                }' and [Line] like N'${
        req.body.line || ""
      }' and [Machine] like N'${
        req.body.machine || ""
      }' and [MachineName] like N'${req.body.machineName || ""}' and 
                [Location] like '${
                  req.body.location || ""
                }' and [MachineCode] like N'${
        req.body.machineCode || ""
      }' and YEAR([Time_Start]) = ${req.body.year}
                order by [Time_Start] ASC
            `);
      // Trả về danh sách
      return res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getSparePartsDetail: async (req, res) => {
    try {
      const pool = req.app.locals.db; // Lấy kết nối từ app.locals
      // Truy vấn lấy tất cả
      const result = await pool.request().query(`
                    select [Project],[Line], [Machine],[MachineName],[Location],[MachineCode], [Time_Start], DATEADD(MINUTE, CAST([TimeControl] as float)*24*60,[Time_Start] ) as Time_End ,case when DATEDIFF(MINUTE, GETDATE(),DATEADD(MINUTE, CAST([TimeControl] as float)*24*60,[Time_Start] ) ) > 0 then 'True' else 'False' end as IsConfirm, DATEDIFF(MINUTE, GETDATE(),DATEADD(MINUTE, CAST([TimeControl] as float)*24*60,[Time_Start] ) ) as DateDiff , [Product_en], [Product_vn], [TimeControl], [ID_Confirm], [Comment] from (
                        SELECT [Project],[Line], [Machine],[MachineName],[Location],[MachineCode], MAX([Time_Start]) as [Time_Start],[Product_en], [Product_vn], [TimeControl], [ID_Confirm], [Comment] 
                        FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
                        where ID in (select MAX(ID) FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
                        where [Project] like '${req.body.project}' and [Line] like '${req.body.line}' and [Machine] like '${req.body.machine}' and [MachineName] like '${req.body.machineName}' and [Location] like '${req.body.location}' and [MachineCode] like '${req.body.machineCode}'
                        group by [Project],[Line], [Machine],[MachineName],[Location],[MachineCode], [Product_en], [Product_vn]
                        )
                        group by [Project],[Line], [Machine],[MachineName],[Location],[MachineCode], [Product_en], [Product_vn], [TimeControl], [ID_Confirm], [Comment]
                    ) as bang1 
                `);
      // Trả về danh sách
      return res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getListSparePartsProduct: async (req, res) => {
    try {
      const pool = req.app.locals.db; // Lấy kết nối từ app.locals
      // Truy vấn lấy tất cả
      const result = await pool.request().query(`
                select DISTINCT [Product_EN] as [Product_en], [Product_VN] as [Product_vn] FROM [SV96].[BN3_CONNECT].[dbo].[PRODUCT_SPARE_PARTS]
                `);
      // Trả về danh sách
      return res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getEquipmentInStock: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      // Truy vấn lấy tất cả
      const result = await connection.execute(`
        SELECT  product_en,
                product_vn,
                NVL("IN",    0) AS "In",
                NVL("OUT",   0) AS "Out",
                NVL("SCRAP", 0) AS "Scrap"
        FROM   (
            SELECT  i.product_en,
                    i.product_vn,
                    SUM(a.quantity) AS quantity,
                    a.transactionstype
            FROM   product_spare_parts      i
                JOIN spare_parts_transactions a
                    ON i.product_id = a.product_id
            GROUP BY i.product_en,
                    i.product_vn,
                    a.transactionstype
        ) bang1
        PIVOT (
            SUM(quantity)
            FOR transactionstype IN (
                'In'    AS "IN",
                'Out'   AS "OUT",
                'Scrap' AS "SCRAP"
            )
        ) bang2`);
      // Trả về danh sách
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching getEquipmentInStock: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getEquipmentUseInMonth: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      // Truy vấn lấy tất cả
      const result = await connection.execute(`
                select a.Product_EN, a.Product_VN, Quantity, TransactionsType, TransactionsTime, Note 
                FROM PRODUCT_SPARE_PARTS a 
                join  SPARE_PARTS_Transactions b 
                on a.Product_ID = b.Product_ID 
                where EXTRACT(MONTH FROM b.transactionstime) = ${req.body.month} 
                    and EXTRACT(YEAR  FROM b.transactionstime) = ${req.body.year} and Quantity not like '0'
                order by TransactionsTime DESC
            `);
      // Trả về danh sách
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching getEquipmentUseInMonth: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getPieChart: async (req, res) => {
    try {
      const pool = req.app.locals.db; // Lấy kết nối từ app.locals
      // Truy vấn lấy tất cả
      const result = await pool.request().query(`
                select * from [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
                where MONTH(Time_Start) = ${req.body.month} and YEAR(Time_Start) = ${req.body.year} and TotalItemUse is not null 
            `);
      // Trả về danh sách
      return res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching users: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  addEquipmentToStock: async (req, res) => {
    try {
      // Thực hiện truy vấn SQL
      const { newAddEquipment } = req.body;
      const pool = req.app.locals.db;
      if (!newAddEquipment === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có dữ liệu !" });
      }

      const query = `DECLARE @Product_EN NVARCHAR(150) = N'${newAddEquipment.product_en}';
                DECLARE @Product_VN NVARCHAR(150) = N'${newAddEquipment.product_vn}';
                DECLARE @Quantity INT = ${newAddEquipment.quantity};
                DECLARE @TransactionType NVARCHAR(10) = N'In';
                DECLARE @Product_ID INT;
                DECLARE @Note  NVARCHAR(250) = N'${newAddEquipment.comment}';
                
                -- kiem tra nếu sản phẩm đã tồn tại
                SELECT @Product_ID = Product_ID FROM [SV96].[BN3_CONNECT].[dbo].[PRODUCT_SPARE_PARTS] WHERE Product_EN = @Product_EN and Product_VN = @Product_VN
                
                IF @Product_ID IS NULL
                BEGIN 
                    INSERT INTO [SV96].[BN3_CONNECT].[dbo].[PRODUCT_SPARE_PARTS] (Product_EN, Product_VN )
                    VALUES (@Product_EN, @Product_VN);
                END
                
                SELECT @Product_ID = Product_ID FROM [SV96].[BN3_CONNECT].[dbo].[PRODUCT_SPARE_PARTS] WHERE Product_EN = @Product_EN and Product_VN = @Product_VN
                
                INSERT INTO [SV96].[BN3_CONNECT].[dbo].[SPARE_PARTS_Transactions] (Product_ID, Quantity ,TransactionsType, TransactionsTime , Note )
                VALUES (@Product_ID, @Quantity, @TransactionType, GETDATE(),@Note);
            `;
      await pool.request().query(query);

      return res.json({ success: true, message: `Thêm tồn kho thành công.` });
    } catch (err) {
      console.error("insert Error", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = MPEController;
