import React, { useState } from "react";
import { useSchedule } from "../context/ScheduleContext";
import { timeToMinutes } from "../utils/scheduler";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../api/api";

const days = ["월", "화", "수", "목", "금", "토"];

export default function AttendancePage() {
  const {
    students,
    attendance,
    setAttendanceNormalized,
    addStudent,
    updateStudent,
    removeStudent,
    startDate,
    endDate,
  } = useSchedule();

  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // 선택 삭제 모드
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // =========================
  // 출결 시간 업데이트
  // =========================
  const updateTime = (id, day, index, value) => {
    setAttendanceNormalized(prev => {
      const next = { ...prev };
      const per = Array.isArray(next[id]?.[day]) ? [...next[id][day]] : ["", ""];
      per[index] = value;
      next[id] = { ...(next[id] || {}), [day]: per };
      return next;
    });
  };

  // =========================
  // 학생 추가 (서버 연동)
  // =========================
  const handleAddStudent = async () => {
    const name = prompt("학생 이름을 입력하세요");
    if (!name) return;

    // 1. Context
    addStudent({ name });

    // 2. Server DB
    try {
      await api.post("/students", {
        name,
        seat: "",
        first_attendance_date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("학생 서버 저장 실패", err);
      alert("학생 서버 저장 중 오류가 발생했습니다.");
    }
  };

  // =========================
  // 학생 삭제 (서버 연동)
  // =========================
  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`${student.name} 학생을 삭제할까요?`)) return;

    removeStudent(student.id);

    try {
      await api.delete(`/students/${encodeURIComponent(student.name)}`);
    } catch (err) {
      console.error("학생 서버 삭제 실패", err);
    }
  };

  // =========================
  // 선택 모드
  // =========================
  const toggleSelectionMode = () => {
    setSelectionMode(v => !v);
    setSelectedIds(new Set());
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = (e, list) => {
    if (!e.target.checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(list.map(s => s.id)));
  };

  const deleteSelectedRows = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 학생을 선택하세요.");
      return;
    }
    if (!window.confirm(`${selectedIds.size}명을 삭제할까요?`)) return;

    for (const id of selectedIds) {
      const s = students.find(x => x.id === id);
      if (!s) continue;

      removeStudent(id);
      try {
        await api.delete(`/students/${encodeURIComponent(s.name)}`);
      } catch (err) {
        console.error("학생 서버 삭제 실패", err);
      }
    }

    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // =========================
  // 계산 / 표시
  // =========================
  const calculateWeeklyTotal = (studentId) => {
    const att = attendance[studentId] || {};
    const totalMinutes = days.reduce((sum, d) => {
      const times = att[d];
      if (Array.isArray(times) && times[0] && times[1]) {
        let start = timeToMinutes(times[0]);
        let end = timeToMinutes(times[1]);
        if (end < start) end += 1440;
        sum += end - start;
      }
      return sum;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}시간 ${minutes}분`;
  };

  const formatAttendanceSummary = (att = {}) =>
    days
      .map(d => {
        const times = att[d];
        return `${d}: ${
          Array.isArray(times) && times[0] && times[1]
            ? `${times[0]}~${times[1]}`
            : "없음"
        }`;
      })
      .join(", ");

  // =========================
  // 정렬 / 검색 (기존 유지)
  // =========================
  const handleSortByName = () => {
    const sorted = [...students].sort((a, b) =>
      a.name.localeCompare(b.name, "ko-KR")
    );
    sorted.forEach((s, i) => updateStudent(s.id, { _order: i }));
  };

  const handleSortBySeat = () => {
    const sorted = [...students].sort((a, b) => {
      const seatA = parseInt(a.seatNumber, 10);
      const seatB = parseInt(b.seatNumber, 10);
      if (isNaN(seatA) && isNaN(seatB)) return 0;
      if (isNaN(seatA)) return 1;
      if (isNaN(seatB)) return -1;
      return seatA - seatB;
    });
    sorted.forEach((s, i) => updateStudent(s.id, { _order: i }));
  };

  const handleSearch = () => {
    setSearch(searchValue.trim());
  };

  const filteredStudents = students.filter(s => s.name.includes(search));

  // =========================
  // 엑셀 다운로드 (기존 유지)
  // =========================
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = ["이름", "좌석번호", ...days, "총 체류(분)"];
    const wsData = [
      [`주간 일정: ${startDate || ""} ~ ${endDate || ""}`],
      header,
    ];

    students.forEach((s) => {
      const row = [s.name, s.seatNumber || ""];
      let total = 0;
      days.forEach((d) => {
        const times = attendance[s.id]?.[d] || [];
        const range = times[0] && times[1] ? `${times[0]}~${times[1]}` : "";
        row.push(range);
        if (times[0] && times[1]) {
          total += timeToMinutes(times[1]) - timeToMinutes(times[0]);
        }
      });
      row.push(total);
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "출결표");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `학생출결_${startDate || "start"}-${endDate || "end"}.xlsx`
    );
  };

  // =========================
  // 엑셀 업로드 (기존 유지 + 서버 반영)
  // =========================
  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const nameToStudent = Object.fromEntries(
        students.map(s => [s.name, s])
      );

      const incomingAttendance = {};

      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        const name = (row[0] || "").trim();
        const seat = row[1] || "";
        if (!name) continue;

        let student = nameToStudent[name];
        if (!student) {
          addStudent({ name, seatNumber: seat });

          await api.post("/students", {
            name,
            seat,
            first_attendance_date: new Date().toISOString().slice(0, 10),
          });

          student = nameToStudent[name];
        } else {
          updateStudent(student.id, { seatNumber: seat });

          await api.post("/students", {
            name,
            seat,
            first_attendance_date: null,
          });
        }

        incomingAttendance[student.id] = incomingAttendance[student.id] || {};

        days.forEach((day, idx) => {
          const cell = row[2 + idx];
          if (typeof cell === "string" && cell.includes("~")) {
            const [st, en] = cell.split("~").map(v => v.trim());
            incomingAttendance[student.id][day] = [st, en];
          }
        });
      }

      setAttendanceNormalized(prev => ({ ...prev, ...incomingAttendance }));

      if (e.target && "value" in e.target) e.target.value = "";
    };

    reader.readAsBinaryString(file);
  };

  // =========================
  // 렌더
  // =========================
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">학생 출결 입력</h1>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleAddStudent}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          + 학생 추가
        </button>

        <button
          onClick={handleSortByName}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          이름순 정렬
        </button>

        <button
          onClick={handleSortBySeat}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          좌석순 정렬
        </button>

        <input
          type="text"
          placeholder="이름 검색"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="border px-2 py-1"
        />
        <button
          onClick={handleSearch}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          검색
        </button>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleUploadExcel}
          className="border px-2 py-1"
        />
        <button
          onClick={handleDownloadExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          엑셀 다운로드
        </button>

        <button
          onClick={toggleSelectionMode}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          {selectionMode ? "선택 모드 해제" : "선택 모드"}
        </button>

        {selectionMode && (
          <button
            onClick={deleteSelectedRows}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            선택 삭제
          </button>
        )}

        <div className="ml-auto text-lg font-medium">
          총 학생 수: {students.length}명
        </div>
      </div>

      <table className="w-full mt-4 text-center border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            {selectionMode && (
              <th className="border px-2">
                <input
                  type="checkbox"
                  onChange={(e) => toggleSelectAll(e, filteredStudents)}
                />
              </th>
            )}
            <th className="border px-2">이름</th>
            <th className="border px-2">좌석 번호</th>
            {days.map(d => (
              <th key={d} colSpan={2} className="border px-2">{d}</th>
            ))}
            <th className="border px-2">총합</th>
            <th className="border px-2">삭제</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(student => (
            <tr key={student.id}>
              {selectionMode && (
                <td className="border px-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleSelectRow(student.id)}
                  />
                </td>
              )}
              <td className="border px-2">
                <input
                  className="border px-1 w-24"
                  value={student.name}
                  onChange={e =>
                    updateStudent(student.id, { name: e.target.value })
                  }
                />
              </td>
              <td className="border px-2">
                <input
                  className="border px-1 w-16 text-center"
                  value={student.seatNumber || ""}
                  onChange={e =>
                    updateStudent(student.id, { seatNumber: e.target.value })
                  }
                />
              </td>
              {days.map(day => {
                const [start = "", end = ""] =
                  attendance[student.id]?.[day] || [];
                return (
                  <React.Fragment key={day}>
                    <td className="border px-1">
                      <input
                        value={start}
                        onChange={e =>
                          updateTime(student.id, day, 0, e.target.value)
                        }
                        className="border w-16 text-center"
                      />
                    </td>
                    <td className="border px-1">
                      <input
                        value={end}
                        onChange={e =>
                          updateTime(student.id, day, 1, e.target.value)
                        }
                        className="border w-16 text-center"
                      />
                    </td>
                  </React.Fragment>
                );
              })}
              <td className="border px-2">
                {calculateWeeklyTotal(student.id)}
              </td>
              <td className="border px-2">
                <button
                  onClick={() => handleDeleteStudent(student)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">학생 출결 요약</h2>
        {filteredStudents.map(s => (
          <div key={s.id}>
            <strong>{s.name}</strong>: {formatAttendanceSummary(attendance[s.id])}
          </div>
        ))}
      </div>
    </div>
  );
}
