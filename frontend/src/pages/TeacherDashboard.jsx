import { useState, useEffect } from "react";
import AttendancePage from "./teacher/AttendancePage";
import NotesPage from "./teacher/NotesPage";
import AssignmentsPage from "./teacher/AssignmentsPage";
import StudentRecordsPage from "./teacher/StudentRecordsPage";
import SubjectsManagementPage from "./teacher/SubjectsManagementPage";
import { subjectsAPI, assignmentsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

import ProfileModal from "../components/ProfileModal";
import "./Dashboard.css";

const navItems = [
  { key: "home", icon: "📊", label: "Dashboard" },
  { key: "subjects", icon: "📚", label: "Subjects" },
  { key: "attendance", icon: "📝", label: "Attendance" },
  { key: "notes", icon: "📓", label: "Notes" },
  { key: "assignments", icon: "📋", label: "Assignments" },
  { key: "records", icon: "🗂️", label: "Student Records" },
];


const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [showProfile, setShowProfile] = useState(false);

  const [stats, setStats] = useState([
    { label: "Total Students", value: "0", color: "#2563eb", icon: "👥" },
    { label: "Assignments Set", value: "0", color: "#2563eb", icon: "📝" },
    { label: "Enrolled Subjects", value: "0", color: "#059669", icon: "📖" },
    { label: "Low Attendance", value: "0", color: "#dc2626", icon: "⚠️" },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [progRes, asgnRes, subjRes] = await Promise.all([
          subjectsAPI.getProgress(),
          assignmentsAPI.getAll(),
          subjectsAPI.getMine()
        ]);

        const extract = (res) => {
          if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
          if (res?.data && Array.isArray(res.data)) return res.data;
          return [];
        };

        const students = extract(progRes);
        const assignments = extract(asgnRes);
        const subjects = extract(subjRes);


        const lowAtt = students.filter(s => s.attendance < 75).length;

        setStats([
          { label: "Total Students", value: students.length.toString(), color: "#2563eb", icon: "👥" },
          { label: "Assignments Set", value: assignments.length.toString(), color: "#2563eb", icon: "📝" },
          { label: "Enrolled Subjects", value: subjects.length.toString(), color: "#059669", icon: "📖" },
          { label: "Low Attendance", value: lowAtt.toString(), color: "#dc2626", icon: "⚠️" },
        ]);
      } catch (e) {
        console.error("Error loading teacher stats:", e);
      }
    };
    if (user) loadStats();
  }, [user]);


  const renderPage = () => {
    if (page === "subjects") return <SubjectsManagementPage />;
    if (page === "attendance") return <AttendancePage />;
    if (page === "notes") return <NotesPage />;
    if (page === "assignments") return <AssignmentsPage />;
    if (page === "records") return <StudentRecordsPage />;

    return (
      <>
        <section className="stats-grid">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <span className="stat-icon" style={{ background: s.color + "20", color: s.color }}>
                {s.icon}
              </span>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button className="action-card" onClick={() => setPage("attendance")}>📅 Record Attendance</button>
            <button className="action-card" onClick={() => setPage("notes")}>📤 Upload Notes</button>
            <button className="action-card" onClick={() => setPage("assignments")}>➕ New Assignment</button>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="dashboard">
      <aside className="sidebar sidebar-teacher">
        <div className="logo">🎓 SmartCampus</div>
        <nav>
          {navItems.map((n) => (
            <button
              key={n.key}
              className={`nav-link ${page === n.key ? "active" : ""}`}
              onClick={() => setPage(n.key)}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </aside>

      <main className="main">
        <header className="dash-header">
          <div>
            <h1>{navItems.find((n) => n.key === page)?.label ?? "Dashboard"}</h1>
            <p>Teacher View: <strong>{user?.name || user?.email}</strong></p>
          </div>
          <div className="avatar" onClick={() => setShowProfile(true)} style={{ background: "#2563eb", cursor: 'pointer' }}>
            {(user?.name || user?.email)?.[0]?.toUpperCase()}
          </div>
        </header>
        {renderPage()}
      </main>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={logout}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;