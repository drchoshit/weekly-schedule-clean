import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 10000;

// ES module용 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 미들웨어 =====
app.use(cors());
app.use(express.json());

// ===== 헬스 체크 =====
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// =================================================
// ================== 학생 ==========================
// =================================================

// 학생 전체 조회
app.get("/api/students", (req, res) => {
  const rows = db.prepare("SELECT * FROM students").all();
  res.json(rows);
});

// 학생 저장/업데이트
app.post("/api/students", (req, res) => {
  const { student_key, name, seat, first_attendance_date } = req.body;

  db.prepare(`
    INSERT INTO students (student_key, name, seat, first_attendance_date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(student_key) DO UPDATE SET
      name = excluded.name,
      seat = excluded.seat,
      first_attendance_date = excluded.first_attendance_date
  `).run(student_key, name, seat, first_attendance_date);

  res.json({ ok: true });
});

// =================================================
// ================ 멘토 배정 =======================
// =================================================

app.get("/api/mentor-assignments", (req, res) => {
  const rows = db.prepare("SELECT * FROM mentor_assignments").all();
  res.json(rows);
});

app.post("/api/mentor-assignments", (req, res) => {
  const { student_key, mentor, subjects } = req.body;

  db.prepare(`
    INSERT INTO mentor_assignments (student_key, mentor, subjects)
    VALUES (?, ?, ?)
    ON CONFLICT(student_key) DO UPDATE SET
      mentor = excluded.mentor,
      subjects = excluded.subjects
  `).run(student_key, mentor, JSON.stringify(subjects || []));

  res.json({ ok: true });
});

// =================================================
// ============== 원장 컨설팅 =======================
// =================================================

// 학생별 컨설팅 조회
app.get("/api/principal-consultings/:studentKey", (req, res) => {
  const { studentKey } = req.params;

  const rows = db.prepare(`
    SELECT * FROM principal_consultings
    WHERE student_key = ?
    ORDER BY consult_date ASC
  `).all(studentKey);

  res.json(rows);
});

// 컨설팅 추가
app.post("/api/principal-consultings", (req, res) => {
  const { student_key, consult_date } = req.body;

  db.prepare(`
    INSERT INTO principal_consultings (student_key, consult_date, created_at)
    VALUES (?, ?, ?)
  `).run(student_key, consult_date, new Date().toISOString());

  res.json({ ok: true });
});

// =================================================
// ============== 프론트 서빙 ========================
// =================================================

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ===== 서버 시작 =====
app.listen(PORT, () => {
  console.log(`API server running on ${PORT}`);
});
