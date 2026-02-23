import React, { useState, useEffect, useCallback } from "react";
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
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [enrolledRes, availableRes] = await Promise.all([
                subjectsAPI.getMine(),
                subjectsAPI.getAvailable()
            ]);

            setSubjects(enrolledRes.data?.data || enrolledRes.data || []);
            setAvailableSubjects(availableRes.data?.data || availableRes.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleEnroll = async (subjectId) => {
        setIsEnrolling(true);
        try {
            await subjectsAPI.enrollSelf({ subject_id: subjectId });
            alert("Successfully enrolled!");
            loadData(); // Refresh lists
        } catch (error) {
            console.error("Enrollment failed:", error);
            alert("Failed to enroll in subject.");
        } finally {
            setIsEnrolling(false);
        }
    };

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
                    <div className="subjects-section">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e1b4b' }}>Current Subjects</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Your enrolled courses:</p>

                        {isLoading ? (
                            <p>Loading subjects...</p>
                        ) : subjects.length === 0 ? (
                            <div className="empty-state" style={{ marginBottom: '2rem' }}>
                                <p>You are not enrolled in any subjects yet.</p>
                            </div>
                        ) : (
                            <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
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

                    <div className="subjects-section" style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e1b4b' }}>Available Subjects</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Discover and join new courses:</p>

                        {isLoading ? (
                            <p>Loading available subjects...</p>
                        ) : availableSubjects.length === 0 ? (
                            <p className="empty">No other subjects available at the moment.</p>
                        ) : (
                            <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {availableSubjects.map((s) => (
                                    <div
                                        key={s.id}
                                        className="note-card"
                                        style={{ padding: '2rem', flexDirection: 'column', alignItems: 'flex-start' }}
                                    >
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e1b4b' }}>{s.title}</h3>
                                        <p className="note-meta" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>{s.description || 'No description available.'}</p>

                                        <button
                                            className="save-btn"
                                            style={{ width: '100%', cursor: isEnrolling ? 'not-allowed' : 'pointer' }}
                                            onClick={() => handleEnroll(s.id)}
                                            disabled={isEnrolling}
                                        >
                                            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
