import React, { useEffect, useState } from "react";
import api from "../api/api";

function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export default function PrincipalConsultingPage() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState({});
  const [consultings, setConsultings] = useState({});
  const [newDate, setNewDate] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const sRes = await api.get("/students");
    const mRes = await api.get("/mentor-assignments");

    setStudents(sRes.data);

    const mentorMap = {};
    mRes.data.forEach((m) => {
      mentorMap[m.student_key] = {
        mentor: m.mentor,
        subjects: JSON.parse(m.subjects || "[]"),
      };
    });
    setMentors(mentorMap);

    // 컨설팅 데이터
    const consultingMap = {};
    for (const s of sRes.data) {
      const cRes = await api.get(`/principal-consultings/${s.student_key}`);
      consultingMap[s.student_key] = cRes.data;
    }
    setConsultings(consultingMap);
  }

  async function addConsulting(studentKey) {
    if (!newDate[studentKey]) return;

    await api.post("/principal-consultings", {
      student_key: studentKey,
      consult_date: newDate[studentKey],
    });

    setNewDate({ ...newDate, [studentKey]: "" });
    loadAll();
  }

  function getWarningColor(student) {
    if (!student.first_attendance_date) return "";

    const list = consultings[student.student_key] || [];
    if (list.length > 0) return "";

    const days = daysBetween(
      student.first_attendance_date,
      new Date().toISOString().slice(0, 10)
    );

    if (days >= 7) return "#f8d7da"; // red
    if (days >= 4) return "#fff3cd"; // orange
    return "";
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>원장 컨설팅 기록</h2>

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
                  {list.map((c) => (
                    <div key={c.id}>{c.consult_date}</div>
                  ))}
                </td>
                <td>
                  <input
                    type="date"
                    value={newDate[s.student_key] || ""}
                    onChange={(e) =>
                      setNewDate({
                        ...newDate,
                        [s.student_key]: e.target.value,
                      })
                    }
                  />
                  <button onClick={() => addConsulting(s.student_key)}>
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
