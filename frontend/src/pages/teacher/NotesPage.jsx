import { useState, useEffect, useRef } from "react";
import { notesAPI, attendanceAPI } from "../../services/api";

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileData, setFileData] = useState(null); // Base64 Data URL
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [notesRes, subjectsRes] = await Promise.all([
                notesAPI.getAll(),
                attendanceAPI.getSubjects() // Reuse this to get teacher's subjects
            ]);
            setNotes(notesRes.data?.data || notesRes.data || []);
            setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
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
        if (!title || !selectedSubjectId) return alert("Please fill title and select a subject");
        if (!fileData) return alert("Please select a PDF or file to upload");

        const newNote = {
            title,
            subject_id: selectedSubjectId,
            content_url: fileData, // ✅ Actual file content stored as Base64
        };

        try {
            const res = await notesAPI.create(newNote);
            const createdNote = res.data?.data || res.data;
            setNotes((n) => [createdNote, ...n]);
            setTitle(""); setSelectedSubjectId(""); setFileName(""); setFileData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload note.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await notesAPI.delete(id);
            setNotes((prev) => prev.filter((x) => x.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
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
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="subject-select"
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
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
                            <p className="note-meta">{n.subject} · {new Date(n.created_at || n.date).toLocaleDateString()}</p>
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

