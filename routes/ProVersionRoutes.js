const ProVersionController = require("../controllers/FATP/ProVersionController");
const router = require("express").Router();

router.post("/checkProcess", ProVersionController.checkProVersion);

module.exports = router;