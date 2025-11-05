const express = require('express');
const multer = require('multer');
const controller = require('../controllers/File/fileController');

const router = express.Router();
const upload = multer({ dest: 'temp/' });

router.post('/folder', controller.createFolder);
router.get('/folders', controller.listFolders);
router.get('/files', controller.listFiles);
router.post('/upload', upload.single('file'), controller.uploadFile);
router.get('/download/:folder/:filename', controller.downloadFile);
router.delete('/file/:folder/:filename', controller.deleteFile);
router.delete('/folder/:folder', controller.deleteFolder);
router.post('/folder/password', controller.setFolderPassword);
router.put('/folder/password', controller.updateFolderPassword);
router.delete('/folder/password/:folder', controller.removeFolderPassword);





module.exports = router;