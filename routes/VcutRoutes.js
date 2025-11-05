const VcutController = require("../controllers/FATP/VcutController");
const router = require("express").Router();

router.get("/getVcutMachineStatus", VcutController.getVcutMachineStatus);
router.post("/getDataVcutMachineTotalTrend", VcutController.getDataVcutMachineTotalTrend);
router.post("/changeKnifeVcutmachine", VcutController.changeKnifeVcutmachine);
router.post("/getKnifeVcutMachineHistory", VcutController.getKnifeVcutMachineHistory);
router.post("/editChangeKnifeVcutmachine", VcutController.editChangeKnifeVcutmachine);
router.post("/deleteChangeKnifeVcutmachine", VcutController.deleteChangeKnifeVcutmachine);

module.exports = router;