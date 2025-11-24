const MPEController = require("../controllers/MPE/MPEController");
const router = require("express").Router();

router.post("/MachineSparePartsStatus", MPEController.getMachineSparePartsStatus);
router.post("/MachineSparePartsDetail", MPEController.getMachineSparePartsDetail);
router.post("/EquipmentInStock", MPEController.getEquipmentInStock);
router.post("/EquipmentUseInMonth", MPEController.getEquipmentUseInMonth);
router.post("/createNewMachine", MPEController.createNewMachine);

module.exports = router;