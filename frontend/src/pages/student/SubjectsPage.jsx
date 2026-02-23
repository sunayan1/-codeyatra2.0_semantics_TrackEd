import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subjectsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const SubjectsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const loadSubjects = async () => {
            setIsLoading(true);
            try {
                const res = await subjectsAPI.getMine();
                const data = res.data?.data || res.data || [];
                setSubjects(data);
            } catch (error) {
                console.error("Error loading subjects:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (user) loadSubjects();
    }, [user]);

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />
            <main className="main">
                <StudentHeader
                    title="My Subjects"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="box-content" style={{ marginTop: '2rem' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Your enrolled courses:</p>

                    {isLoading ? (
                        <p>Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                        <div className="empty-state">
                            <p>You are not enrolled in any subjects yet.</p>
                            <p className="note-meta">Please contact your teacher to enroll you.</p>
                        </div>
                    ) : (
                        <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {subjects.map((s) => (
                                <div
                                    key={s.id}
                                    className="note-card"
                                    style={{ padding: '2rem', cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start' }}
                                    onClick={() => navigate(`/student/subject/${s.id}`)}
                                >
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb' }}></div>
                                        <span className="badge badge-blue">Enrolled</span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e1b4b' }}>{s.title}</h3>
                                    <p className="note-meta" style={{ marginTop: '0.5rem' }}>{s.description || 'No description available.'}</p>

                                    <button
                                        className="save-btn"
                                        style={{ marginTop: '1.5rem', width: '100%', background: '#f5f3ff', color: '#2563eb', border: '1px solid #ddd' }}
                                    >
                                        Go to Roadmap
                                    </button>
                                </div>
                            ))}
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

export default SubjectsPage;
