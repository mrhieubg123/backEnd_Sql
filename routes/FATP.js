const FATPController = require("../controllers/FATP/FATPController");
const router = require("express").Router();

router.get("/FATPMachineStatus", FATPController.getFATPMachineStatus);
router.post("/FATPMachineStatus", FATPController.getFATPMachineFPY);
router.post("/getMinCycleTimeAndLatestRow", FATPController.getMinCycleTimeAndLatestRow);
router.post("/getMachineWeeklyDrilldownData", FATPController.getMachineWeeklyDrilldownData);
router.post("/FATPMachineTotalTrend", FATPController.getFATPMachineTotalTrend);
router.post("/FATPMachineFailureAnalysis", FATPController.getFATPMachineFailureAnalysis);
router.post("/FATPMachineAnalysis", FATPController.getFATPMachineAnalysis);
router.post("/FATPMachineError5m", FATPController.getFATPMachineError5m);
router.post("/FATPMachineErrorDetail", FATPController.getFATPMachineErrorDetail);
router.post("/FATPErrorDetail", FATPController.getFATPErrorDetail);
router.get("/DataOverTime", FATPController.getDataOverTimeFATP);
router.post("/addOverTimeLine", FATPController.addDataOverTimeFATP);
router.post("/editDataOverTimeFATP", FATPController.editDataOverTimeFATP);
router.post("/deleteDataOverTimeFATP", FATPController.deleteDataOverTimeFATP);
router.get("/getMachineError5Minutes", FATPController.getMachineError5Minutes);


module.exports = router;