const YeildRateController = require("../controllers/FATP/YeildRateController");
const router = require("express").Router();

router.post("/getDefectAnalysis", YeildRateController.getDefectAnalysis);
router.post("/getYeildRate", YeildRateController.getYeildRate);

module.exports = router;