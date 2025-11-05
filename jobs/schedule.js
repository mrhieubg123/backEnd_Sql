const cron = require("node-cron");
const MaintananceController = require("../controllers/Maintanance/MaintananceController");

// Job chạy lúc 6h30 sáng và 18h30 tối mỗi ngày
cron.schedule(
  "25 9,18 * * *",
  async () => {
    const now = new Date();
    const timeR = MaintananceController.getCurrentShiftTimeRange(now);
    console.log(
      `[${now.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })}] ✅ Job chạy thành công!`
    );
    const result = await MaintananceController.getMachineAnalysisDaily({dateFrom:"2025-10-23 00:00:00",dateTo:"2025-10-23 23:00:00"});
    const buffer = await MaintananceController.buildExcelBuffer(result);
    const filename = `ReportAnalysisMachine.xlsx`;
    MaintananceController.sendEmailWithOptionalIcs({
        toList:["test"],
        subject:`[Report] Báo cáo tình trạng máy ${timeR.name}`,
        html: `<b>Mail tự động</b><br/>Báo cáo tình trạng máy ${timeR.name}.<br/>danh sách top 3 máy nhiều lỗi nhất mỗi line ${timeR.name}.`,
        icsContent: true,
        attachments: [
        {
          filename,
          content: buffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
      });
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  }
);
