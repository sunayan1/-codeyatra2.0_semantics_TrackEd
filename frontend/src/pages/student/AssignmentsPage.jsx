import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { assignmentsAPI, submissionsAPI, subjectsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const StudentAssignmentsPage = () => {
    const { user, logout } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [uploading, setUploading] = useState(null);
    const fileInputRefs = useRef({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [aRes, sRes, subRes] = await Promise.all([
                assignmentsAPI.getAll(),
                submissionsAPI.getAll(),
                subjectsAPI.getAll()
            ]);
            setAssignments(aRes.data || []);
            setSubmissions(sRes.data || []);
            setSubjects(subRes.data || []);
        } catch (err) {
            console.error("Failed to load assignments data:", err);
        }
        setIsLoading(false);
    };

    const getSubjectTitle = (subjectId) => {
        const sub = subjects.find(s => s.id === subjectId);
        return sub ? sub.title : "Unknown Subject";
    };

    const getSubmission = (assignmentId) =>
        submissions.find(s => s.assignment_id === assignmentId);

    const handleFileSelect = (assignmentId) => {
        if (fileInputRefs.current[assignmentId]) {
            fileInputRefs.current[assignmentId].click();
        }
    };

    const handleFileUpload = async (assignmentId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(assignmentId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await assignmentsAPI.submit(assignmentId, formData);
            setSubmissions(prev => [res.data, ...prev]);
            alert("Assignment submitted successfully!");
        } catch (err) {
            alert(err.message || "Failed to submit assignment");
        }
        setUploading(null);
        e.target.value = "";
    };

    const isPastDue = (dueDate) => new Date(dueDate) < new Date();

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />
            <main className="main">
                <StudentHeader
                    title="Assignments"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="box-content" style={{ marginTop: "2rem" }}>
                    <p style={{ marginBottom: "1.5rem", color: "#6b7280" }}>Track and submit your work:</p>
                    {isLoading ? (
                        <p>Loading assignments...</p>
                    ) : assignments.length === 0 ? (
                        <p className="empty">No assignments set yet.</p>
                    ) : (
                        <div className="assignments-list">
                            {assignments.map((a) => {
                                const sub = getSubmission(a.id);
                                const pastDue = isPastDue(a.due_date);
                                const isUploading = uploading === a.id;

                                return (
                                    <div
                                        className="note-card"
                                        key={a.id}
                                        style={{
                                            marginBottom: "1.25rem",
                                            flexDirection: "column",
                                            gap: "0.75rem"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ flex: 1 }}>
                                                <p className="note-title">{a.title}</p>
                                                <p className="note-meta">
                                                    {getSubjectTitle(a.subject_id)} · Due: {formatDate(a.due_date)}
                                                    {a.max_marks ? ` · Max: ${a.max_marks} marks` : ""}
                                                </p>
                                                {a.description && (
                                                    <p className="asgn-inline-desc" style={{ marginTop: "0.25rem" }}>
                                                        {a.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                {sub ? (
                                                    <span
                                                        className={`badge ${sub.status === "graded" ? "badge-green" : "badge-purple"}`}
                                                    >
                                                        {sub.status === "graded" ? "Graded" : "Submitted"}
                                                    </span>
                                                ) : pastDue ? (
                                                    <span className="badge" style={{ background: "#ef4444", color: "#fff" }}>
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            ref={el => (fileInputRefs.current[a.id] = el)}
                                                            style={{ display: "none" }}
                                                            onChange={(e) => handleFileUpload(a.id, e)}
                                                        />
                                                        <button
                                                            className="badge badge-purple"
                                                            onClick={() => handleFileSelect(a.id)}
                                                            disabled={isUploading}
                                                            style={{ cursor: isUploading ? "wait" : "pointer" }}
                                                        >
                                                            {isUploading ? "Uploading..." : "Submit File"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Show grading feedback if graded */}
                                        {sub && sub.status === "graded" && (
                                            <div
                                                style={{
                                                    background: "#f0fdf4",
                                                    borderRadius: "8px",
                                                    padding: "0.75rem 1rem",
                                                    borderLeft: "3px solid #22c55e"
                                                }}
                                            >
                                                <p style={{ fontWeight: 600, color: "#166534", margin: 0 }}>
                                                    Marks: {sub.marks}{a.max_marks ? ` / ${a.max_marks}` : ""}
                                                </p>
                                                {sub.feedback && (
                                                    <p style={{ color: "#15803d", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                                                        Feedback: {sub.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Show submitted timestamp */}
                                        {sub && (
                                            <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0 }}>
                                                Submitted on {formatDate(sub.submitted_at)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
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

export default StudentAssignmentsPage;
