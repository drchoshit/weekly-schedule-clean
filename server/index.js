import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.resolve("data");

const readJSON = (name, fallback) => {
  const file = path.join(DATA_DIR, name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

const writeJSON = (name, data) => {
  const file = path.join(DATA_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

/* ===== STUDENTS ===== */
app.get("/api/students", (req, res) => {
  res.json(readJSON("students.json", []));
});

app.post("/api/students", (req, res) => {
  writeJSON("students.json", req.body);
  res.json({ ok: true });
});

/* ===== ATTENDANCE ===== */
app.get("/api/attendance", (req, res) => {
  res.json(readJSON("attendance.json", {}));
});

app.post("/api/attendance", (req, res) => {
  writeJSON("attendance.json", req.body);
  res.json({ ok: true });
});

/* ===== MENTAL CARE ===== */
app.get("/api/mental-care", (req, res) => {
  res.json(readJSON("mental_care_settings.json", {}));
});

app.post("/api/mental-care", (req, res) => {
  writeJSON("mental_care_settings.json", req.body);
  res.json({ ok: true });
});

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server running on ${PORT}`);
});
