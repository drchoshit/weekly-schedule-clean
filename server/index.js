import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 10000;

// ================================
// ES module용 __dirname
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// 미들웨어
// ================================
app.use(cors());
app.use(express.json());

// ================================
// 헬스 체크
// ================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// =================================================
// ================== 학생 ==========================
// =================================================

// 학생 전체 조회
app.get("/api/students", (req, res) => {
  const rows = db.prepare(`
    SELECT name, seat, first_attendance_date
    FROM students
    ORDER BY name ASC
  `).all();
  res.json(rows);
});

// 학생 저장 / 업데이트
app.post("/api/students", (req, res) => {
  const { name, seat, first_attendance_date } = req.body;

  if (!name || !seat) {
    return res.status(400).json({ error: "name, seat 필수" });
  }

  db.prepare(`
    INSERT INTO students (name, seat, first_attendance_date)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      seat = excluded.seat,
      first_attendance_date = excluded.first_attendance_date
  `).run(name, seat, first_attendance_date || null);

  res.json({ ok: true });
});

// =================================================
// ================ 멘토 배정 =======================
// =================================================

// 전체 멘토 배정 조회
app.get("/api/mentor-assignments", (req, res) => {
  const rows = db.prepare(`
    SELECT student_name, mentor, subjects
    FROM mentor_assignments
  `).all();
  res.json(rows);
});

// 멘토 배정 저장 / 업데이트
app.post("/api/mentor-assignments", (req, res) => {
  const { student_name, mentor, subjects } = req.body;

  if (!student_name) {
    return res.status(400).json({ error: "student_name 필수" });
  }

  db.prepare(`
    INSERT INTO mentor_assignments (student_name, mentor, subjects)
    VALUES (?, ?, ?)
    ON CONFLICT(student_name) DO UPDATE SET
      mentor = excluded.mentor,
      subjects = excluded.subjects
  `).run(
    student_name,
    mentor || null,
    JSON.stringify(subjects || [])
  );

  res.json({ ok: true });
});

// =================================================
// ============== 원장 컨설팅 =======================
// =================================================

// 학생별 컨설팅 조회
app.get("/api/principal-consultings/:studentName", (req, res) => {
  const { studentName } = req.params;

  const rows = db.prepare(`
    SELECT id, student_name, consult_date, created_at
    FROM principal_consultings
    WHERE student_name = ?
    ORDER BY consult_date ASC
  `).all(studentName);

  res.json(rows);
});

// 컨설팅 추가
app.post("/api/principal-consultings", (req, res) => {
  const { student_name, consult_date } = req.body;

  if (!student_name || !consult_date) {
    return res.status(400).json({ error: "student_name, consult_date 필수" });
  }

  db.prepare(`
    INSERT INTO principal_consultings (student_name, consult_date, created_at)
    VALUES (?, ?, ?)
  `).run(
    student_name,
    consult_date,
    new Date().toISOString()
  );

  res.json({ ok: true });
});

// =================================================
// ============== 프론트 정적 서빙 ===================
// =================================================

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ================================
// 서버 시작
// ================================
app.listen(PORT, () => {
  console.log(`API server running on ${PORT}`);
});
