import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ================================
// 데이터 디렉토리 결정
// ================================
const DATA_DIR = fs.existsSync("/var/data")
  ? "/var/data"
  : path.join(process.cwd(), "server", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ================================
// DB 연결
// ================================
const dbPath = path.join(DATA_DIR, "app.db");
const db = new Database(dbPath);

// ================================
// 테이블 초기화
// ================================
db.exec(`
CREATE TABLE IF NOT EXISTS students (
  name TEXT PRIMARY KEY,
  seat TEXT NOT NULL,
  first_attendance_date TEXT
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  student_name TEXT PRIMARY KEY,
  mentor TEXT,
  subjects TEXT
);

CREATE TABLE IF NOT EXISTS principal_consultings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  consult_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  student_name TEXT PRIMARY KEY,
  data TEXT
);
`);

export default db;
