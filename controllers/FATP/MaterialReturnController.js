const axios = require('axios');
const https = require("https");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
})

const convertDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formarttedDate = `${year}-${month}-${date1} ${hours}:${minutes}:${seconds}`;
    return formarttedDate;
}
const convertDate2 = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formarttedDate = `${year}-${month}-${date1}`;
    return formarttedDate;
}

const convertDate2plus1 = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formarttedDate = `${year}-${month}-${date1}`;
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
function getCurrentShiftOnDay(date) {
    const now = new Date(date.replace(' ', 'T'));
    const idate = new Date(date.replace(' ', 'T'));
    const year = idate.getFullYear();
    const month = String(idate.getMonth() + 1).padStart(2, '0');
    const date1 = String(idate.getDate()).padStart(2, '0');
    const date1cong1 = String(idate.getDate() + 1).padStart(2, '0');
    const date1tru1 = String(idate.getDate() - 1).padStart(2, '0');
    const startDayShiftcong1 = new Date(`${year}-${month}-${date1cong1}T07:30:00`)
    const startDayShifttru1 = new Date(`${year}-${month}-${date1tru1}T07:30:00`)
    // dinh nghia cac ca lam viec
    const startDayShift = new Date(`${year}-${month}-${date1}T07:30:00`)
    const shift = new Date(`${year}-${month}-${date1}T00:00:00`)
    const prevDay = new Date(now);
    prevDay.setDate(prevDay.getDate() - 1);
    prevDay.setHours(19, 30, 0, 0);
    let shiftStart, shiftEnd, shiftName;
    if (now > shift && now < startDayShift) {
        shiftStart = convertDate(startDayShifttru1);
        shiftEnd = convertDate(startDayShift);
        shiftName = "ca 2"
    }

    else {
        shiftStart = convertDate(startDayShift);
        shiftEnd = convertDate(startDayShiftcong1);
        shiftName = "ca 1"
    }
    return {
        dateFrom: shiftStart.toString(),
        dateTo: shiftEnd.toString(),
        name: shiftName
    }
}


function getCurrentTime30(date) {
    const now = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const date1 = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');

    // dinh nghia cac ca lam viec
    const startTime1 = new Date(`${year}-${month}-${date1}T${hours}:30:00`)
    startTime1.setHours(startTime1.getHours() - 2)
    const endTime1 = new Date(`${year}-${month}-${date1}T${hours}:30:00`)
    endTime1.setHours(endTime1.getHours() - 1)
    const startTime2 = new Date(`${year}-${month}-${date1}T${hours}:30:00`)
    startTime2.setHours(startTime2.getHours() - 1)
    const endTime2 = new Date(`${year}-${month}-${date1}T${hours}:30:00`)
    const Time = new Date(`${year}-${month}-${date1}T${hours}:30:00`)
    const prevDay = new Date(now);

    prevDay.setDate(prevDay.getDate() - 1);
    prevDay.setHours(19, 30, 0, 0);
    let shiftStart, shiftEnd;
    if (now < Time) {
        shiftStart = convertDate(startTime1);
        shiftEnd = convertDate(endTime1);
    }
    else {
        shiftStart = convertDate(startTime2);
        shiftEnd = convertDate(endTime2);
    }

    return {
        dateFrom: shiftStart.toString(),
        dateTo: shiftEnd.toString(),
    }
}
function getCurrentDayPlusOne(date) {
    const date21 = new Date(date);
    const year = date21.getFullYear();
    const month = String(date21.getMonth() + 1).padStart(2, '0');
    const date1 = String(date21.getDate()).padStart(2, '0');
    const hours = String(date21.getHours()).padStart(2, '0');
    const startTime1 = new Date(`${year}-${month}-${date1}`)
    startTime1.setDate(startTime1.getDate() + 1)
    const year12 = startTime1.getFullYear();
    const month12 = String(startTime1.getMonth() + 1).padStart(2, '0');
    const date112 = String(startTime1.getDate()).padStart(2, '0');
    return `${year12}-${month12}-${date112}`;

}

function convertArrToStr(arr) {
    const isArray = Array.isArray(arr);
    const queryArray = isArray ? arr : [];
    return queryArray.length > 0 ? arr.map(item => `'${item}'`).join(`,`) : '';
}

const MaterialReturnController = {

    getMaterialReturn: async (req, res) => {
        const now = new Date();
        const timeR = getCurrentShiftTimeRange(now)
        let data = JSON.stringify({
            "query": `select * from (SELECT DISTINCT 
            a.TR_SN,
            a.wo,
            c.p_no as model,
            a.KP_NO,
            c.STATION,
            c.SLOT_NO,
            TO_char(b.END_TIME,'YYYY/MM/DD HH24:MI:SS') as end_time, 
            b.EMP_NO,
            'Wait return' AS Status,
            d.WO_REQUEST AS Slot_request,
            (
                SELECT SUM(ADD_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
            ) AS Slot_online,
            (
                SELECT SUM(ADD_QTY) - SUM(RETURN_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
                  ) AS QTY,(
                SELECT  SUM(RETURN_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
                  ) AS RETURN_QTY
        FROM MES4.R_TR_SN_WIP@VNAPB06 a
        JOIN MES4.R_KP_LIST@VNAPB06 b ON a.tr_sn=b.tr_sn AND a.wo=b.wo
        JOIN MES4.R_TR_CODE_DETAIL@VNAPB06 c ON b.wo=c.wo AND b.kp_no=c.kp_no AND b.station=c.station AND a.tr_sn=c.tr_sn
        JOIN MES4.R_WO_REQUEST@VNAPB06 d ON a.wo=d.wo AND a.KP_NO=d.CUST_KP_NO
        WHERE a.work_flag='0'
          and end_time between TO_DATE('${req.body.dateFrom || timeR.dateFrom}','YYYY/MM/DD HH24:MI:SS')and TO_DATE('${req.body.dateTo || timeR.dateTo}','YYYY/MM/DD HH24:MI:SS')
        )`
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://10.225.42.71:5000/api/v1/proxyApiSfc',
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: httpsAgent,
            data: data
        };
        // const response = await axios.get(`http://10.225.34.61/Web_API_SMT/api/GetDataSMT`,params: req.body);
        // return res.json(response.data.message);
        axios.request(config)
            .then((response) => {
                return res.json(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    },

    getMaterialKiting: async (req, res) => {
        const now = new Date();
        const timeR = getCurrentShiftTimeRange(now)
        let data = JSON.stringify({
            "query": `select a.tr_Sn,a.cust_kp_no as kp_no, a.kitting_wo as wo,a.qty as slot_request, a.emp_no,
             a.ext_qty as return_qty, a.kitting_flag, decode(a.work_flag,'0','OK','9','LOCK WAIT UNLOCK') STATUS, 
             decode(a.location_flag,'1','KITTING','2','LINE') STATION, TO_char(b.MOVE_TIME,'YYYY/MM/DD HH24:MI:SS') as end_time from
            mes4.r_tr_sn@VNAPB06 a, 
            mes4.r_kitting_scan_detail@VNAPB06 b where  
              a.tr_Sn in (select tr_Sn from mes4.r_kitting_scan_detail@VNAPB06 
              where 
              MOVE_TYPE = 'd')
              and a.tr_Sn = b.tr_Sn  and  b.MOVE_TYPE = 'd' 
              and b.move_time between TO_DATE('${req.body.dateFrom || timeR.dateFrom}','YYYY/MM/DD HH24:MI:SS')and TO_DATE('${req.body.dateTo || timeR.dateTo}','YYYY/MM/DD HH24:MI:SS')`
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://10.225.42.71:5000/api/v1/proxyApiSfc',
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: httpsAgent,
            data: data
        };
        // const response = await axios.get(`http://10.225.34.61/Web_API_SMT/api/GetDataSMT`,params: req.body);
        // return res.json(response.data.message);
        axios.request(config)
            .then((response) => {
                return res.json(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    },

    getMaterialReturnTotalTrend: async (req, res) => {
        const now = new Date();
        const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let data = JSON.stringify({
            "query": `select * from (SELECT DISTINCT 
            a.TR_SN,
            a.wo,
            c.p_no as model,
            a.KP_NO,
            c.STATION,
            c.SLOT_NO,
            TO_char(b.END_TIME,'YYYY/MM/DD HH24:MI:SS') as end_time, 
            b.EMP_NO,
            'Wait return' AS Status,
            d.WO_REQUEST AS Slot_request,
            (
                SELECT SUM(ADD_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
            ) AS Slot_online,
            (
                SELECT SUM(ADD_QTY) - SUM(RETURN_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
                  ) AS QTY,(
                SELECT  SUM(RETURN_QTY)
                FROM MES4.SMT_LOAD_TRSN_AUTO@VNAPB06 x
                WHERE x.WO = a.wo
                  AND x.KP_NO = a.kp_no
                  AND x.SLOT_NO = c.SLOT_NO
                  AND x.tr_sn = a.tr_sn
                  ) AS RETURN_QTY
        FROM MES4.R_TR_SN_WIP@VNAPB06 a
        JOIN MES4.R_KP_LIST@VNAPB06 b ON a.tr_sn=b.tr_sn AND a.wo=b.wo
        JOIN MES4.R_TR_CODE_DETAIL@VNAPB06 c ON b.wo=c.wo AND b.kp_no=c.kp_no AND b.station=c.station AND a.tr_sn=c.tr_sn
        JOIN MES4.R_WO_REQUEST@VNAPB06 d ON a.wo=d.wo AND a.KP_NO=d.CUST_KP_NO
        WHERE a.work_flag='0'
          and end_time between TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo) + ' 00:00:00'}','YYYY/MM/DD HH24:MI:SS')and TO_DATE('${req.body.dateTo || convertDate2(now) + ' 23:59:59'}','YYYY/MM/DD HH24:MI:SS')
        )`
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://10.225.42.71:5000/api/v1/proxyApiSfc',
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: httpsAgent,
            data: data
        };
        axios.request(config)
            .then((response) => {
                return res.json(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    },

    getMaterialKitingTotalTrend: async (req, res) => {
        const now = new Date();
        const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let data = JSON.stringify({
            "query": `select a.tr_Sn,a.cust_kp_no as kp_no, a.kitting_wo as wo,a.qty as slot_request, a.emp_no, a.ext_qty as return_qty, a.kitting_flag, decode(a.work_flag,'0','OK','9','LOCK WAIT UNLOCK') STATUS, decode(a.location_flag,'1','KITTING','2','LINE') STATION, TO_char(b.MOVE_TIME,'YYYY/MM/DD HH24:MI:SS') as end_time from
            mes4.r_tr_sn@VNAPB06 a, 
            mes4.r_kitting_scan_detail@VNAPB06 b where  
              a.tr_Sn in (select tr_Sn from mes4.r_kitting_scan_detail@VNAPB06 
              where 
              MOVE_TYPE = 'd')
              and a.tr_Sn = b.tr_Sn  and  b.MOVE_TYPE = 'd' 
              and b.move_time between TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo) + ' 00:00:00'}','YYYY/MM/DD HH24:MI:SS')and TO_DATE('${req.body.dateTo || convertDate2(now) + ' 23:59:59'}','YYYY/MM/DD HH24:MI:SS')`
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://10.225.42.71:5000/api/v1/proxyApiSfc',
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: httpsAgent,
            data: data
        };
        axios.request(config)
            .then((response) => {
                return res.json(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    },

    getDataMaterialReturnStatusTotalTrend: async (req, res) => {
        try {
            const now = new Date();
            const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            const result = await pool.request().query(`SELECT *
            FROM [SV205].[BN3_205].[dbo].[BN3_MATERIAL_RETURN_DETAIL]
            where end_time BETWEEN TO_DATE('${req.body.dateFrom || convertDate2(sevenDayAgo) + ' 00:00:00'}','YYYY/MM/DD HH24:MI:SS')
            and TO_DATE('${req.body.dateTo || convertDate2(now) + ' 23:59:59'}','YYYY/MM/DD HH24:MI:SS')`);
            return res.status(200).json(result.recordset);
        }
        catch (err) {
            console.error("Error fetching getDataMaterialReturnStatus: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

    getDataMaterialReturnStatus: async (req, res) => {
        try {
            const now = new Date();
            const timeR = getCurrentShiftTimeRange(now)
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            const result = await pool.request().query(`SELECT *
            FROM [SV205].[BN3_205].[dbo].[BN3_MATERIAL_RETURN_DETAIL]
            where end_time BETWEEN '${req.body.dateFrom || timeR.dateFrom}' and '${req.body.dateTo || timeR.dateTo}'`);
            return res.status(200).json(result.recordset);
        }
        catch (err) {
            console.error("Error fetching getDataMaterialReturnStatus: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

    addMaterialReturnStatus: async (req, res) => {
        try {
            const sql = require('mssql');
            const pool = req.app.locals.db; // Lấy kết nối từ app.locals
            const endTime = new Date(req.body.end_time); 
        
            // Trong request body của bạn KHÔNG có date_time, 
            // nên ta sẽ sử dụng ngày giờ hiện tại của server (hoặc một giá trị mặc định nào đó)
            const dateTime = req.body.date_time ? new Date(req.body.date_time) : new Date();
    
            // Kiểm tra xem việc chuyển đổi có hợp lệ không
            if (isNaN(endTime.getTime()) || isNaN(dateTime.getTime())) {
                 return res.status(400).json({ msg: "Định dạng ngày giờ (end_time hoặc date_time) không hợp lệ." });
            }
    
    
            // 2. Sử dụng request().input() để tham số hóa truy vấn
            const request = pool.request();
            
            request.input('DATE_TIME', sql.DateTime, dateTime);
            request.input('END_TIME', sql.DateTime, endTime); // <-- Khắc phục lỗi tại đây
            request.input('WO', sql.NVarChar, req.body.wo);
            request.input('TR_SN', sql.NVarChar, req.body.tr_sn);
            request.input('KP_NO', sql.NVarChar, req.body.kp_no);
            request.input('REQUEST_QTY', sql.Int, req.body.slot_request); // Giả sử REQUEST_QTY là kiểu Int
            request.input('RETURN_QTY', sql.Int, req.body.return_qty); // Giả sử RETURN_QTY là kiểu Int
            request.input('STATUS', sql.NVarChar, req.body.status);
            request.input('TYPE', sql.NVarChar, req.body.type);
            request.input('MODEL', sql.NVarChar, req.body.model);
            request.input('COMMENT', sql.NVarChar, req.body.comment);
            request.input('STATION', sql.NVarChar, req.body.station);
            request.input('EMP_NO', sql.NVarChar, req.body.emp_no);
            request.input('EMP_CONFIRM', sql.NVarChar, req.body.emp_confirm);
            request.input('SLOT_NO', sql.NVarChar, req.body.slot_no);
            
    
            // 3. Thực hiện truy vấn (Sử dụng tên tham số (@...) thay vì chuỗi)
            const query = `
                INSERT INTO [SV205].[BN3_205].[dbo].[BN3_MATERIAL_RETURN_DETAIL]
                (
                    [DATE_TIME], [END_TIME], [WO], [TR_SN], [KP_NO], [MODEL]
                    [REQUEST_QTY], [RETURN_QTY], [STATUS], [TYPE], [STATION], 
                    [EMP_NO], [EMP_CONFIRM], [SLOT_NO]
                )
                VALUES
                (
                    @DATE_TIME, @END_TIME, @WO, @TR_SN, @KP_NO, @MODEL
                    @REQUEST_QTY, @RETURN_QTY, @STATUS, @TYPE, @STATION, 
                    @EMP_NO, @EMP_CONFIRM, @SLOT_NO, @COMMENT
                );
            `;
    
            const result = await request.query(query);
            return res.status(200).json({ msg: "Them material return status" });
        }
        catch (err) {
            console.error("Error fetching users: ", err);
            return res.status(500).json({ msg: err.message });
        }
    },

};

module.exports = MaterialReturnController;