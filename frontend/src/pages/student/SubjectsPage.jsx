import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { subjectsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const SubjectsPage = () => {
    const { user, logout } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const res = await subjectsAPI.getAll();
            setSubjects(res.data || []);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        } finally {
            setIsLoading(false);
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
                    {isLoading ? (
                        <p>Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                        <p className="empty">You are not enrolled in any subjects yet.</p>
                    ) : (
                        <ul className="subject-list">
                            {subjects.map((s) => (
                                <li key={s.id} className="note-card" style={{ padding: '1.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{s.title}</span>
                                        {s.description && (
                                            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                                                {s.description}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
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
