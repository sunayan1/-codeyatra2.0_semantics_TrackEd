import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import ProfileModal from "../components/ProfileModal";
import SubjectSelectionModal from "../components/student/SubjectSelectionModal";
import "./Dashboard.css";

const stats = [
    { icon: "📅", label: "Attendance", value: "92%", color: "#7c3aed" },
    { icon: "📝", label: "Tasks Due", value: "3", color: "#2563eb" },
    { icon: "🎓", label: "GPA", value: "3.8", color: "#059669" },
    { icon: "🏆", label: "Rank", value: "#4", color: "#d97706" },
];

const featureBoxes = [
    { key: "subjects", icon: "📚", label: "Learning Path", path: "/student/subjects", color: "#7c3aed", desc: "Interactive roadmaps & levels" },
    { key: "notes", icon: "📝", label: "My Notes", path: "/student/notes", color: "#2563eb", desc: "Master your chapters" },
    { key: "asgn", icon: "🚀", label: "Assignments", path: "/student/assignments", color: "#f59e0b", desc: "Submit and grow" },
    { key: "room", icon: "🏠", label: "Study Room", path: "/student/study-room", color: "#059669", desc: "Your focused workspace" },
];

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showSubjectSelection, setShowSubjectSelection] = useState(false);

    const handleBoxClick = (box) => {
        if (box.key === "subjects") {
            setShowSubjectSelection(true);
        } else {
            navigate(box.path);
        }
    };

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />

            <main className="main">
                <StudentHeader
                    title="Dashboard"
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
                            onClick={() => handleBoxClick(b)}
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

            {showSubjectSelection && (
                <SubjectSelectionModal
                    onClose={() => setShowSubjectSelection(false)}
                    onSelect={(subjectId) => {
                        setShowSubjectSelection(false);
                        navigate(`/student/subject/${subjectId}`);
                    }}
                />
            )}
        </div>
    );
};

export default StudentDashboard;