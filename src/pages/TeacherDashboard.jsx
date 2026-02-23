import { useState } from "react";
import AttendancePage from "./teacher/AttendancePage";
import NotesPage from "./teacher/NotesPage";
import AssignmentsPage from "./teacher/AssignmentsPage";
import StudentRecordsPage from "./teacher/StudentRecordsPage";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "../components/ProfileModal";
import "./Dashboard.css";

const navItems = [
  { key: "home", icon: "", label: "Dashboard" },
  { key: "attendance", icon: "", label: "Attendance" },
  { key: "notes", icon: "", label: "Notes" },
  { key: "assignments", icon: "", label: "Assignments" },
  { key: "records", icon: "", label: "Student Records" },
];

const stats = [
  { icon: "", label: "Students", value: "132", color: "#2563eb" },
  { icon: "", label: "Assignments Set", value: "18", color: "#2563eb" },
  { icon: "", label: "Classes Today", value: "4", color: "#059669" },
  { icon: "", label: "Low Attendance", value: "7", color: "#dc2626" },
];

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [showProfile, setShowProfile] = useState(false);

  const renderPage = () => {
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
            <button className="action-card" onClick={() => setPage("attendance")}>Record Attendance</button>
            <button className="action-card" onClick={() => setPage("notes")}>Upload Notes</button>
            <button className="action-card" onClick={() => setPage("assignments")}>New Assignment</button>
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
            <p>Teacher View: <strong>{user?.email}</strong></p>
          </div>
          <div className="avatar" onClick={() => setShowProfile(true)} style={{ background: "#2563eb", cursor: 'pointer' }}>
            {user?.email?.[0]?.toUpperCase()}
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