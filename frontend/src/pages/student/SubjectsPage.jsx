import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { subjectsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const SubjectsPage = () => {
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
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
                        <ul className="subject-list" style={{ listStyle: 'none', padding: 0 }}>
                            {subjects.map((s) => (
                                <li key={s.id} className="note-card" style={{ padding: '1.5rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{s.title}</span>
                                            {s.description && <p className="note-meta" style={{ margin: '0.25rem 0' }}>{s.description}</p>}
                                            <p className="note-meta" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                {s.faculty && <span style={{ marginRight: '1rem' }}>Faculty: {s.faculty}</span>}
                                                {s.semester && <span style={{ marginRight: '1rem' }}>Semester {s.semester}</span>}
                                                {s.teacher_name && <span>Teacher: {s.teacher_name}</span>}
                                            </p>
                                        </div>
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
