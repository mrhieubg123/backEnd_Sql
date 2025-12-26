const VoltageMonitorController = require("../controllers/TE/VoltageMonitorController");
const router = require("express").Router();

router.get("/getVoltageMonitorMachineStatus", VoltageMonitorController.getVoltageMonitorMachineStatus);
router.post("/getVoltageMonitorDetail", VoltageMonitorController.getVoltageMonitorDetail);
router.post("/getVoltageMonitorErrorDetail", VoltageMonitorController.getVoltageMonitorErrorDetail);

module.exports = router;