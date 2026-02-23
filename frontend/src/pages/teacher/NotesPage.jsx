import { useState, useEffect } from "react";
import { notesAPI, quizAPI, subjectsAPI } from "../../services/api";
import "../style/Quiz.css";

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(""); // '', 'uploading', 'generating', 'done', 'error'
    const [quizStatus, setQuizStatus] = useState({});  // noteId -> 'done' | 'generating' | 'error'
    const [quizzes, setQuizzes] = useState({});         // noteId -> quiz

    useEffect(() => {
        loadSubjects();
        loadNotes();
    }, []);

    const loadSubjects = async () => {
        try {
            const res = await subjectsAPI.getAll();
            const list = res.data?.data || res.data || [];
            setSubjects(list);
            if (list.length > 0 && !subjectId) setSubjectId(list[0].id);
        } catch (_) {}
    };

    const loadNotes = async () => {
        const res = await notesAPI.getAll();
        const list = res.data?.data || res.data || [];
        setNotes(list);
        setIsLoading(false);

        // Load existing quizzes for each note
        for (const note of list) {
            try {
                const qRes = await quizAPI.getByNote(note.id);
                const quizList = qRes.data?.data || qRes.data || [];
                if (quizList.length > 0) {
                    setQuizzes(prev => ({ ...prev, [note.id]: quizList[0] }));
                    setQuizStatus(prev => ({ ...prev, [note.id]: 'done' }));
                }
            } catch (_) {}
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
        if (isPdf) {
            setPdfFile(file);
        } else {
            alert("Please select a PDF file");
            e.target.value = "";
        }
    };

    const handleUpload = async () => {
        if (!title) return alert("Please enter a note title");
        if (!subjectId) return alert("Please select a subject");
        if (!pdfFile) return alert("Please select a PDF file");

        setUploading(true);
        setUploadStatus("uploading");

        try {
            const formData = new FormData();
            formData.append("pdf", pdfFile);
            formData.append("title", title);
            formData.append("subject_id", subjectId);

            setUploadStatus("generating");
            const res = await notesAPI.uploadWithQuiz(formData);

            if (res.data?.success) {
                const { note, quiz, quizGenerated } = res.data.data;
                setNotes(prev => [note, ...prev]);
                if (quizGenerated && quiz) {
                    setQuizzes(prev => ({ ...prev, [note.id]: quiz }));
                    setQuizStatus(prev => ({ ...prev, [note.id]: 'done' }));
                }
                setUploadStatus("done");
                setTitle("");
                setPdfFile(null);
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = "";

                setTimeout(() => setUploadStatus(""), 3000);
            } else {
                setUploadStatus("error");
            }
        } catch (err) {
            console.error("Upload error:", err);
            setUploadStatus("error");
            alert(err.message || "Upload failed");
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        await notesAPI.delete(id);
        setNotes(prev => prev.filter(x => x.id !== id));
    };

    const handleDeleteQuiz = async (quizId, noteId) => {
        try {
            await quizAPI.delete(quizId);
            setQuizzes(prev => { const c = { ...prev }; delete c[noteId]; return c; });
            setQuizStatus(prev => { const c = { ...prev }; delete c[noteId]; return c; });
        } catch (err) {
            alert("Failed to delete quiz");
        }
    };

    const handleRegenerateQuiz = async (noteId) => {
        setQuizStatus(prev => ({ ...prev, [noteId]: 'generating' }));
        try {
            // Delete old quiz first
            if (quizzes[noteId]) {
                await quizAPI.delete(quizzes[noteId].id);
            }
            // Send note_id to backend — it will fetch the PDF from storage and parse it via AI
            const res = await quizAPI.generate({ note_id: noteId, num_questions: 20 });
            if (res.data?.success) {
                setQuizzes(prev => ({ ...prev, [noteId]: res.data.data }));
                setQuizStatus(prev => ({ ...prev, [noteId]: 'done' }));
            } else {
                setQuizStatus(prev => ({ ...prev, [noteId]: 'error' }));
            }
        } catch (err) {
            console.error('Quiz regeneration failed:', err);
            setQuizStatus(prev => ({ ...prev, [noteId]: 'error' }));
        }
    };

    const getSubjectName = (sid) => {
        const s = subjects.find(x => x.id === sid);
        return s?.title || '';
    };

    return (
        <div className="sub-page">
            <div className="form-card">
                <h3>Upload New Note (PDF)</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                    Upload a PDF and a 20-question quiz will be auto-generated using AI
                </p>
                <div className="form-row">
                    <input
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
                <label className="file-label" style={{ cursor: 'pointer' }}>
                    {pdfFile ? pdfFile.name : "Choose PDF File"}
                    <input
                        type="file"
                        accept=".pdf"
                        hidden
                        onChange={handleFileChange}
                    />
                </label>

                {uploadStatus === "generating" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#818cf8' }}>Uploading PDF & generating 20-question quiz with AI...</span>
                    </div>
                )}
                {uploadStatus === "done" && (
                    <p style={{ fontSize: '0.85rem', color: '#22c55e', marginTop: '0.5rem' }}>
                        Note uploaded & quiz generated successfully!
                    </p>
                )}
                {uploadStatus === "error" && (
                    <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
                        Upload failed. Please try again.
                    </p>
                )}

                <button
                    className="save-btn"
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{ opacity: uploading ? 0.6 : 1 }}
                >
                    {uploading ? "Uploading & Generating Quiz..." : "Upload Note & Generate Quiz"}
                </button>
            </div>

            <div className="notes-list">
                {isLoading ? <p>Loading notes...</p> : notes.length === 0 ? <p>No notes uploaded yet.</p> : notes.map((n) => (
                    <div className="note-card" key={n.id}>
                        <div style={{ flex: 1 }}>
                            <p className="note-title">{n.title}</p>
                            <p className="note-meta">{n.subject || getSubjectName(n.subject_id)} · {n.date || new Date(n.created_at).toLocaleDateString()}</p>
                            {n.content_url && (
                                <a href={n.content_url} target="_blank" rel="noreferrer"
                                    style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'underline' }}>
                                    View PDF
                                </a>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {quizStatus[n.id] === 'generating' && (
                                    <span className="quiz-badge">Generating Quiz...</span>
                                )}
                                {quizStatus[n.id] === 'done' && quizzes[n.id] && (
                                    <>
                                        <span className="quiz-badge completed">
                                            Quiz Ready ({quizzes[n.id].questions?.length || 0} Questions)
                                        </span>
                                        <span
                                            className="quiz-badge"
                                            style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}
                                            onClick={() => handleDeleteQuiz(quizzes[n.id].id, n.id)}
                                        >
                                            Delete Quiz
                                        </span>
                                    </>
                                )}
                                {quizStatus[n.id] === 'error' && (
                                    <span className="quiz-badge" style={{ color: '#f87171' }}>Quiz generation failed</span>
                                )}
                                {!quizStatus[n.id] && (
                                    <span
                                        className="quiz-badge"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleRegenerateQuiz(n.id)}
                                    >
                                        Generate Quiz
                                    </span>
                                )}
                            </div>
                        </div>
                        <button className="del-btn" onClick={() => handleDelete(n.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotesPage;
