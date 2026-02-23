import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { attendanceAPI, assignmentsAPI, submissionsAPI, subjectsAPI } from "../services/api";
import StudentSidebar from "../components/student/StudentSidebar";
import StudentHeader from "../components/student/StudentHeader";
import ProfileModal from "../components/ProfileModal";
import SubjectSelectionModal from "../components/student/SubjectSelectionModal";
import "./Dashboard.css";

const featureBoxes = [
    { key: "subjects", icon: "", label: "Subjects", path: "/student/subjects", color: "#2563eb", desc: "Enrolled courses" },
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
        { icon: "📊", label: "Attendance", value: "—", color: "#2563eb" },
        { icon: "📚", label: "Subjects", value: "—", color: "#059669" },
        { icon: "✅", label: "Submitted", value: "—", color: "#2563eb" },
        { icon: "⏳", label: "Tasks Due", value: "—", color: "#d97706" },
    ]);
    const [recentGrades, setRecentGrades] = useState([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [attRes, subRes, asgRes, submsRes] = await Promise.all([
                attendanceAPI.getMy(),
                subjectsAPI.getAll(),
                assignmentsAPI.getAll(),
                submissionsAPI.getAll()
            ]);

            const attendance = attRes.data || {};
            const subjects = subRes.data || [];
            const assignments = asgRes.data || [];
            const submissions = submsRes.data || [];

            // Calculate overall attendance % from summary
            const summaryArr = attendance.summary || [];
            let totalClasses = 0;
            let totalPresent = 0;
            summaryArr.forEach(s => {
                totalClasses += s.total || 0;
                totalPresent += s.present || 0;
            });
            const attPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

            // Tasks due = assignments without a submission and not past due
            const submittedIds = new Set(submissions.map(s => s.assignment_id));
            const tasksDue = assignments.filter(a =>
                !submittedIds.has(a.id) && new Date(a.due_date) >= new Date()
            ).length;

            // Recent graded submissions
            const graded = submissions
                .filter(s => s.status === "graded")
                .slice(0, 5)
                .map(s => {
                    const asg = assignments.find(a => a.id === s.assignment_id);
                    return {
                        title: asg?.title || "Assignment",
                        marks: s.marks,
                        maxMarks: asg?.max_marks || 100,
                        feedback: s.feedback
                    };
                });
            setRecentGrades(graded);

            setStats([
                { icon: "📊", label: "Attendance", value: `${attPct}%`, color: "#2563eb" },
                { icon: "📚", label: "Subjects", value: String(subjects.length), color: "#059669" },
                { icon: "✅", label: "Submitted", value: String(submissions.length), color: "#2563eb" },
                { icon: "⏳", label: "Tasks Due", value: String(tasksDue), color: "#d97706" },
            ]);
        } catch (err) {
            console.error("Failed to load dashboard stats:", err);
        }
    };

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

                {/* Recent Grades Section */}
                {recentGrades.length > 0 && (
                    <div className="box-content" style={{ marginTop: "1.5rem" }}>
                        <h3>Recent Grades</h3>
                        {recentGrades.map((g, i) => (
                            <div key={i} className="review-item" style={{ padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6" }}>
                                <p style={{ margin: 0 }}>
                                    <strong>{g.title}:</strong> {g.marks}/{g.maxMarks}
                                    {g.feedback && <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>— {g.feedback}</span>}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
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