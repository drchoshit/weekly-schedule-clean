import React, { useEffect, useState } from "react";
import api from "../api/api";

// 날짜 차이 계산 (일 단위)
function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export default function PrincipalConsultingPage() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState({});
  const [consultings, setConsultings] = useState({});
  const [newDate, setNewDate] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  // ============================
  // 전체 데이터 로딩
  // ============================
  async function loadAll() {
    try {
      setLoading(true);

      // 1. 학생 / 멘토배정 병렬 로딩
      const [sRes, mRes] = await Promise.all([
        api.get("/students"),
        api.get("/mentor-assignments"),
      ]);

      const studentList = sRes.data || [];
      setStudents(studentList);

      // 2. 멘토 매핑
      const mentorMap = {};
      (mRes.data || []).forEach((m) => {
        mentorMap[m.student_key] = {
          mentor: m.mentor,
          subjects: JSON.parse(m.subjects || "[]"),
        };
      });
      setMentors(mentorMap);

      // 3. 컨설팅 기록 병렬 로딩
      const consultingEntries = await Promise.all(
        studentList.map(async (s) => {
          const res = await api.get(
            `/principal-consultings/${s.student_key}`
          );
          return [s.student_key, res.data || []];
        })
      );

      const consultingMap = Object.fromEntries(consultingEntries);
      setConsultings(consultingMap);
    } catch (err) {
      console.error("원장 컨설팅 데이터 로딩 실패", err);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // 컨설팅 추가
  // ============================
  async function addConsulting(studentKey) {
    const date = newDate[studentKey];
    if (!date) return;

    try {
      await api.post("/principal-consultings", {
        student_key: studentKey,
        consult_date: date,
      });

      setNewDate((prev) => ({ ...prev, [studentKey]: "" }));
      loadAll();
    } catch (err) {
      console.error("컨설팅 추가 실패", err);
    }
  }

  // ============================
  // 경고 색상 계산
  // ============================
  function getWarningColor(student) {
    if (!student.first_attendance_date) return "";

    const list = consultings[student.student_key] || [];
    if (list.length > 0) return "";

    const days = daysBetween(
      student.first_attendance_date,
      new Date().toISOString().slice(0, 10)
    );

    if (days >= 7) return "#f8d7da"; // 빨강
    if (days >= 4) return "#fff3cd"; // 주황
    return "";
  }

  // ============================
  // 렌더
  // ============================
  return (
    <div style={{ padding: 20 }}>
      <h2>원장 컨설팅 기록</h2>

      {loading && <div style={{ marginBottom: 10 }}>불러오는 중...</div>}

      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>학생명</th>
            <th>좌석</th>
            <th>멘토</th>
            <th>선택과목</th>
            <th>첫 등원일</th>
            <th>컨설팅 기록</th>
            <th>추가</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const m = mentors[s.student_key] || {};
            const list = consultings[s.student_key] || [];

            return (
              <tr
                key={s.student_key}
                style={{ background: getWarningColor(s) }}
              >
                <td>{s.name}</td>
                <td>{s.seat}</td>
                <td>{m.mentor || "-"}</td>
                <td>{(m.subjects || []).join(", ")}</td>
                <td>{s.first_attendance_date || "-"}</td>
                <td>
                  {list.length === 0 && <div>-</div>}
                  {list.map((c) => (
                    <div key={c.id}>{c.consult_date}</div>
                  ))}
                </td>
                <td>
                  <input
                    type="date"
                    value={newDate[s.student_key] || ""}
                    onChange={(e) =>
                      setNewDate((prev) => ({
                        ...prev,
                        [s.student_key]: e.target.value,
                      }))
                    }
                  />
                  <button
                    style={{ marginLeft: 4 }}
                    onClick={() => addConsulting(s.student_key)}
                  >
                    추가
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
