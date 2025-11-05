// import { upload } from '../middleware/upload.middleware.js';
const { upload } = require('../middleware/upload.middleware.js');
const ScrewController = require("../controllers/FATP/ScrewController");
const router = require("express").Router();

router.post("/getScrewMachineStatus", ScrewController.getScrewMachineStatus);
router.post("/getDataErrorHistory", ScrewController.getDataErrorHistory);
router.post("/getScrewMachineAnalysis", ScrewController.getScrewMachineAnalysis);
router.post("/getDataScrewMachineDetail", ScrewController.getDataScrewMachineDetail);
router.get("/getDataForceDefault", ScrewController.getDataForceDefault);
router.post("/addDataForceDefault", ScrewController.addDataForceDefault);
router.post("/editDataForceDefault", ScrewController.editDataForceDefault);
router.post("/deleteDataForceDefault", ScrewController.deleteDataForceDefault);
router.post('/uploadScrewDocumment', upload.single('file'), ScrewController.uploadScrewDocumment);
router.get("/getDataScrewDocummentUpload", ScrewController.getDataScrewDocummentUpload);
router.post("/deleteScrewDocummentUpload", ScrewController.deleteScrewDocummentUpload);
router.get("/downloadScrewDocummentUpload", ScrewController.downloadScrewDocummentUpload);

module.exports = router;