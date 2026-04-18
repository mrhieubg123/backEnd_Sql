// import { upload } from '../middleware/upload.middleware.js';
const { upload } = require('../middleware/upload.middleware.js');
const ProjectManagementController = require("../controllers/FATP/ProjectManagementController.js");
const router = require("express").Router();

router.get("/getListProjectManagement", ProjectManagementController.getListProjectManagement);
router.post("/getListProjectManagementByStatus", ProjectManagementController.getListProjectManagementByStatus);
router.get("/getEmailConfig", ProjectManagementController.getEmailConfig);
router.post("/addNewProject", ProjectManagementController.addNewProject);
router.post("/editProject", ProjectManagementController.editProject);
router.post("/deleteProject", ProjectManagementController.deleteProject);
router.post("/moveProject", ProjectManagementController.moveProject);
router.post("/addNewEmailConfig", ProjectManagementController.addNewEmailConfig);
router.post("/editEmailConfig", ProjectManagementController.editEmailConfig);
router.post("/deleteEmailConfig", ProjectManagementController.deleteEmailConfig);
// router.post("/editDataForceDefault", ProjectManagementController.editDataForceDefault);
// router.post("/deleteDataForceDefault", ProjectManagementController.deleteDataForceDefault);
router.post('/uploadScrewDocumment', upload.single('file'), ProjectManagementController.uploadScrewDocumment);
router.get("/getDataScrewDocummentUpload", ProjectManagementController.getDataScrewDocummentUpload);
router.post("/deleteScrewDocummentUpload", ProjectManagementController.deleteScrewDocummentUpload);
router.get("/downloadScrewDocummentUpload", ProjectManagementController.downloadScrewDocummentUpload);

module.exports = router;