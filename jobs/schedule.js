const cron = require("node-cron");
const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const FATPController = require("../controllers/FATP/FATPController");

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
      await MaintananceController.sendEmailWithOptionalIcs({
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
      await MaintananceController.sendEmailWithOptionalIcs({
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

let alertedLinesToday = new Set();
let currentCycleDate = null;

// Job cảnh báo mất kết nối máy FATP chạy mỗi 30 phút
cron.schedule(
  "*/30 * * * *",
  async () => {
    try {
      const now = new Date();

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
        alertedLinesToday.clear();
      }

      console.log(
        `[${now.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}] ⏳ Chạy schedule kiểm tra FATP connect... cycle: ${cycleId}`,
      );

      const disconnectedLines = await FATPController.getHeartBeatLine();
      const currentDisconnectedNames = (disconnectedLines || []).map(r => String(r.LINE));

      // Xoá những line đã kết nối lại khỏi bộ nhớ đệm (để khi nào mất lại thì báo tiếp)
      for (const line of alertedLinesToday) {
        if (!currentDisconnectedNames.includes(line)) {
          alertedLinesToday.delete(line);
        }
      }

      if (!disconnectedLines || disconnectedLines.length === 0) return;

      // Lọc ra các line mất kết nối CHƯA được gửi cảnh báo
      const linesToAlert = disconnectedLines.filter(row => !alertedLinesToday.has(String(row.LINE)));

      if (linesToAlert.length === 0) {
        return; // Không có line nào bị ngắt kết nối mới
      }

      // Đánh dấu các line chuẩn bị gửi cảnh báo
      linesToAlert.forEach(row => alertedLinesToday.add(String(row.LINE)));

      let linesHtml = "";
      linesToAlert.forEach(row => {
        linesHtml += `<li>Line <b>${row.LINE}</b> - Tín hiệu cuối cùng lúc: <b>${row.LAST_DT}</b></li>`;
      });

      await MaintananceController.sendEmailWithOptionalIcs({
        toList: [
          "cpe-vn-me-automation@mail.foxconn.com",
          "felix.wh.li@mail.foxconn.com",
        ],
        subject: `[Report] Cảnh báo FATP connect (Cycle ${cycleId})`,
        html: `
          <b>Mail tự động</b><br/>
          Phát hiện thiết bị Line mất kết nối mới trong ca làm việc ${cycleId}:<br/>
          <ul>${linesHtml}</ul><br/>
          Truy cập vào trang web để xem thông tin chi tiết:<br/>
          <a href="http://10.228.18.153:8080/FATP/FATPMachineControl">Click vào đây</a>
        `,
        icsContent: null,
      });

      console.log(`✅ Đã gửi email cảnh báo FATP Connect cho ${linesToAlert.length} line(s) thành công!`);

    } catch (err) {
      console.error("Error schedule FATP Connect: ", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // 👈 ép múi giờ VN
  }
);