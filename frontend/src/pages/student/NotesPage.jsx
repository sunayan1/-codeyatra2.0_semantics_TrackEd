import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { notesAPI, quizAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import QuizModal from "../QuizModal";
import "../Dashboard.css";
import "../style/Quiz.css";

// PDF viewer with download/screenshot protection
const PdfViewerModal = ({ url, title, onClose }) => (
    <div className="quiz-modal-overlay" onClick={onClose}>
        <div
            className="quiz-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90vw', maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column' }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="quiz-modal-header">
                <h2>{title}</h2>
                <button className="quiz-close-btn" onClick={onClose}>X</button>
            </div>
            <iframe
                src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                title={title}
                style={{ flex: 1, border: 'none', borderRadius: '0 0 16px 16px', background: 'white' }}
                sandbox="allow-same-origin allow-scripts"
            />
        </div>
    </div>
);

const StudentNotesPage = () => {
    const { user, logout } = useAuth();
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [quizzes, setQuizzes] = useState({});       // noteId -> quiz[]
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [attempts, setAttempts] = useState({});      // quizId -> attempt
    const [viewingNote, setViewingNote] = useState(null);
    const [commentText, setCommentText] = useState({});
    const [studentNotes, setStudentNotes] = useState({}); // noteId -> comments[]

    useEffect(() => {
        loadNotes();
        loadAttempts();
    }, []);

    const loadNotes = async () => {
        setIsLoading(true);
        const res = await notesAPI.getAll();
        const notesList = res.data?.data || res.data || [];
        setNotes(notesList);
        setIsLoading(false);

        for (const note of notesList) {
            try {
                const qRes = await quizAPI.getByNote(note.id);
                const quizList = qRes.data?.data || qRes.data || [];
                if (quizList.length > 0) {
                    setQuizzes(prev => ({ ...prev, [note.id]: quizList }));
                }
            } catch (_) {}
        }
    };

    const loadAttempts = async () => {
        try {
            const res = await quizAPI.getMyAttempts();
            const list = res.data?.data || res.data || [];
            const map = {};
            list.forEach(a => { map[a.quiz_id] = a; });
            setAttempts(map);
        } catch (_) {}
    };

    const loadStudentNotes = async (noteId) => {
        try {
            const res = await notesAPI.getStudentNotes(noteId);
            const list = res.data?.data || res.data || [];
            setStudentNotes(prev => ({ ...prev, [noteId]: list }));
        } catch (_) {}
    };

    const handleAddComment = async (noteId) => {
        const text = commentText[noteId]?.trim();
        if (!text) return;
        try {
            await notesAPI.createStudentNote(noteId, { private_comment: text });
            setCommentText(prev => ({ ...prev, [noteId]: '' }));
            loadStudentNotes(noteId);
        } catch (err) {
            alert("Failed to save comment: " + err.message);
        }
    };

    const openQuiz = (quiz) => setActiveQuiz(quiz);

    const onQuizCompleted = (attempt) => {
        setAttempts(prev => ({ ...prev, [attempt.quiz_id]: attempt }));
    };

    // Determine if a note is unlocked based on previous note's quiz pass
    // Notes are ordered by position. First note is always unlocked.
    // To unlock note at index i, ALL quizzes on notes 0..(i-1) must be passed.
    const isNoteUnlocked = (noteIndex) => {
        if (noteIndex === 0) return true;

        // Group notes by subject
        const note = notes[noteIndex];
        const subjectNotes = notes.filter(n => n.subject_id === note.subject_id);
        const posInSubject = subjectNotes.findIndex(n => n.id === note.id);

        if (posInSubject <= 0) return true;

        // Check all previous notes in same subject
        for (let i = 0; i < posInSubject; i++) {
            const prevNote = subjectNotes[i];
            const prevQuizzes = quizzes[prevNote.id] || [];
            if (prevQuizzes.length === 0) continue; // No quiz = auto-unlock

            // Check if ANY quiz on this note is passed
            const hasPassed = prevQuizzes.some(q => {
                const attempt = attempts[q.id];
                return attempt?.passed === true;
            });
            if (!hasPassed) return false; // Previous note not passed
        }
        return true;
    };

    // Get quiz status for locking info
    const getNoteQuizStatus = (noteId) => {
        const noteQuizzes = quizzes[noteId] || [];
        if (noteQuizzes.length === 0) return null;

        for (const q of noteQuizzes) {
            const attempt = attempts[q.id];
            if (attempt?.passed) return { passed: true, score: attempt.score, total: attempt.total };
            if (attempt) return { passed: false, score: attempt.score, total: attempt.total };
        }
        return { passed: false, score: null, total: null };
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
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                        Notes shared by your teachers. Score at least 70% on each quiz to unlock the next chapter.
                    </p>
                    {isLoading ? (
                        <p>Loading notes...</p>
                    ) : notes.length === 0 ? (
                        <p className="empty">No notes shared yet.</p>
                    ) : (
                        <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {notes.map((n, idx) => {
                                const unlocked = isNoteUnlocked(idx);
                                const quizStatus = getNoteQuizStatus(n.id);

                                return (
                                    <div
                                        className="note-card"
                                        key={n.id}
                                        style={{ opacity: unlocked ? 1 : 0.5, position: 'relative' }}
                                    >
                                        <div>
                                            <p className="note-title">
                                                {n.position !== undefined && <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>Ch.{n.position}</span>}
                                                {n.title}
                                            </p>
                                            <p className="note-meta">{n.subject} · {new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>

                                        {!unlocked && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444' }}>
                                                🔒 Complete previous quiz with ≥70% to unlock
                                            </div>
                                        )}

                                        {unlocked && (
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                                {n.content_url && (
                                                    <span
                                                        className="badge badge-purple"
                                                        onClick={() => setViewingNote({ url: n.content_url, title: n.title })}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        View Note
                                                    </span>
                                                )}
                                                {quizzes[n.id]?.map((q) => {
                                                    const attempt = attempts[q.id];
                                                    return (
                                                        <span
                                                            key={q.id}
                                                            className={`quiz-badge ${attempt?.passed ? 'completed' : attempt ? '' : ''}`}
                                                            onClick={() => openQuiz(q)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {attempt ? (
                                                                <span style={{ color: attempt.passed ? '#22c55e' : '#f59e0b' }}>
                                                                    {attempt.passed ? '✓' : '✗'} {attempt.score}/{attempt.total}
                                                                </span>
                                                            ) : 'Take Quiz'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Comment section */}
                                        {unlocked && (
                                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        placeholder="Add a private comment..."
                                                        value={commentText[n.id] || ''}
                                                        onChange={(e) => setCommentText(prev => ({ ...prev, [n.id]: e.target.value }))}
                                                        style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
                                                        onFocus={() => {
                                                            if (!studentNotes[n.id]) loadStudentNotes(n.id);
                                                        }}
                                                    />
                                                    <button
                                                        className="badge badge-blue"
                                                        onClick={() => handleAddComment(n.id)}
                                                        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                                {studentNotes[n.id]?.length > 0 && (
                                                    <div style={{ marginTop: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                                                        {studentNotes[n.id].map(sn => (
                                                            <div key={sn.id} style={{ fontSize: '0.8rem', color: '#6b7280', padding: '0.25rem 0', borderBottom: '1px solid #f9fafb' }}>
                                                                {sn.private_comment}
                                                                <span style={{ marginLeft: '0.5rem', color: '#d1d5db' }}>{new Date(sn.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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

            {activeQuiz && (
                <QuizModal
                    quiz={activeQuiz}
                    onClose={() => setActiveQuiz(null)}
                    onCompleted={onQuizCompleted}
                />
            )}

            {viewingNote && (
                <PdfViewerModal
                    url={viewingNote.url}
                    title={viewingNote.title}
                    onClose={() => setViewingNote(null)}
                />
            )}
        </div>
    );
};

export default StudentNotesPage;
