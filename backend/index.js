// -----------------------------
// 🛡️ Import thư viện bảo mật & hệ thống
// -----------------------------
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const dotenv = require("dotenv");
const https = require("https");
const http = require("http");
const fs = require("fs");
const slowDown = require("express-slow-down");
const morgan = require("morgan");
const waf = require("express-waf");
const path = require("path");

// 🧩 Kết nối DB & route
const connectDB = require("./config/db");
const router = require("./routes");

// -----------------------------
// ⚙️ Cấu hình môi trường
// -----------------------------
dotenv.config();
const app = express();

// -----------------------------
// 1️⃣ Bảo vệ Header HTTP (helmet)
// -----------------------------
app.use(helmet());

// -----------------------------
// 2️⃣ Tường lửa ứng dụng web (WAF)
// -----------------------------
app.use(
  waf({
    strict: true,
    rules: {
      blockSqlInjection: true,
      blockXss: true,
      blockPathTraversal: true,
      blockBadBots: true,
    },
  })
);

// -----------------------------
// 3️⃣ Giới hạn request (rate-limit) để chống brute-force / DDoS nhỏ
// -----------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 request/IP trong 15 phút
  message: "⚠️ Quá nhiều yêu cầu từ IP này. Hãy thử lại sau 15 phút.",
});
app.use(limiter);

// -----------------------------
// 4️⃣ Làm chậm request nếu bị spam (express-slow-down)
// -----------------------------
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100, // Sau 100 request trong 15 phút
  delayMs: 500, // Mỗi request tiếp theo chậm thêm 0.5s
});
app.use(speedLimiter);

// -----------------------------
// 5️⃣ Ngăn chặn NoSQL Injection
// -----------------------------
app.use(mongoSanitize());

// -----------------------------
// 6️⃣ Chống XSS (Cross-site Scripting)
// -----------------------------
app.use(xss());

// -----------------------------
// 7️⃣ Ghi log truy cập (giám sát)
// -----------------------------
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream })); // ghi ra file
app.use(morgan("dev")); // ghi ra console

// -----------------------------
// 8️⃣ CORS an toàn (chỉ cho phép React local)
// -----------------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// -----------------------------
// 9️⃣ Middleware cơ bản
// -----------------------------
app.use(express.json());
app.use(cookieParser());

// -----------------------------
// 🔟 Định tuyến API
// -----------------------------
app.use("/api", router);

// -----------------------------
// 1️⃣1️⃣ Cấu hình HTTPS
// -----------------------------
const options = {
  key: fs.readFileSync("./cert/key.pem"),
  cert: fs.readFileSync("./cert/cert.pem"),
};

// -----------------------------
// 1️⃣2️⃣ Kết nối DB & khởi động server
// -----------------------------
const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  // 🚀 Server HTTPS chính
  https.createServer(options, app).listen(443, () => {
    console.log("✅ Secure server running at: https://localhost");
  });

  // 🚀 Server HTTP fallback → tự động chuyển hướng sang HTTPS
  http
    .createServer((req, res) => {
      res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
      res.end();
    })
    .listen(PORT);

  console.log("✅ Connected to MongoDB");
  console.log(`🔁 HTTP redirect server running on port ${PORT}`);
});

// 🧰 1️⃣ Cài đặt OpenSSL-Win64 trên Windows
// Bước 1: Tải OpenSSL cho Windows

// Truy cập trang chính thức (an toàn & miễn phí):
// 👉 https://slproweb.com/products/Win32OpenSSL.html

// Tải bản phù hợp:

// Nếu máy bạn là 64-bit (hầu hết hiện nay):
// Win64 OpenSSL v3.x Light

// Nếu 32-bit: chọn bản Win32

// Bước 2: Cài đặt

// Khi cài, chọn tùy chọn “Copy OpenSSL DLLs to: The Windows system directory”

// Ghi nhớ đường dẫn cài đặt, ví dụ:

// C:\Program Files\OpenSSL-Win64

// Bước 3: Thêm vào biến môi trường (PATH)

// Mở Start → Gõ "Environment Variables" → Edit the system environment variables

// Trong tab Advanced → Environment Variables

// Ở phần System variables, chọn Path → Edit

// Thêm dòng:

// C:\Program Files\OpenSSL-Win64\bin

// Bấm OK → OK

// Bước 4: Kiểm tra

// Mở lại PowerShell mới và gõ:

// openssl version

// Nếu hiện ra:

// OpenSSL 3.x.x  (or similar)

// → Là cài thành công 🎉

// 🔐 2️⃣ Tạo chứng chỉ HTTPS tự ký

// Sau khi cài xong, chạy trong thư mục backend\cert:

// openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem -config "C:\Program Files\OpenSSL-Win64\bin\openssl.cfg"

// Nếu vẫn không có file openssl.cfg, thì dùng cách 2 (tự tạo file openssl.cnf như mình hướng dẫn ở tin trước).

// ✅ 3️⃣ Sau khi tạo xong

// Bạn sẽ có:

// cert/
//  ├── key.pem
//  ├── cert.pem

// Rồi sửa trong server.js của bạn:

// const options = {
//   key: fs.readFileSync("./cert/key.pem"),
//   cert: fs.readFileSync("./cert/cert.pem"),
// };
// https.createServer(options, app).listen(443, () => {
//   console.log("Server running on https://localhost");
// });
