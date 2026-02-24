// Load biến môi trường
const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const axios = require("axios");
const fatpRouter = require("./routes/FATP");
const fileRouter = require("./routes/fileRoutes");
const screwRoutes = require("./routes/ScrewRoutes");
const vcutRoutes = require("./routes/VcutRoutes");
const MaintananceRoutes = require("./routes/MaintananceRoutes.js");
const SparePartRoutes = require("./routes/SparePartRoutes.js");
const VoltageRoutes = require("./routes/VoltageRoutes.js");
const ProVersionRoutes = require("./routes/ProVersionRoutes.js");
const ProjectManagementRoutes = require("./routes/ProjectManagementRoutes.js");
const YeildRateRoutes = require("./routes/YeildRateRoutes.js");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3030;

const sqlConfig = {
  user: process.env.DB_USER, // Tên người dùng SQL Server
  password: process.env.DB_PASSWORD, // Mật khẩu
  database: process.env.DB_NAME, // Tên database
  server: process.env.DB_HOST, // Địa chỉ server
  port: parseInt(process.env.DB_PORT, 10), // Port SQL Server
  options: {
    encrypt: true, // Mã hóa, cần thiết nếu dùng Azure
    trustServerCertificate: true, // Chỉ dùng trong môi trường dev
  },
};

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://10.228.18.153:3000",
      "http://172.20.10.14:3000",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Debug cookies
app.use((req, res, next) => {
  // console.log('Cookies:', req.cookies);
  next();
});

// Proxy API
app.post("/api/proxy-api", async (req, res) => {
  const { url, method = "GET", data = null, headers = {} } = req.body;
  try {
    if (!url) {
      return res.status(400).json({ error: "Thiếu tham số url" });
    }
    const parseUrl = new URL(url);
    const hostname = parseUrl.hostname;
    //API không được phép truy cập
    // if( !['ai.com'].includes(hostname)){
    //   return res.status(403).json({error: 'Host không được phép truy cập'})
    // }
    const response = await axios({
      method,
      url,
      data, // Dữ liệu truyền kèm nếu là POST, PUT
      headers, // Nếu cần truyền thêm header như token
    });
    res.json(response.data);
  } catch (error) {
    console.error("Proxy error", error.message);
    res.status(500).json("Proxy error");
  }
});

//Call Chat bot
app.post("/api/v1/chatbot", async (req, res) => {
  try {
    // const response = await axios.post(`https://10.225.41.111:5555/add`, req.body, { httpsAgent } );
    const response = await axios.post(
      `http://localhost:5001/api/chatbot/chat`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Proxy error");
  }
});

//Get question chatbot
app.post("/api/v1/user/QuestionAPI", async (req, res) => {
  try {
    const response = await axios.get(
      `http://localhost:5001/api/chatbot/getListQuestion`
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Proxy error");
  }
});

// Routes
app.use("/api/Fatp", fatpRouter);
app.use("/api/files", fileRouter);
app.use("/api/screw", screwRoutes);
app.use("/api/vcut", vcutRoutes);
app.use("/api/maintenance", MaintananceRoutes);
app.use("/api/MPE", SparePartRoutes);
app.use("/api/Voltage", VoltageRoutes);
app.use("/api/version", ProVersionRoutes);
app.use("/api/projectManagement", ProjectManagementRoutes);
app.use("/api/YeildRate", YeildRateRoutes);

// Serve static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//phuc vu khi build react
app.use(express.static(path.join(__dirname, "../my-app/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../my-app/build", "index.html"));
});

var httpsOptions = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("certificate.pem"),
};

const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

//Kết nối OracleDB
async function init() {
  try {
    const pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.CONNECT_STRING,
      poolMin: 2,
      poolMax: 50,
      poolTimeout: 6000,
      queueTimeout: 60000,
      poolIncrement: 1,
    });
    app.locals.oraclePool = pool;
    global.oraclePool = pool;
    require("./jobs/schedule.js");
    http.createServer(app).listen(PORT, () => {
      console.log(`Server HTTP chạy trên cổng ${PORT}`);
    });
    console.log("✅ Oracle pool created and stored in app.locals");
  } catch (err) {
    console.error("❌ Pool error:", err);
  }
}

async function runServer() {
  let connection;

  try {
    // Tạo kết nối
    connection = await oracledb.getConnection();

    console.log("✅ Kết nối thành công!");

    // Thực hiện truy vấn
    const result = await connection.execute(
      `SELECT 'Hello Oracle from Node.js!' AS message FROM dual`
    );

    console.log(result.rows);
  } catch (err) {
    console.error("❌ Lỗi kết nối:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("🔌 Đã đóng kết nối");
      } catch (err) {
        console.error(err);
      }
    }
  }
}
(async () => {
  await init();
  await runServer();
})();

// startServer();
