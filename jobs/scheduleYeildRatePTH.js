const cron = require("node-cron");
const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const YeildRateController = require("../controllers/FATP/YeildRateController");

let alertedModelsToday = new Set();
let currentCycleDate = null;

// Job chạy mỗi 30 phút, chu trình mới bắt đầu từ 7h sáng
cron.schedule(
  "*/30 * * * *",
  async () => {
    try {
      const now = new Date();

      // Tính toán cycle hiện tại: Nếu giờ < 7, cycle thuộc về ngày hôm trước
      const calcTime = new Date(now);
      if (now.getHours() < 7) {
        calcTime.setDate(calcTime.getDate() - 1);
      }

      const year = calcTime.getFullYear();
      const month = String(calcTime.getMonth() + 1).padStart(2, "0");
      const date1 = String(calcTime.getDate()).padStart(2, "0");
      const cycleId = `${year}-${month}-${date1}`;

      // Nếu chuyển sang chu trình mới (sau 7h sáng), clear lịch sử cảnh báo
      if (currentCycleDate !== cycleId) {
        currentCycleDate = cycleId;
        alertedModelsToday.clear();
      }

      console.log(
        `[${now.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}] ⏳ Chạy schedule kiểm tra Yield Rate... cycle: ${cycleId}`,
      );

      const badModels = await YeildRateController.getYeildRateToday();
      if (!badModels || badModels.length === 0) return;

      // Lọc ra các model có failRate > 1.5% chưa được gửi cảnh báo
      const modelsToAlert = badModels.filter(m => !alertedModelsToday.has(m.model));

      if (modelsToAlert.length === 0) {
        return; // Đã gửi hết các cảnh báo cho các model lỗi trong ngày
      }

      // Đánh dấu các model chuẩn bị gửi
      modelsToAlert.forEach(m => alertedModelsToday.add(m.model));

      let modelsHtml = "";
      modelsToAlert.forEach(m => {
        modelsHtml += `<li>Model <b>${m.model}</b> có tỉ lệ lỗi: <b>${m.failRate}%</b> (${m.defectQty}/${m.totalQty} pcs)
          <br/>Top Issues: <br/>
          <ul>`;

        m.topErrors.forEach((err, idx) => {
          modelsHtml += `<li>Top${idx + 1}: ${err.code} - ${err.desc} - SL: ${err.qty} pcs</li>`;
        });

        modelsHtml += `</ul></li><br/>`;
      });

      await MaintananceController.sendEmailWithOptionalIcs({
        toList: [
          "cpe-vn-me-automation@mail.foxconn.com",
          "felix.wh.li@mail.foxconn.com",
          "shan-you.liang@fii-foxconn.com",
          "jerry.m.shen@fii-foxconn.com",
          "cpe-vn-ape@fii-foxconn.com",
          "omen.ds.su@fii-foxconn.com",
          "ming-xin.chen@fii-foxconn.com",
          "snail.wx.chen@fii-foxconn.com",
          "magnus.df.wu@fii-foxconn.com",
          "jonhnny.hd.du@fii-foxconn.com",
          "tian.wh.huang@fii-foxconn.com",
          "shi-huan.feng@fii-foxconn.com",
          "cpe-vn-pd-pth@fii-foxconn.com",
          "wen-ti.ruan@fii-foxconn.com",
          "cpe-vn-me-pth@fii-foxconn.com",
        ],
        subject: `[Report] Cảnh báo Yield Rate PTH có tỉ lệ lỗi cao (Cycle ${cycleId})`,
        html: `
          <b>Mail tự động</b><br/>
          Phát hiện các Model Yield Rate PTH có tỉ lệ lỗi > 1.5% mới trong ca làm việc ${cycleId}:<br/>
          <ul>${modelsHtml}</ul><br/>
          Truy cập vào trang web để xem thông tin chi tiết:<br/>
          <a href="http://10.228.18.153:8080/FATP/YieldRatePTH">Click vào đây</a>
        `,
        icsContent: null,
      });

      console.log(`✅ Đã gửi email cảnh báo cho ${modelsToAlert.length} model(s) thành công!`);

    } catch (err) {
      console.error("Error schedule YEILD RATE: ", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  }
);
