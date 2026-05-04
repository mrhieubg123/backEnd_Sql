// import dayjs from 'dayjs';
const axios = require("axios");

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

async function getYeildRateToday() {
  const formatMESDate = (date) => {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const HH = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}${MM}${dd}${HH}${mm}`;
  };

  const toDateObj = new Date();

  const fromDateObj = new Date(toDateObj);
  if (toDateObj.getHours() < 7) {
    fromDateObj.setDate(fromDateObj.getDate() - 1);
  }
  fromDateObj.setHours(7, 0, 0, 0);

  const fromDate = formatMESDate(fromDateObj);
  const toDate = formatMESDate(toDateObj);

  const body1 = {
    IN_DB: "SFCHT",
    IN_SP: "SFIS1.MES_REPORT_QM",
    IN_EVENT: "QUERY_DEFECT_ANALYSIS",
    IN_DATA: {
      EMP_NO: "V3210704",
      FROM_DATE: fromDate,
      TO_DATE: toDate,
      MODEL_NAME_LIST: "",
      MO_NUMBER_LIST: "",
      LINE_LIST: "AP3,AP4,AP5,AP6,AP7,PT1",
      SECTION_LIST: "PTH",
      GROUP_LIST: "PTHVI",
      MO_NUMBER_CHECK: "0",
      LINE_CHECK: "1",
      SECTION_CHECK: "1",
      GROUP_CHECK: "1",
      SN_CHECK: "0",
      WORK_SHIFT: "ALL",
      WORK_HOUR_CHECK: "0",
      REPASS_CHECK: "0",
    },
  };

  const body2 = {
    IN_DB: "SFCHT",
    IN_SP: "SFIS1.MES_REPORT_QM",
    IN_EVENT: "QUERY_YEILD_RATE",
    IN_DATA: {
      EMP_NO: "V3210704",
      FROM_DATE: fromDate,
      TO_DATE: toDate,
      MODEL_NAME_LIST: "",
      MO_NUMBER_LIST: "",
      LINE_LIST: "AP3,AP4,AP5,AP6,AP7,PT1",
      SECTION_LIST: "PTH",
      GROUP_LIST: "AOI_PTH",
      MO_NUMBER_CHECK: "0",
      LINE_CHECK: "1",
      SECTION_CHECK: "1",
      GROUP_CHECK: "1",
      SN_CHECK: "0",
      WORK_SHIFT: "ALL",
      WORK_HOUR_CHECK: "0",
      REPASS_CHECK: "0",
    },
  };

  try {
    const [response1, response2] = await Promise.all([
      axios.post(
        "https://mesht-cns.myfiinet.com/MESAPI/api/MES/CallAPI",
        body1,
      ),
      axios.post(
        "https://mesht-cns.myfiinet.com/MESAPI/api/MES/CallAPI",
        body2,
      ),
    ]);

    const data1 = response1.data;
    const data2 = response2.data;

    const defectList = Array.isArray(data1?.Data) ? data1.Data : [];
    const yieldList = Array.isArray(data2?.Data) ? data2.Data : [];

    const defectByModel = {};
    const defectsDetailMap = {};

    defectList.forEach((item) => {
      const model = item.MODEL_NAME;
      if (model) {
        const qty = Number(item.QTY) || 0;
        if (!defectByModel[model]) defectByModel[model] = 0;
        defectByModel[model] += qty;

        if (!defectsDetailMap[model]) defectsDetailMap[model] = {};
        const code = item.ERROR_ITEM_CODE || item.ERROR_CODE || "N/A";
        const desc = item.ERROR_DESC || "N/A";
        const key = `${code}|${desc}`;

        if (!defectsDetailMap[model][key]) {
          defectsDetailMap[model][key] = { code, desc, qty: 0 };
        }
        defectsDetailMap[model][key].qty += qty;
      }
    });

    const yieldByModel = {};
    yieldList.forEach((item) => {
      const model = item.MODEL_NAME;
      if (model) {
        if (!yieldByModel[model]) yieldByModel[model] = 0;
        yieldByModel[model] += Number(item.TOTAL_QTY) || 0;
      }
    });

    const badModels = [];
    for (const model in yieldByModel) {
      const totalQty = yieldByModel[model];
      const defectQty = defectByModel[model] || 0;
      if (totalQty > 0) {
        const rate = (defectQty / totalQty) * 100;
        if (rate > 1.5 && totalQty > 300) {
          const errorDetails = defectsDetailMap[model] ? Object.values(defectsDetailMap[model]) : [];
          const topErrors = errorDetails.sort((a, b) => b.qty - a.qty).slice(0, 5);

          badModels.push({
            model,
            failRate: rate.toFixed(2),
            defectQty,
            totalQty,
            topErrors
          });
        }
      }
    }

    return badModels;
  } catch (err) {
    console.error("Error getYeildRateToday:", err);
    return [];
  }
}

const YeildRateController = {
  getYeildRateToday,
  getDefectAnalysis: async (req, res) => {
    const body = {
      IN_DB: "SFCHT",
      IN_SP: "SFIS1.MES_REPORT_QM",
      IN_EVENT: "QUERY_DEFECT_ANALYSIS",
      IN_DATA: {
        EMP_NO: "V3210704",
        FROM_DATE: req.body.dateFrom,
        TO_DATE: req.body.dateTo,
        // FROM_DATE: "202601190730",
        // TO_DATE: "202601211930",
        MODEL_NAME_LIST: "",
        MO_NUMBER_LIST: "",
        LINE_LIST: "AP3,AP4,AP5,AP6,AP7,PT1",
        SECTION_LIST: "PTH",
        GROUP_LIST: "PTHVI",
        MO_NUMBER_CHECK: "0",
        LINE_CHECK: "1",
        SECTION_CHECK: "1",
        GROUP_CHECK: "1",
        SN_CHECK: "0",
        WORK_SHIFT: "ALL",
        WORK_HOUR_CHECK: "0",
        REPASS_CHECK: "0",
      },
    };

    try {
      const response = await axios.post(
        `https://mesht-cns.myfiinet.com/MESAPI/api/MES/CallAPI`,
        body,
      );
      res.json(response.data);
    } catch (err) {
      console.error("Error getDefectAnalysis: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getYeildRate: async (req, res) => {
    const body = {
      IN_DB: "SFCHT",
      IN_SP: "SFIS1.MES_REPORT_QM",
      IN_EVENT: "QUERY_YEILD_RATE",
      IN_DATA: {
        EMP_NO: "V3210704",
        FROM_DATE: req.body.dateFrom,
        TO_DATE: req.body.dateTo,
        // FROM_DATE: "202601190730",
        // TO_DATE: "202601211930",
        MODEL_NAME_LIST: "",
        MO_NUMBER_LIST: "",
        LINE_LIST: "AP3,AP4,AP5,AP6,AP7,PT1",
        SECTION_LIST: "PTH",
        GROUP_LIST: req.body.groupList || "AOI_PTH",
        MO_NUMBER_CHECK: "0",
        LINE_CHECK: "1",
        SECTION_CHECK: "1",
        GROUP_CHECK: "1",
        SN_CHECK: "0",
        WORK_SHIFT: "ALL",
        WORK_HOUR_CHECK: "0",
        REPASS_CHECK: "0",
      },
    };
    const body2 = {
      IN_DB: "SFCHT",
      IN_SP: "SFIS1.MES_REPORT_QM",
      IN_EVENT: "QUERY_YEILD_RATE",
      IN_DATA: {
        EMP_NO: "V3210704",
        FROM_DATE: req.body.dateFrom,
        TO_DATE: req.body.dateTo,
        // FROM_DATE: "202601190730",
        // TO_DATE: "202601211930",
        MODEL_NAME_LIST: "U46L440T11,U46L477T00",
        MO_NUMBER_LIST: "",
        LINE_LIST: "AP3,AP4,AP5,AP6,AP7,PT1",
        SECTION_LIST: "PTH",
        GROUP_LIST: "PTHVI",
        MO_NUMBER_CHECK: "0",
        LINE_CHECK: "1",
        SECTION_CHECK: "1",
        GROUP_CHECK: "1",
        SN_CHECK: "0",
        WORK_SHIFT: "ALL",
        WORK_HOUR_CHECK: "0",
        REPASS_CHECK: "0",
      },
    };
    try {
      const response = await axios.post(
        `https://mesht-cns.myfiinet.com/MESAPI/api/MES/CallAPI`,
        body,
      );
      const response2 = await axios.post(
        `https://mesht-cns.myfiinet.com/MESAPI/api/MES/CallAPI`,
        body2,
      );
      res.json({
        "Data": [...response.data.Data, ...response2.data.Data],
      });
    } catch (err) {
      console.error("Error getYeildRate: ", err);
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = YeildRateController;
