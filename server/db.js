import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ================================
// Render Disk 경로 설정
// ================================
// Render 환경이면 /var/data
// 로컬 개발이면 server/data
const DATA_DIR = process.env.RENDER
  ? "/var/data"
  : path.join(process.cwd(), "server", "data");

// 디렉토리 없으면 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ================================
// DB 연결
// ================================
const dbPath = path.join(DATA_DIR, "app.db");

// verbose 옵션은 디버깅용 (문제 생기면 로그 추적 쉬움)
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === "development" ? console.log : null,
});

// ================================
// 테이블 초기화
// ================================
db.exec(`
-- =========================
-- 학생 기본 정보
-- =========================
CREATE TABLE IF NOT EXISTS students (
  student_key TEXT PRIMARY KEY,       -- 이름__좌석
  name TEXT NOT NULL,
  seat TEXT NOT NULL,
  first_attendance_date TEXT
);

-- =========================
-- 멘토 배정 정보
-- =========================
CREATE TABLE IF NOT EXISTS mentor_assignments (
  student_key TEXT PRIMARY KEY,
  mentor TEXT,
  subjects TEXT                      -- JSON 문자열
);

-- =========================
-- 원장 컨설팅 기록
-- =========================
CREATE TABLE IF NOT EXISTS principal_consultings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_key TEXT NOT NULL,
  consult_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- =========================
-- (예비) 출결 데이터
-- AttendancePage 서버화 대비
-- =========================
CREATE TABLE IF NOT EXISTS attendance (
  student_key TEXT PRIMARY KEY,
  data TEXT                          -- 요일별 출결 JSON
);
`);

// ================================
// 외래키 제약 (논리적 일관성)
// SQLite는 PRAGMA 필요
// ================================
db.pragma("foreign_keys = ON");

export default db;
