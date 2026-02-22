import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { notesAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const StudentNotesPage = () => {
    const { user, logout } = useAuth();
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setIsLoading(true);
        try {
            const res = await notesAPI.getAll();
            setNotes(res.data || []);
        } catch (err) {
            console.error("Failed to load notes:", err);
        } finally {
            setIsLoading(false);
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
                    title="Study Notes"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="box-content" style={{ marginTop: '2rem' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Notes shared by your teachers:</p>
                    {isLoading ? (
                        <p>Loading notes...</p>
                    ) : notes.length === 0 ? (
                        <p className="empty">No notes shared yet.</p>
                    ) : (
                        <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {notes.map((n) => (
                                <div className="note-card" key={n.id}>
                                    <div>
                                        <p className="note-title">{n.title}</p>
                                        <p className="note-meta">{n.subject} · {formatDate(n.created_at)}</p>
                                    </div>
                                    {n.content_url ? (
                                        <a href={n.content_url} target="_blank" rel="noopener noreferrer" className="badge badge-purple">
                                            View Note
                                        </a>
                                    ) : (
                                        <span className="badge badge-purple">View Note</span>
                                    )}
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

export default StudentNotesPage;
