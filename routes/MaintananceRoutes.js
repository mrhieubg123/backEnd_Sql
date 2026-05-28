const MaintananceController = require("../controllers/Maintanance/MaintananceController");
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/imageMaintenance");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Config storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, "_");
        cb(null, `${Date.now()}_${base}${ext}`);
    }
});

const upload = multer({ storage });

router.post("/sendMail", MaintananceController.registerMaintenanceRoutes);
router.post("/getMachineAnalysisDailyApi", MaintananceController.getMachineAnalysisDailyApi);
router.post("/getMaintenancePlanApi", MaintananceController.getMaintenancePlanApi);
router.post("/getFATPMaintenanceMultiMonth", MaintananceController.getFATPMaintenanceMultiMonth);
router.post("/updateFATPMaintenancePlan", MaintananceController.updateFATPMaintenancePlan);
router.post("/addFATPMaintenancePlan", upload.array("files"), MaintananceController.addFATPMaintenancePlan);

module.exports = router;