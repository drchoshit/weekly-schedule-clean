// src/App.jsx
import React, { useState } from "react";
import { ScheduleProvider } from "./context/ScheduleContext";

import WeeklySchedule from "./components/WeeklySchedule";
import SettingsPage from "./components/SettingsPage";
import AttendancePage from "./pages/AttendancePage";
import MentalCarePage from "./pages/MentalCarePage";
import PlannerCheckPage from "./pages/PlannerCheckPage";
import MentorAssignmentPage from "./pages/MentorAssignmentPage";
import ViceDirectorPage from "./pages/ViceDirectorPage";
import PrincipalConsultingPage from "./pages/PrincipalConsultingPage";

function InnerApp() {
  const [plannerText, setPlannerText] = useState(
    "월,수,금: 이민섭M / 화, 목: 임현지M / 부원장님: 김영편입 교수"
  );
  const [notices, setNotices] = useState([
    "노 말마기 대여 가능 (최대 20분)",
    "마스크 착용 필수",
    "무단 이동 시 기록됨",
  ]);

  // 현재 페이지 번호
  const [page, setPage] = useState(1);

  // 페이지 버튼 이름 (순서 = page 번호)
  const pageNames = [
    "인쇄페이지",
    "멘토정보란",
    "학생출결표",
    "멘탈케어링",
    "플래너체크",
    "멘토배정AI",
    "월간인터뷰",
    "원장컨설팅",
  ];

  return (
    <div className="p-4">
      {/* 상단 네비게이션 버튼 */}
      <div className="mb-4">
        {pageNames.map((name, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx + 1)}
            className={`mr-2 px-4 py-2 rounded ${
              page === idx + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 페이지 렌더링 */}
      {page === 1 && (
        <WeeklySchedule plannerText={plannerText} notices={notices} />
      )}

      {page === 2 && (
        <SettingsPage
          plannerText={plannerText}
          setPlannerText={setPlannerText}
          notices={notices}
          setNotices={setNotices}
        />
      )}

      {page === 3 && <AttendancePage />}

      {page === 4 && <MentalCarePage />}

      {page === 5 && <PlannerCheckPage />}

      {page === 6 && <MentorAssignmentPage />}

      {page === 7 && <ViceDirectorPage />}

      {page === 8 && <PrincipalConsultingPage />}
    </div>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      {/* main.jsx 에서 이미 <HashRouter>로 감싸고 있으므로 여기서는 그대로 렌더 */}
      <InnerApp />
    </ScheduleProvider>
  );
}
