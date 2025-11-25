const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const router = require("express").Router();

router.post("/sendMail", MaintananceController.registerMaintenanceRoutes);
router.post("/getMachineAnalysisDailyApi", MaintananceController.getMachineAnalysisDailyApi);
router.post("/getMaintenancePlanApi", MaintananceController.getMaintenancePlanApi);

module.exports = router;