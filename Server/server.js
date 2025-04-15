const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3000;

// 存储 WebSocket 连接
let clients = [];

// WebSocket 连接处理
wss.on("connection", (ws) => {
    console.log("客户端已连接");
    clients.push(ws);

    ws.on("close", () => {
        console.log("客户端已断开连接");
        clients = clients.filter((client) => client !== ws);
    });
});

// 设置文件存储路径
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// 配置 multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // 文件存储目录
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // 文件名
    },
});
const upload = multer({ storage });

// 上传接口
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("文件已上传:", req.file.filename);

    // 通知所有客户端
    const fileUrl = `/uploads/${req.file.filename}`;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ message: "File uploaded", fileUrl }));
        }
    });

    res.json({ message: "File uploaded successfully", fileUrl });
});

// 提供文件下载
app.use("/uploads", express.static(uploadFolder));

// 启动服务器
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});