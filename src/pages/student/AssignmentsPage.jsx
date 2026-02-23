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
        const [aRes, sRes] = await Promise.all([
            assignmentsAPI.getAll(),
            submissionsAPI.getAll()
        ]);
        setAssignments(aRes.data || []);
        setSubmissions(sRes.data || []);
        setIsLoading(false);
    };

    const handleHandIn = async (assignmentId) => {
        const studentEmail = user?.email || "student@example.com";
        const fileName = `submission_${assignmentId}_${Date.now()}.pdf`;

        const submission = {
            assignmentId,
            studentEmail,
            fileName,
        };

        const res = await submissionsAPI.submit(submission);
        setSubmissions(prev => [res.data, ...prev]);
        alert("Assignment handed in successfully!");
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
                                const isSubmitted = submissions.some(s => s.assignmentId === a.id && s.studentEmail === user?.email);
                                return (
                                    <div className="note-card" key={a.id} style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <p className="note-title">{a.title}</p>
                                            <p className="note-meta">{a.subject} · Due: {a.deadline}</p>
                                            {a.desc && <p className="asgn-inline-desc">{a.desc}</p>}
                                        </div>
                                        {isSubmitted ? (
                                            <span className="badge badge-green">Submitted</span>
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
