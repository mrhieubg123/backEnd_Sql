const cron = require("node-cron");
const MaintananceController = require("../controllers/Maintanance/MaintananceController");

// Job chạy lúc 6h30 sáng và 18h30 tối mỗi ngày
cron.schedule(
  "30 6,18 * * *",
  async () => {
    try {
      const now = new Date();
      const timeR = MaintananceController.getCurrentShiftTimeRange(now);
      console.log(
        `[${now.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}] ✅ Job chạy thành công!`
      );
      const result = await MaintananceController.getMachineAnalysisDaily({
        dateFrom: "",
        dateTo: "",
      });
      const buffer = await MaintananceController.buildExcelBuffer2(result);
      const filename = `ReportAnalysisMachine.xlsx`;
      MaintananceController.sendEmailWithOptionalIcs({
        toList: [
          "cpe-vn-me-automation@mail.foxconn.com",
          "felix.wh.li@mail.foxconn.com",
        ],
        subject: `[Report] Báo cáo tình trạng máy ${timeR.name}`,
        html: `<b>Mail tự động</b><br/>Báo cáo tình trạng máy ${timeR.name}.<br/>danh sách top 3 máy nhiều lỗi nhất mỗi line ${timeR.name}.`,
        icsContent: true,
        attachments: [
          {
            filename,
            content: buffer,
            contentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
    } catch (err) {
      console.error("Error schedule: ", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  }
);

//Job chạy lúc 6h sáng hằng ngày
cron.schedule(
  "10 11 * * *",
  async () => {
    try {
      // Hàm format yyyy-MM-dd theo giờ local
      const formatDate = (d) => {
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}`;
      };

      const today = new Date(); // ngày hiện tại
      const dateTo = formatDate(today); // yyyy-MM-dd

      const dateFromDate = new Date();
      dateFromDate.setDate(dateFromDate.getDate() - 30); // 30 ngày trước
      const dateFrom = formatDate(dateFromDate);
      console.log(
        `[${today.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}] ✅ Job cảnh báo bảo dưỡng chạy thành công!`
      );
      const lineMaintenance = await MaintananceController.fetchMaintenancesD3();
        console.log(lineMaintenance);
      if (lineMaintenance.length == 0) {
        console.log("[MAINT] Không có lịch D+3 hôm nay.");
        return;
      }
      const result = await MaintananceController.getMachineAnalysisDaily({
        dateFrom,
        dateTo,
        line: lineMaintenance,
      });
      const buffer = await MaintananceController.buildExcelBuffer2(result);
      const filename = `ReportAnalysisMachine.xlsx`;
      MaintananceController.sendEmailWithOptionalIcs({
        toList: [
          "cpe-vn-me-automation@mail.foxconn.com",
          "felix.wh.li@mail.foxconn.com",
        ],
        subject: `[Report] Cảnh báo lịch bảo dưỡng máy line ${lineMaintenance[0].LINE}`,
        html: `<b>Mail tự động</b><br/>Anh/chị có lịch bảo dưỡng máy line ${lineMaintenance[0].LINE} vào ngày ${lineMaintenance[0].DATE_CHECK}.<br/>danh sách top 3 máy nhiều lỗi nhất line ${lineMaintenance[0].LINE} trong 30 ngày qua.`,
        icsContent: true,
        attachments: [
          {
            filename,
            content: buffer,
            contentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
    } catch (err) {
      console.error("Error schedule: ", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  }
);
