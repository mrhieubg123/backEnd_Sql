const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const router = require("express").Router();

router.post("/sendMail", MaintananceController.registerMaintenanceRoutes);

module.exports = router;