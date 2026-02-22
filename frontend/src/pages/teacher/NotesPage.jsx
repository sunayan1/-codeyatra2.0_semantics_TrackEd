import { useState, useEffect } from "react";
import { notesAPI, subjectsAPI } from "../../services/api";

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [fileName, setFileName] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [notesRes, subjectsRes] = await Promise.all([
                notesAPI.getAll(),
                subjectsAPI.getAll()
            ]);
            setNotes(notesRes.data || []);
            setSubjects(subjectsRes.data || []);
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!title || !subjectId) return alert("Please fill title and select a subject");
        const newNote = {
            title,
            subject_id: subjectId,
            content_url: fileName || null,
        };
        try {
            const res = await notesAPI.create(newNote);
            if (res.data) {
                // Enrich with subject name for display
                const subject = subjects.find(s => s.id === subjectId);
                const enriched = { ...res.data, subject: subject?.title || '' };
                setNotes((n) => [enriched, ...n]);
                setTitle("");
                setSubjectId("");
                setFileName("");
            }
        } catch (err) {
            alert("Failed to upload note: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notesAPI.delete(id);
            setNotes((prev) => prev.filter((x) => x.id !== id));
        } catch (err) {
            alert("Failed to delete: " + err.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="sub-page">
            <div className="form-card">
                <h3>Upload New Note</h3>
                <div className="form-row">
                    <input
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
                <label className="file-label">
                    {fileName || "Choose File (optional)"}
                    <input
                        type="file"
                        hidden
                        onChange={(e) => setFileName(e.target.files[0]?.name || "")}
                    />
                </label>
                <button className="save-btn" onClick={handleUpload}>Upload Note</button>
            </div>

            <div className="notes-list">
                {isLoading ? <p>Loading notes...</p> : notes.length === 0 ? <p>No notes uploaded yet.</p> : notes.map((n) => (
                    <div className="note-card" key={n.id}>
                        <div>
                            <p className="note-title">{n.title}</p>
                            <p className="note-meta">{n.subject} · {formatDate(n.created_at)}</p>
                        </div>
                        <button
                            className="del-btn"
                            onClick={() => handleDelete(n.id)}
                        >Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotesPage;
