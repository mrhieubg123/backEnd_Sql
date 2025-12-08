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

const VoltageMonitorController = {
  getVoltageMonitorMachineStatus: async (req, res) => {
    let connection;
    try {
      connection = await req.app.locals.oraclePool.getConnection();
      const resultOracle =
        await connection.execute(`select machine_name,location,line, 
          ct_robot|| '-' ||KCN1|| '-' ||KCN2|| '-' ||KCN3|| '-' ||KCN4|| '-' ||KCN5|| '-' ||KCN6 as KCN 
          from test_mold_machine_data where id in (SELECT max(id)from test_mold_machine_data 
          group by machine_name,location,line)`);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getVoltageMonitorMachineStatus: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },

  getVoltageMonitorDetail: async (req, res) => {
    let connection;
    // Hàm format yyyy-MM-dd theo giờ local
    const formatDate = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const today = new Date(); // ngày hiện tại
    const dateTo = formatDate(today); // yyyy-MM-dd

    const dateFromDate = new Date();
    dateFromDate.setDate(dateFromDate.getDate() - 3); // 3 ngày trước
    const dateFrom = formatDate(dateFromDate);
    try {
      const now = new Date();
      connection = await req.app.locals.oraclePool.getConnection();
      const sql = `select *
          from test_mold_machine_data where location = :location and line = :line 
            and CREATED_AT BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD HH24:MI:SS')
                              AND TO_DATE(:dateTo  , 'YYYY-MM-DD HH24:MI:SS')`;
      const blind = {
        location: req.body.location,
        line: req.body.line,
        dateFrom: req.body.dateFrom || dateFrom,
        dateTo: req.body.dateTo || dateTo,
      };
      const resultOracle = await connection.execute(sql, blind);
      return res.json(resultOracle.rows);
    } catch (err) {
      console.error("Error getVoltageMonitorDetail: ", err);
      return res.status(500).json({ msg: err.message });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  },
};

module.exports = VoltageMonitorController;
