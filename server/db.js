import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ================================
// 데이터 디렉토리 결정
// ================================
// Render Disk가 마운트되어 있으면 /var/data
// 아니면 로컬 개발용 server/data
const DATA_DIR = fs.existsSync("/var/data")
  ? "/var/data"
  : path.join(process.cwd(), "server", "data");

// 디렉토리 없으면 생성 (권한 있는 경우만)
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
  student_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  seat TEXT NOT NULL,
  first_attendance_date TEXT
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  student_key TEXT PRIMARY KEY,
  mentor TEXT,
  subjects TEXT
);

CREATE TABLE IF NOT EXISTS principal_consultings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_key TEXT NOT NULL,
  consult_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  student_key TEXT PRIMARY KEY,
  data TEXT
);
`);

export default db;
