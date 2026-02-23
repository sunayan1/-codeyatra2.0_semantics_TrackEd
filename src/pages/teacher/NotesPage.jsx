import { useState, useEffect, useRef } from "react";
import { notesAPI } from "../../services/api";

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileData, setFileData] = useState(null); // Base64 Data URL
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        const res = await notesAPI.getAll();
        setNotes(res.data || []);
        setIsLoading(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large. Maximum size is 10MB.");
            return;
        }
        setFileName(file.name);
        // Read file as Base64 so it can be stored and later retrieved by students
        const reader = new FileReader();
        reader.onloadend = () => setFileData(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!title || !subject) return alert("Please fill title and subject");
        if (!fileData) return alert("Please select a PDF or file to upload");
        const newNote = {
            title,
            subject,
            date: new Date().toISOString().split("T")[0],
            file_url: fileData, // ✅ Actual file content stored as Base64
        };
        const res = await notesAPI.create(newNote);
        setNotes((n) => [res.data, ...n]);
        setTitle(""); setSubject(""); setFileName(""); setFileData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                    {fileName || "Choose PDF / File"}
                    <input
                        type="file"
                        hidden
                        accept=".pdf,image/*,.txt,.doc,.docx"
                        ref={fileInputRef}
                        onChange={handleFileChange}
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
