import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

// ES module용 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 미들웨어 =====
app.use(cors());
app.use(express.json());

// ===== API =====
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===== 프론트 정적 파일 서빙 =====
// dist 경로 (server 기준 상위 폴더의 dist)
const distPath = path.join(__dirname, "..", "dist");

// 정적 파일
app.use(express.static(distPath));

// SPA fallback (★ 이게 핵심 ★)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ===== 서버 시작 =====
app.listen(PORT, () => {
  console.log(`API server running on ${PORT}`);
});
