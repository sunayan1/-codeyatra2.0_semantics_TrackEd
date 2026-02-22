import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { assignmentsAPI, submissionsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const StudentAssignmentsPage = () => {
    const { user, logout } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [aRes, sRes] = await Promise.all([
                assignmentsAPI.getAll(),
                submissionsAPI.getMine()
            ]);
            setAssignments(aRes.data || []);
            setSubmissions(sRes.data || []);
        } catch (err) {
            console.error("Failed to load assignments:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHandIn = async (assignmentId) => {
        try {
            const fileName = `submission_${Date.now()}.pdf`;
            const res = await submissionsAPI.submit(assignmentId, {
                file_url: fileName,
            });
            if (res.data) {
                setSubmissions(prev => [res.data, ...prev]);
                alert("Assignment handed in successfully!");
            }
        } catch (err) {
            alert("Failed to submit: " + err.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString();
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

                <div className="box-content" style={{ marginTop: '2rem' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Track and submit your work:</p>
                    {isLoading ? (
                        <p>Loading assignments...</p>
                    ) : assignments.length === 0 ? (
                        <p className="empty">No assignments set yet.</p>
                    ) : (
                        <div className="assignments-list">
                            {assignments.map((a) => {
                                const isSubmitted = submissions.some(
                                    s => s.assignment_id === a.id
                                );
                                const isPastDue = new Date(a.due_date) < new Date();
                                return (
                                    <div className="note-card" key={a.id} style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <p className="note-title">{a.title}</p>
                                            <p className="note-meta">
                                                {a.subject} · Due: {formatDate(a.due_date)}
                                            </p>
                                            {a.description && <p className="asgn-inline-desc">{a.description}</p>}
                                        </div>
                                        {isSubmitted ? (
                                            <span className="badge badge-green">Submitted</span>
                                        ) : isPastDue ? (
                                            <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>Past Due</span>
                                        ) : (
                                            <button className="badge badge-purple" onClick={() => handleHandIn(a.id)}>Hand In Work</button>
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
