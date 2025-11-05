const convertDate = (date) =>{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formarttedDate = `${year}-${month}-${date1} ${hours}:${minutes}:${seconds}`;
    return formarttedDate;
} 

function getCurrentShiftTimeRange(date) {
    const now = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate()).padStart(2, '0');
    // dinh nghia cac ca lam viec
    const startDayShift = new Date(`${year}-${month}-${date1}T07:30:00`)
    const endDayShift = new Date(`${year}-${month}-${date1}T19:30:00`)
    const startNightShift = new Date(`${year}-${month}-${date1}T19:30:00`)
    const shift = new Date(`${year}-${month}-${date1}T23:59:59`)
    const prevDay = new Date(now);
    prevDay.setDate(prevDay.getDate() - 1);
    prevDay.setHours(19, 30, 0, 0);

    let shiftStart, shiftEnd, shiftName;
    if (now >= startDayShift && now < endDayShift) {
        shiftStart = convertDate(startDayShift);
        shiftEnd = convertDate(endDayShift);
        shiftName = "ca ngay"
    }
    else if (now >= startNightShift && now < shift) {
        shiftStart = convertDate(startNightShift);
        shiftEnd = convertDate(shift);
        shiftName = "ca dem 19:30-00:00"
    }
    else {
        shiftStart = convertDate(prevDay);
        shiftEnd = convertDate(startDayShift);
        shiftName = "ca dem 19:30-07:00"
    }
    return {
        dateFrom: shiftStart.toString(),
        dateTo: shiftEnd.toString(),
        name: shiftName
    }
}


const MPEController = {
    
    createNewMachine: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData, newProduct} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!newProduct || newProduct.length === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu Excel!"});
            }
            

            let value2 = Array.isArray(newProduct) ? newProduct.map((row) => {
                return `(N'${formData.project || ''}', N'${formData.line || ''}', N'${formData.machine || ''}', N'${formData.machineName || ''}', N'${formData.machineCode || ''}', '${formData.location || ''}', GETDATE(), N'${row.product_en || ''}', N'${row.product_vn || ''}', '${row.Time_Control || ''}','','','')`
            }) :
            [newProduct].map((row) => {
                return `(N'${formData.project || ''}', N'${formData.line || ''}', N'${formData.machine || ''}', N'${formData.machineName || ''}', N'${formData.machineCode || ''}', '${formData.location || ''}', GETDATE(), N'${row.product_en || ''}', N'${row.product_vn || ''}', '${row.Time_Control || ''}','','','')`
            })

            const query = `INSERT INTO [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            ([Project] ,[Line] ,[Machine],[MachineName] ,[MachineCode] ,[Location] ,[Time_Start],[Product_en],[Product_vn],[TimeControl],[Confirm],[ID_Confirm],[Comment])
              VALUES ${value2}`
            await pool.request().query(query);

            return res.json({success: true, message: `Đã thêm vào bảng`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },  

    // confirm spare parts
    confirmSpareParts: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!formData === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
            }
            let value2 = `(N'${formData.project || ''}', N'${formData.line || ''}', N'${formData.machine || ''}', N'${formData.machineName || ''}', N'${formData.machineCode || ''}', '${formData.location || ''}','${formData.DateTime || ''}', N'${formData.product_en || ''}', N'${formData.product_vn || ''}', '${formData.Time_Control || ''}','True','${formData.idConfirm || ''}', N'${formData.comment || ''}', '${formData.totalItemUse || ''}')`
            const query = `INSERT INTO [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            ([Project] ,[Line] ,[Machine],[MachineName] ,[MachineCode] ,[Location] ,[Time_Start],[Product_en],[Product_vn],[TimeControl],[Confirm],[ID_Confirm],[Comment],[TotalItemUse])
              VALUES ${value2}`
            await pool.request().query(query);

            return res.json({success: true, message: `Xác nhận thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },  


     //-- delete machine
     deleteItemSpareParts: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            const query = `Delete FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
            where [Project] like '${formData.project}' and [Line] like '${formData.line}' and [Machine] like '${formData.machine}' 
            and [MachineName] like '${formData.machineName}' and [Location] like '${formData.location}' and [MachineCode] like '${formData.machineCode}'
            and [Product_en] like '${formData.product_en}' and [Product_vn] COLLATE Vietnamese_CI_AS like N'%${formData.product_vn}%'`
            await pool.request().query(query);

            return res.json({success: true, message: `Đã xóa Item `})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },  


    // Update Project & line
    editProjectAndLine: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!formData === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
            }
            const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set Project = N'${formData.newProject}' , Line = N'${formData.newLine}'
            Where Project like '${formData.project}' and Line like '${formData.line}'
            `
            await pool.request().query(query);

            return res.json({success: true, message: `Sửa đổi thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },

    // Update Machine
    editMachineName: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!formData === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
            }
            // let value2 = `(N'${formData.project}', N'${formData.line}', N'${formData.machine}', N'${formData.machineName}', N'${formData.machineCode}', '${formData.location}','${formData.DateTime}', N'${formData.product_en}', N'${formData.product_vn}', '${formData.Time_Control}','True','${formData.idConfirm}', N'${formData.comment}', '${formData.totalItemUse}')`
            const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set Machine = N'${formData.machine}' , MachineName = N'${formData.machineName}'
            Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}'
            `
            await pool.request().query(query);

            return res.json({success: true, message: `Sửa đổi thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },

    // Sửa đổi machine code
    editMachineCode: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!formData === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
            }
            // let value2 = `(N'${formData.project}', N'${formData.line}', N'${formData.machine}', N'${formData.machineName}', N'${formData.machineCode}', '${formData.location}','${formData.DateTime}', N'${formData.product_en}', N'${formData.product_vn}', '${formData.Time_Control}','True','${formData.idConfirm}', N'${formData.comment}', '${formData.totalItemUse}')`
            const query = `Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
            set MachineCode = N'${formData.machineCode}' 
            Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}' and Machine like '${formData.machine}' and MachineName like '${formData.machineName}'
            `
            await pool.request().query(query);

            return res.json({success: true, message: `Sửa đổi thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },
    

    // Sửa đổi Spare Part
    editSparePart: async (req, res) => {
        try {
            // Thực hiện truy vấn SQL
            const {formData} = req.body;
            const pool = req.app.locals.db;
            // if (formData.department.toLowerCase() !== 'mpe') {
            //     return res.status(403).send({ message: 'Bạn không phải MPE !' });
            // }
            if(!formData === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
            }
            const query = `
                Update [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS]
                set Product_en = N'${formData.newProduct_en}' , Product_vn =  N'${formData.newProduct_vn}'
                Where Project like '${formData.project}' and Line like '${formData.line}' and Location like '${formData.location}' 
                and Machine like '${formData.machine}' and MachineName like '${formData.machineName}'
                and  Product_en = N'${formData.product_en}' and Product_vn =  N'${formData.product_vn}'`
            await pool.request().query(query);

            return res.json({success: true, message: `Sửa đổi thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },

    getMachineSparePartsStatus: async (req, res) => {
        try {
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            // Truy vấn lấy tất cả 
            const result = await pool.request().query(`
                Declare @cols NVARCHAR(MAX),
                        @query NVARCHAR(MAX)
                    select @cols = STRING_AGG(QUOTENAME('H'+LOCATION),',') WITHIN GROUP (ORDER BY CAST(LOCATION as INT))
                    from (
                        SELECT DISTINCT LOCATION 
                        FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
                    ) AS p ;
                SET @query = '
                    select Project, Line, '+@cols+' from (
                    select [Project],[Line],[Location], machine+''-sta-''+ STRING_AGG([Station_Time], ''/-/'') as [Station_Time]   from (
                    select isnull([Project] , '''') as [Project] , isnull([Line] , '''') as [Line] , isnull([Machine] , '''') +''//''+ isnull([MachineName], '''')  as machine , isnull([MachineCode], '''') +''//''+ convert(varchar , DATEDIFF(HOUR,  GETDATE(),MIN(DATEADD(HOUR, CONVERT(float,isnull([TimeControl],''0''))*24 , [Time_Start])))) as [Station_Time] , ''H''+ isnull([Location],''0'') as [Location]  from [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where 
                    ID in (select max(ID) from [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] 
                    group by [Project],[Line] ,[Machine],[MachineName] ,[MachineCode] ,[Location],[Product_en],[Product_vn])
                    group by [Project],[Line] ,[Machine],[MachineName] ,[MachineCode] ,[Location]
                    ) as bang1 group by [Project],[Line], machine,[Location]
                    ) as bang3 pivot(max([Station_Time]) for [Location] in ('+@cols+')) as pvt
                    ORDER BY  Project, Line
                    '
                EXEC sp_executesql @query`);
            // Trả về danh sách
            return res.status(200).json(result.recordset);
        } catch (err) {
            console.error("Error fetching users: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

    getMachineSparePartsDetail: async (req, res) => {
        try {
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 7*24*60*60*1000);
            // Truy vấn lấy tất cả 
            const result = await pool.request().query(`
                SELECT [Project],[Line],[Machine],[MachineName],'H'+ [Location] as [Location],[MachineCode],[Product_en],
                [Product_vn],[Time_Start],[TimeControl],isnull([TotalItemUse] , '0') as [TotalItemUse],[ID_Confirm],[Comment]
                FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where isnull([ID_Confirm] , '') not like '' 
                and [Time_Start] between '${req.body.dateFrom || convertDate(oneDayAgo)}' and '${req.body.dateTo || convertDate(now)}'
                order by [Time_Start] DESC`);
            // Trả về danh sách
            return res.status(200).json(result.recordset);
        } catch (err) {
            console.error("Error fetching users: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

    getHistorySparePartsDetails: async (req, res) => {
        try {
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 7*24*60*60*1000);
            // Truy vấn lấy tất cả 
            const result = await pool.request().query(`
                SELECT top(20) [Project],[Line],[Machine],[MachineName],'H'+ [Location] as [Location],[MachineCode],[Product_en],
                [Product_vn],[Time_Start],[TimeControl],isnull([TotalItemUse] , '0') as [TotalItemUse],[ID_Confirm],[Comment]
                FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where [Project] like N'${req.body.project || ''}' and [Line] like N'${req.body.line || ''}' and [Machine] like N'${req.body.machine || ''}' and [MachineName] like N'${req.body.machineName || ''}' and 
                [Location] like '${req.body.location || ''}' and [MachineCode] like N'${req.body.machineCode || ''}' and [Product_en] like N'${req.body.product_en || ''}' and [Product_vn] like N'${req.body.product_vn || ''}'
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
                FROM [SV96].[BN3_CONNECT].[dbo].[MACHINE_SPARE_PARTS] where [Project] like N'${req.body.project || ''}' and [Line] like N'${req.body.line || ''}' and [Machine] like N'${req.body.machine || ''}' and [MachineName] like N'${req.body.machineName || ''}' and 
                [Location] like '${req.body.location || ''}' and [MachineCode] like N'${req.body.machineCode || ''}' and YEAR([Time_Start]) = ${req.body.year}
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
        try {
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            // Truy vấn lấy tất cả 
            const result = await pool.request().query(`
                select Product_EN, Product_VN, ISNULL([IN], 0) as [In],ISNULL([Out], 0) as [Out],ISNULL([Scrap] , 0) as [Scrap]  from (
                SELECT i.Product_EN, i.Product_VN,SUM(Quantity) as Quantity, TransactionsType FROM [SV96].[BN3_CONNECT].[dbo].[PRODUCT_SPARE_PARTS] i JOIN
                [SV96].[BN3_CONNECT].[dbo].[SPARE_PARTS_Transactions] a on i.Product_ID = a.Product_ID
                group by i.Product_EN, i.Product_VN, TransactionsType
                ) as bang1 pivot (SUM(Quantity) for TransactionsType in ([In],[Out],[Scrap])) as bang2
                
            `);
            // Trả về danh sách
            return res.status(200).json(result.recordset);
        } catch (err) {
            console.error("Error fetching users: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

    getEquipmentUseInMonth: async (req, res) => {
        try {
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            // Truy vấn lấy tất cả 
            const result = await pool.request().query(`
                select a.Product_EN, a.Product_VN, Quantity, TransactionsType, TransactionsTime, Note 
                FROM [SV96].[BN3_CONNECT].[dbo].PRODUCT_SPARE_PARTS a 
                join  [SV96].[BN3_CONNECT].[dbo].SPARE_PARTS_Transactions b 
                on a.Product_ID = b.Product_ID where MONTH(TransactionsTime) = ${req.body.month} and YEAR(TransactionsTime) = ${req.body.year} and Quantity not like '0'
                order by TransactionsTime DESC
            `);
            // Trả về danh sách
            return res.status(200).json(result.recordset);
        } catch (err) {
            console.error("Error fetching users: ", err);
            return res.status(500).json({ msg: err.message });
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
            const {newAddEquipment} = req.body;
            const pool = req.app.locals.db;
            if(!newAddEquipment === 0){
                return res.status(400).json({success: false, message:"Không có dữ liệu !"});
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
            `
            await pool.request().query(query);

            return res.json({success: true, message: `Thêm tồn kho thành công.`})
        } catch (err) {
            console.error("insert Error", err);
            res.status(500).json({success: false, message: err.message});
        }
    
    },  

  

};

module.exports = MPEController;