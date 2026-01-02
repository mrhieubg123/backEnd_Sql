const fs = require("fs");
// const multer = require('multer');
const https = require("https");
const path = require("path");
const crypto = require("crypto");
// const axios = require('axios');
// const XLSX = require('xlsx');
// const PDFDocument = require('pdfkit');
// const ExcelJS = require('exceljs');

// const { count } = require('console');
// const { response } = require('express');

const basePath = path.join(__dirname, "../..", "fileUploads");
const passwordFile = path.join(basePath, "folderPasswords.json");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const listFolderDocumentPrivate = ["ProjectManagement", "MetDocument"];

const loadPasswords = () => {
  if (!fs.existsSync(passwordFile)) {
    fs.writeFileSync(passwordFile, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(passwordFile));
};

const savePasswords = (passwords) => {
  fs.writeFileSync(passwordFile, JSON.stringify(passwords, null, 2));
};

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

exports.createFolder = (req, res) => {
  const { folder, password } = req.body;
  const fullPath = path.join(basePath, folder);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    if (password) {
      const passwords = loadPasswords();
      passwords[folder] = hashPassword(password);
      savePasswords(passwords);
    }
    return res.send({ message: "Folder created" });
  }
  return res.status(400).send({ message: "Folder already exists" });
};

exports.uploadFile = (req, res) => {
  const { folder, password } = req.body;
  const file = req.file;
  const passwords = loadPasswords();

  if (passwords[folder] && passwords[folder] !== hashPassword(password)) {
    fs.unlinkSync(file.path);
    return res.status(403).send({ message: "Mật khẩu folder không đúng" });
  }

  const targetDir = path.join(basePath, folder);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const originalName = Buffer.from(file.originalname, "latin1")
    .toString("utf8")
    .normalize("NFC");

  const destPath = path.join(targetDir, originalName);
  fs.renameSync(file.path, destPath);

  res.send({ message: "File uploaded", path: destPath });
};

exports.listFolders = (req, res) => {
  const items = fs.readdirSync(basePath, { withFileTypes: true });
  const passwords = loadPasswords();
  const folders = items
    .filter(
      (i) => i.isDirectory() && !listFolderDocumentPrivate.includes(i.name)
    )
    .map((i) => ({
      name: i.name,
      hasPassword: !!passwords[i.name],
    }));
  res.send(folders);
};

exports.listFiles = (req, res) => {
  const { folder, password } = req.query;
  const passwords = loadPasswords();

  if (passwords[folder] && passwords[folder] !== hashPassword(password)) {
    return res.status(403).send({ message: "Mật khẩu folder không đúng" });
  }

  const target = path.join(basePath, folder);
  if (!fs.existsSync(target))
    return res.status(404).send({ message: "Folder not found" });

  const toLocalIsoNoMs = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  };

  const files = fs
    .readdirSync(target)
    .map((file) => {
      const stat = fs.statSync(path.join(target, file));
      return {
        name: file,
        size: stat.size,
        createAt: toLocalIsoNoMs(stat.birthtime),
        isFolder: stat.isDirectory(),
        birthtimeMs: stat.birthtimeMs,
      };
    })
    .sort((a, b) => b.birthtimeMs - a.birthtimeMs);

  res.send(files);
};

exports.downloadFile = (req, res) => {
  const { folder, filename } = req.params;
  const { password } = req.query;
  const passwords = loadPasswords();
  console.log("downloadFile", req);

  if (passwords[folder] && passwords[folder] !== hashPassword(password)) {
    return res.status(403).send({ message: "Mật khẩu folder không đúng" });
  }

  const filePath = path.join(basePath, folder, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).send({ message: "File not found" });
  res.download(filePath);
};

exports.deleteFile = (req, res) => {
  // const { folder, filename } = req.params;
  const { folder, filename, password } = req.body;
  const passwords = loadPasswords();

  if (
    passwords[folder] &&
    (!password || passwords[folder] !== hashPassword(password))
  ) {
    return res.status(403).send({ message: "Mật khẩu folder không đúng" });
  }

  const filePath = path.join(basePath, folder, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).send({ message: "File not found" });
  const stat = fs.lstatSync(filePath);
  if (stat.isDirectory()) {
    fs.rmSync(filePath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(filePath);
  }
  res.send({ message: "File deleted" });
};

exports.deleteFolder = (req, res) => {
  const { folder } = req.params;
  const { password } = req.body;
  const passwords = loadPasswords();

  if (
    passwords[folder] &&
    (!password || passwords[folder] !== hashPassword(password))
  ) {
    return res.status(403).send({ message: "Mật khẩu folder không đúng" });
  }

  const folderPath = path.join(basePath, folder);
  if (!fs.existsSync(folderPath))
    return res.status(404).send({ message: "Folder not found" });
  fs.rmdirSync(folderPath, { recursive: true });

  const updatedPasswords = { ...passwords };
  delete updatedPasswords[folder];
  savePasswords(updatedPasswords);

  res.send({ message: "Folder deleted" });
};

exports.setFolderPassword = (req, res) => {
  const { folder, password } = req.body;
  const passwords = loadPasswords();

  if (!fs.existsSync(path.join(basePath, folder))) {
    return res.status(404).send({ message: "Folder not found" });
  }

  if (passwords[folder]) {
    return res.status(400).send({ message: "Folder already has a password" });
  }

  passwords[folder] = hashPassword(password);
  savePasswords(passwords);
  res.send({ message: "Password set for folder" });
};

exports.updateFolderPassword = (req, res) => {
  const { folder, oldPassword, newPassword } = req.body;
  const passwords = loadPasswords();

  if (!fs.existsSync(path.join(basePath, folder))) {
    return res.status(404).send({ message: "Folder not found" });
  }

  if (!passwords[folder] || passwords[folder] !== hashPassword(oldPassword)) {
    return res.status(403).send({ message: "Mật khẩu cũ không đúng" });
  }

  passwords[folder] = hashPassword(newPassword);
  savePasswords(passwords);
  res.send({ message: "Password updated" });
};

exports.removeFolderPassword = (req, res) => {
  const { folder } = req.params;
  const { password } = req.body;
  const passwords = loadPasswords();

  if (!fs.existsSync(path.join(basePath, folder))) {
    return res.status(404).send({ message: "Folder not found" });
  }

  if (!passwords[folder] || passwords[folder] !== hashPassword(password)) {
    return res.status(403).send({ message: "Mật khẩu không đúng" });
  }

  delete passwords[folder];
  savePasswords(passwords);
  res.send({ message: "Password removed" });
};
