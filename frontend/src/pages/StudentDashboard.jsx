import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { attendanceAPI, submissionsAPI, assignmentsAPI, subjectsAPI } from "../services/api";

import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import ProfileModal from "../components/ProfileModal";
import SubjectSelectionModal from "../components/student/SubjectSelectionModal";
import ProgressTracker from "../components/student/ProgressTracker";
import "./Dashboard.css";

const featureBoxes = [
    { key: "subjects", icon: "", label: "Learning Path", path: "/student/subjects", color: "#2563eb", desc: "Interactive roadmaps & levels" },
    { key: "notes", icon: "", label: "My Notes", path: "/student/notes", color: "#2563eb", desc: "Master your chapters" },
    { key: "asgn", icon: "", label: "Assignments", path: "/student/assignments", color: "#f59e0b", desc: "Submit and grow" },
    { key: "room", icon: "", label: "Study Room", path: "/student/study-room", color: "#059669", desc: "Your focused workspace" },
];

const StudentDashboard = () => {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showSubjectSelection, setShowSubjectSelection] = useState(false);

    const [stats, setStats] = useState([
        { label: "Attendance", value: "0%", color: "#2563eb" },
        { label: "Assignments", value: "0/0", color: "#2563eb" },
        { label: "Subjects", value: "0", color: "#059669" },
        { label: "Status", value: "Good", color: "#d97706" },
    ]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [attRes, subRes, asgnRes, subjRes] = await Promise.all([
                    attendanceAPI.getMy(),
                    submissionsAPI.getMySubmissions(),
                    assignmentsAPI.getAll(),
                    subjectsAPI.getMine()
                ]);

                const extract = (res) => {
                    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
                    if (res?.data && Array.isArray(res.data)) return res.data;
                    return [];
                };

                const attData = extract(attRes);
                const subData = extract(subRes);
                const asgnData = extract(asgnRes);
                const subjData = extract(subjRes);

                const totalDays = attData.length;
                const presentDays = attData.filter(d => d.status === 'present' || d.status === 'late').length;
                const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

                // Unique assignments submitted
                const submittedAsgnIds = new Set(subData.map(s => s.assignment_id));
                const completedCount = submittedAsgnIds.size;

                setStats([
                    { label: "Attendance", value: `${attendance}%`, color: "#2563eb" },
                    { label: "Assignments", value: `${completedCount} / ${asgnData.length}`, color: "#2563eb" },
                    { label: "Subjects", value: subjData.length.toString(), color: "#059669" },
                    { label: "Status", value: attendance < 75 ? "At Risk" : "Good", color: "#d97706" },
                ]);
            } catch (e) {
                console.error("Error loading dashboard stats:", e);
            }
        };
        if (user) loadStats();
    }, [user]);


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
                            {s.icon && <span className="stat-icon" style={{ background: s.color + "20", color: s.color }}>{s.icon}</span>}
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
                            {b.icon && <span className="feature-icon">{b.icon}</span>}
                            <p className="feature-label">{b.label}</p>
                            <p className="feature-desc">{b.desc}</p>
                        </button>
                    ))}
                </section>

                <ProgressTracker user={user} />
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