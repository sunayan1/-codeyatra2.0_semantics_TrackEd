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
        const res = await notesAPI.getAll();
        setNotes(res.data || []);
        setIsLoading(false);
    };

    // Convert Base64 Data URL to a Blob and open in a new tab
    const handleView = (note) => {
        if (!note.file_url) {
            alert("No file attached to this note.");
            return;
        }
        try {
            // If it's a plain URL (http/https), open directly
            if (note.file_url.startsWith('http')) {
                window.open(note.file_url, '_blank');
                return;
            }
            // Otherwise treat as Base64 Data URL
            const arr = note.file_url.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            const newTab = window.open(blobUrl, '_blank');
            if (!newTab) alert("Please allow popups to view files.");
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (e) {
            console.error("Error opening file:", e);
            alert("Could not open file. It may be corrupted.");
        }
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
                                        <p className="note-meta">{n.subject} · {n.date}</p>
                                    </div>
                                    <button
                                        className="badge badge-purple"
                                        onClick={() => handleView(n)}
                                        style={{ cursor: 'pointer', border: 'none' }}
                                        title={n.file_url ? 'Click to open PDF' : 'No file attached'}
                                    >
                                        {n.file_url ? '📄 View Note' : '⚠️ No File'}
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

export default StudentNotesPage;
