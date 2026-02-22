import { useState, useEffect } from "react";
import { notesAPI } from "../../services/api";

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [fileName, setFileName] = useState("");

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        const res = await notesAPI.getAll();
        setNotes(res.data || []);
        setIsLoading(false);
    };

    const handleUpload = async () => {
        if (!title || !subject) return alert("Please fill title and subject");
        const newNote = {
            title,
            subject,
            date: new Date().toISOString().split("T")[0],
        };
        const res = await notesAPI.create(newNote);
        setNotes((n) => [res.data, ...n]);
        setTitle(""); setSubject(""); setFileName("");
    };

    const handleDelete = async (id) => {
        await notesAPI.delete(id);
        setNotes((prev) => prev.filter((x) => x.id !== id));
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
                    <input
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>
                <label className="file-label">
                    {fileName || "Choose File"}
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
                            <p className="note-meta">{n.subject} · {n.date}</p>
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
