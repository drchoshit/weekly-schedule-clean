import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE } from "../utils/api";

export const ScheduleContext = createContext();

// 요일 상수
const days = ["월", "화", "수", "목", "금", "토"];

export const ScheduleProvider = ({ children }) => {
  // =========================
  // 상태 (서버 단일 소스)
  // =========================
  const [students, setStudents] = useState([]);
  const [mentorsByDay, setMentorsByDay] = useState({ 월: [], 화: [], 수: [], 목: [], 금: [], 토: [] });
  const [plannerMessage, setPlannerMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [monthlyNotice, setMonthlyNotice] = useState("");

  const defaultMentalCare = {
    mentorTime: { 월: {}, 화: {}, 수: {}, 목: {}, 금: {}, 토: {} },
    sessionDuration: 15,
  };
  const [mentalCareSettings, setMentalCareSettings] = useState(defaultMentalCare);

  const defaultSchedule = { 월: [], 화: [], 수: [], 목: [], 금: [], 토: [] };
  const [scheduleByDay, setScheduleByDay] = useState(defaultSchedule);

  const [attendance, setAttendance] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [studentInterviewAssignments, setStudentInterviewAssignments] = useState({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // =========================
  // 최초 로딩 (서버 GET)
  // =========================
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          studentsRes,
          attendanceRes,
          mentalRes
        ] = await Promise.all([
          fetch(`${API_BASE}/api/students`).then(r => r.json()),
          fetch(`${API_BASE}/api/attendance`).then(r => r.json()),
          fetch(`${API_BASE}/api/mental-care`).then(r => r.json())
        ]);

        setStudents(Array.isArray(studentsRes) ? studentsRes : []);
        setAttendance(attendanceRes || {});
        setMentalCareSettings(mentalRes || defaultMentalCare);
      } catch (e) {
        console.error("초기 로딩 실패:", e);
      }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // 출결 정규화 로직 (유지)
  // =========================
  function normalizeTimeValue(value) {
    if (Array.isArray(value)) {
      const a = value.map((v) => (typeof v === "string" ? v.trim() : ""));
      if (!a[0] && !a[1]) return [];
      return [a[0] || "", a[1] || ""];
    }
    if (typeof value === "string") {
      const s = value.trim();
      if (!s) return [];
      if (s.includes("~")) {
        const [st, en] = s.split("~").map((x) => x.trim());
        if (!st && !en) return [];
        return [st || "", en || ""];
      }
      return [s, ""];
    }
    return [];
  }

  function normalizeAttendanceShape(rawAttendance, list = students) {
    const next = { ...(rawAttendance || {}) };
    let changed = false;

    list.forEach((s) => {
      if (!next[s.id]) {
        next[s.id] = {};
        changed = true;
      }
      const per = next[s.id];
      days.forEach((d) => {
        const before = per[d];
        const after = normalizeTimeValue(before);
        const beforeStr = JSON.stringify(before === undefined ? null : before);
        const afterStr = JSON.stringify(after);
        if (beforeStr !== afterStr) {
          per[d] = after;
          changed = true;
        }
      });
    });

    return { normalized: next, changed };
  }

  useEffect(() => {
    const { normalized, changed } = normalizeAttendanceShape(attendance, students);
    if (changed) setAttendance(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, attendance]);

  // =========================
  // 서버 저장 (POST)
  // =========================
  const saving = useRef(false);

  const postJSON = async (url, body) => {
    try {
      saving.current = true;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("저장 실패:", e);
    } finally {
      saving.current = false;
    }
  };

  useEffect(() => {
    if (saving.current) return;
    postJSON(`${API_BASE}/api/students`, students);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  useEffect(() => {
    if (saving.current) return;
    postJSON(`${API_BASE}/api/attendance`, attendance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance]);

  useEffect(() => {
    if (saving.current) return;
    postJSON(`${API_BASE}/api/mental-care`, mentalCareSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentalCareSettings]);

  // =========================
  // 엑셀 병합/안전 setter (유지)
  // =========================
  const setAttendanceNormalized = (nextOrUpdater) => {
    setAttendance((prev) => {
      const draft = typeof nextOrUpdater === "function" ? nextOrUpdater(prev) : nextOrUpdater;
      const { normalized } = normalizeAttendanceShape(draft, students);
      return normalized;
    });
  };

  const mergeAttendanceFromExcel = (incoming) => {
    setAttendance((prev) => {
      const base = { ...prev };
      Object.entries(incoming || {}).forEach(([sid, perDay]) => {
        if (!base[sid]) base[sid] = {};
        days.forEach((d) => {
          if (perDay && perDay[d] !== undefined) {
            base[sid][d] = normalizeTimeValue(perDay[d]);
          }
        });
      });
      const { normalized } = normalizeAttendanceShape(base, students);
      return normalized;
    });
  };

  // =========================
  // 전체 getter / setter
  // =========================
  const getAllState = () => ({
    students,
    mentorsByDay,
    plannerMessage,
    noticeMessage,
    monthlyNotice,
    mentalCareSettings,
    scheduleByDay,
    attendance,
    assignments,
    studentInterviewAssignments,
    startDate,
    endDate,
  });

  const setAllState = (data) => {
    if (data.students) setStudents(data.students);
    if (data.mentorsByDay) setMentorsByDay(data.mentorsByDay);
    if (typeof data.plannerMessage === "string") setPlannerMessage(data.plannerMessage);
    if (typeof data.noticeMessage === "string") setNoticeMessage(data.noticeMessage);
    if (typeof data.monthlyNotice === "string") setMonthlyNotice(data.monthlyNotice);
    if (data.mentalCareSettings) setMentalCareSettings(data.mentalCareSettings);
    if (data.scheduleByDay) setScheduleByDay(data.scheduleByDay);
    if (data.attendance) setAttendance(data.attendance);
    if (data.assignments) setAssignments(data.assignments);
    if (data.studentInterviewAssignments) {
      setStudentInterviewAssignments((prev) => ({ ...prev, ...data.studentInterviewAssignments }));
    }
    if (data.startDate) setStartDate(data.startDate);
    if (data.endDate) setEndDate(data.endDate);
  };

  return (
    <ScheduleContext.Provider
      value={{
        students, setStudents,
        mentorsByDay, setMentorsByDay,
        plannerMessage, setPlannerMessage,
        noticeMessage, setNoticeMessage,
        monthlyNotice, setMonthlyNotice,
        mentalCareSettings, setMentalCareSettings,
        scheduleByDay, setScheduleByDay,
        attendance, setAttendance,
        assignments, setAssignments,
        studentInterviewAssignments, setStudentInterviewAssignments,
        startDate, setStartDate,
        endDate, setEndDate,
        getAllState, setAllState,
        setAttendanceNormalized,
        mergeAttendanceFromExcel,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => useContext(ScheduleContext);
