const cron = require("node-cron");
const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const YeildRateController = require("../controllers/FATP/YeildRateController");

// Job chạy lúc 7h sáng mỗi ngày
cron.schedule(
  "0 7 * * *",
  async () => {
    try {
      const prevDay = new Date();
      prevDay.setDate(prevDay.getDate() - 1);
      const year = prevDay.getFullYear();
      const month = String(prevDay.getMonth() + 1).padStart(2, "0");
      const date1 = String(prevDay.getDate()).padStart(2, "0");
      const timeR = `${year}-${month}-${date1}`;
      console.log(
        `[${prevDay.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}] ✅ Job chạy thành công!`,
      );
      const result = await YeildRateController.getYeildRateToday();
      if (result < 3) return;
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
        subject: `[Report] Cảnh báo Yield Rate có tỉ lệ lỗi cao ngày ${timeR}`,
        html: `
          <b>Mail tự động</b><br/>
          Cảnh báo Yield Rate có tỉ lệ lỗi cao (${result} %) ngày ${timeR}.<br/>
          Truy cập vào trang web để xem thông tin chi tiết:<br/>
          <a href="http://10.228.18.153:8080/FATP/YieldRatePTH">Click vào đây</a>
        `,
        icsContent: null,
      });
    } catch (err) {
      console.error("Error schedule YEILD RATE: ", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  },
);
