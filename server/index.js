import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 기본 미들웨어 =====
app.use(cors());
app.use(express.json());

// ===== API =====
const dataDir = path.resolve("public");
const studentsPath = path.join(dataDir, "students.json");
const attendancePath = path.join(dataDir, "attendance.json");
const mentalCarePath = path.join(dataDir, "mental_care_settings.json");

const readJSON = (p, def) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return def;
  }
};

const writeJSON = (p, data) => {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/students", (req, res) => {
  res.json(readJSON(studentsPath, []));
});

app.post("/api/students", (req, res) => {
  writeJSON(studentsPath, req.body || []);
  res.json({ ok: true });
});

app.get("/api/attendance", (req, res) => {
  res.json(readJSON(attendancePath, {}));
});

app.post("/api/attendance", (req, res) => {
  writeJSON(attendancePath, req.body || {});
  res.json({ ok: true });
});

app.get("/api/mental-care", (req, res) => {
  res.json(readJSON(mentalCarePath, {}));
});

app.post("/api/mental-care", (req, res) => {
  writeJSON(mentalCarePath, req.body || {});
  res.json({ ok: true });
});

// ===== 프론트 정적 파일 서빙 =====
const distPath = path.resolve("dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API + Frontend server running on ${PORT}`);
});
