import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import ProfileModal from "../components/ProfileModal";
import "./Dashboard.css";

const stats = [
    { icon: "📅", label: "Attendance", value: "92%", color: "#7c3aed" },
    { icon: "📋", label: "Tasks Due", value: "3", color: "#2563eb" },
    { icon: "📊", label: "GPA", value: "3.8", color: "#059669" },
    { icon: "🏆", label: "Rank", value: "#4", color: "#d97706" },
];

const featureBoxes = [
    { key: "subjects", icon: "📚", label: "Subjects", path: "/student/subjects", color: "#7c3aed", desc: "Your enrolled subjects" },
    { key: "notes", icon: "📄", label: "My Notes", path: "/student/notes", color: "#2563eb", desc: "Notes shared by teachers" },
    { key: "asgn", icon: "📝", label: "Assignments", path: "/student/assignments", color: "#f59e0b", desc: "Hand in your work" },
    { key: "room", icon: "🏠", label: "Personal Room", path: "/student/study-room", color: "#059669", desc: "Enter your Study Room" },
];

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />

            <main className="main">
                <StudentHeader
                    title="Student Dashboard"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <section className="stats-grid">
                    {stats.map((s) => (
                        <div className="stat-card" key={s.label}>
                            <span className="stat-icon" style={{ background: s.color + "20", color: s.color }}>{s.icon}</span>
                            <div>
                                <p className="stat-value">{s.value}</p>
                                <p className="stat-label">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="feature-boxes">
                    {featureBoxes.map((b) => (
                        <button
                            key={b.key}
                            className="feature-box"
                            style={{ "--box-color": b.color }}
                            onClick={() => navigate(b.path)}
                        >
                            <span className="feature-icon">{b.icon}</span>
                            <p className="feature-label">{b.label}</p>
                            <p className="feature-desc">{b.desc}</p>
                        </button>
                    ))}
                </section>
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

export default StudentDashboard;