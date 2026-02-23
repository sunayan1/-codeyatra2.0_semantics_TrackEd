import { useEffect, useState } from "react";
import { notesAPI } from "../services/api";
import "./style/Bookshelf.css";

const BookshelfModal = ({ onClose }) => {
    const [ownNotes, setOwnNotes] = useState([]);
    const [sharedNotes, setSharedNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState("mine"); // "mine" | "shared"

    useEffect(() => {
        loadBookshelf();
    }, []);

    const loadBookshelf = async () => {
        try {
            const res = await notesAPI.getBookshelf();
            const data = res.data || {};
            setOwnNotes(data.own || []);
            setSharedNotes(data.shared || []);
        } catch (err) {
            console.error("Error loading bookshelf:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleShare = async (studentNoteId) => {
        try {
            const res = await notesAPI.toggleShareStudentNote(studentNoteId);
            setOwnNotes(prev =>
                prev.map(n => n.id === studentNoteId ? { ...n, shared: res.data.shared } : n)
            );
        } catch (err) {
            alert("Failed to toggle sharing");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    const renderNoteCard = (note, isOwn) => (
        <div key={note.id} className="file-card" style={{ flexDirection: "column", gap: "0.5rem" }}>
            <div className="file-info" style={{ width: "100%" }}>
                <span className="file-name" style={{ fontWeight: 600 }}>
                    {note.notes?.title || "Untitled Note"}
                </span>
                <span className="file-date">{formatDate(note.created_at)}</span>
            </div>

            {note.private_comment && (
                <p style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#374151",
                    background: "#f9fafb",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    width: "100%",
                    boxSizing: "border-box"
                }}>
                    {note.private_comment}
                </p>
            )}

            {!isOwn && note.shared_by && (
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
                    Shared by: {note.shared_by}
                </p>
            )}

            {isOwn && (
                <button
                    onClick={() => handleToggleShare(note.id)}
                    style={{
                        alignSelf: "flex-start",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        background: note.shared ? "#dcfce7" : "#f3f4f6",
                        color: note.shared ? "#166534" : "#6b7280"
                    }}
                >
                    {note.shared ? "Shared ✓" : "Share"}
                </button>
            )}
        </div>
    );

    const displayNotes = tab === "mine" ? ownNotes : sharedNotes;

    return (
        <div className="bookshelf-overlay">
            <div className="bookshelf-modal">
                <header>
                    <h2>📚 My Bookshelf</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <button
                        onClick={() => setTab("mine")}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            background: tab === "mine" ? "#2563eb" : "#f3f4f6",
                            color: tab === "mine" ? "#fff" : "#374151"
                        }}
                    >
                        My Comments ({ownNotes.length})
                    </button>
                    <button
                        onClick={() => setTab("shared")}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            background: tab === "shared" ? "#2563eb" : "#f3f4f6",
                            color: tab === "shared" ? "#fff" : "#374151"
                        }}
                    >
                        Shared With Me ({sharedNotes.length})
                    </button>
                </div>

                <div className="file-grid">
                    {isLoading ? (
                        <p className="empty">Loading bookshelf...</p>
                    ) : displayNotes.length === 0 ? (
                        <p className="empty">
                            {tab === "mine"
                                ? "No comments yet. Add comments on notes to see them here 📖"
                                : "No shared comments from classmates yet."}
                        </p>
                    ) : (
                        displayNotes.map(note => renderNoteCard(note, tab === "mine"))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookshelfModal;
