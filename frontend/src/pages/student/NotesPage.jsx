// pages/student/StudentNotesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { notesAPI } from "../../services/api";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import QuizModal from "../../components/student/QuizModal";
import "../Dashboard.css";
import "../style/Notes.css";

// Point pdf.js worker to the bundled version (must match installed pdfjs-dist version)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const StudentNotesPage = () => {
    const { user, logout } = useAuth();
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    // PDF viewer state
    const [activeNote, setActiveNote] = useState(null);
    const [pdfPages, setPdfPages] = useState([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [extractedText, setExtractedText] = useState("");
    const [hasReadAll, setHasReadAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    // Quiz state
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);

    const canvasRefs = useRef([]);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setIsLoading(true);
        try {
            const extract = (res) => {
                if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
                if (res?.data && Array.isArray(res.data)) return res.data;
                return [];
            };
            const res = await notesAPI.getAll();
            setNotes(extract(res));
        } catch (error) {
            console.error("Error loading notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load and render PDF from a URL or base64 data URL
    const openNote = async (note) => {
        setActiveNote(note);
        setPdfPages([]);
        setPdfLoading(true);
        setExtractedText("");
        setHasReadAll(false);
        setCurrentPage(0);
        setQuizQuestions(null);

        const fileUrl = note.content_url || note.file_url;
        if (!fileUrl) {
            setPdfLoading(false);
            return;
        }

        try {
            let pdfData;
            if (fileUrl.startsWith("http")) {
                // Fetch as arraybuffer for cross-origin PDFs
                const response = await fetch(fileUrl);
                pdfData = await response.arrayBuffer();
            } else {
                // Base64 data URL
                const base64 = fileUrl.split(",")[1];
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                pdfData = bytes.buffer;
            }

            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const pageCount = pdf.numPages;
            const pages = [];
            let fullText = "";

            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item) => item.str).join(" ");
                fullText += pageText + "\n";

                // Render to offscreen canvas, store as image data URL
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d");
                await page.render({ canvasContext: ctx, viewport }).promise;
                pages.push({ imageUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height });
            }

            setPdfPages(pages);
            setExtractedText(fullText);
        } catch (e) {
            console.error("Error loading PDF:", e);
        } finally {
            setPdfLoading(false);
        }
    };

    const closeViewer = () => {
        setActiveNote(null);
        setPdfPages([]);
        setExtractedText("");
        setHasReadAll(false);
        setQuizQuestions(null);
    };

    // Track scroll to determine if student has reached the last page
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const scrollPercent = (scrollTop + clientHeight) / scrollHeight;
        if (scrollPercent >= 0.92) {
            setHasReadAll(true);
        }

        // Roughly track current page for indicator
        const pageHeight = scrollHeight / pdfPages.length;
        const approxPage = Math.floor(scrollTop / pageHeight);
        setCurrentPage(Math.min(approxPage, pdfPages.length - 1));
    };

    const handleGenerateQuiz = async () => {
        if (!extractedText || !activeNote) return;
        setQuizLoading(true);
        try {
            const token = localStorage.getItem("token"); // adjust to how your app stores auth token
            const res = await axios.post(
                `/api/quiz/generate/${activeNote.id}`,
                { pdfText: extractedText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setQuizQuestions(res.data.data);
                setShowQuiz(true);
            } else {
                alert(res.data.error || "Failed to generate quiz.");
            }
        } catch (e) {
            console.error("Quiz generation error:", e);
            alert("Something went wrong generating the quiz.");
        } finally {
            setQuizLoading(false);
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

                {!activeNote ? (
                    /* ── Notes Grid ── */
                    <div className="box-content" style={{ marginTop: "2rem" }}>
                        <p style={{ marginBottom: "1.5rem", color: "#6b7280" }}>
                            Notes shared by your teachers:
                        </p>
                        {isLoading ? (
                            <p>Loading notes...</p>
                        ) : notes.length === 0 ? (
                            <p className="empty">No notes shared yet.</p>
                        ) : (
                            <div
                                className="notes-grid"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                    gap: "1rem",
                                }}
                            >
                                {notes.map((n) => (
                                    <div className="note-card" key={n.id}>
                                        <div>
                                            <p className="note-title">{n.title}</p>
                                            <p className="note-meta">
                                                {n.subject} ·{" "}
                                                {new Date(n.created_at || n.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            className="badge badge-purple"
                                            onClick={() => openNote(n)}
                                            style={{ cursor: "pointer", border: "none" }}
                                            title={
                                                n.content_url || n.file_url
                                                    ? "Click to read note"
                                                    : "No file attached"
                                            }
                                        >
                                            {n.content_url || n.file_url ? "📄 Read Note" : "⚠️ No File"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── PDF Viewer ── */
                    <div className="pdf-viewer-wrapper">
                        <div className="pdf-viewer-header">
                            <button className="back-btn" onClick={closeViewer}>
                                ← Back to Notes
                            </button>
                            <div className="pdf-viewer-title">
                                <h2>{activeNote.title}</h2>
                                <span className="pdf-subject-badge">{activeNote.subject}</span>
                            </div>
                            <div className="pdf-actions">
                                {pdfPages.length > 0 && (
                                    <span className="page-indicator">
                                        Page {currentPage + 1} / {pdfPages.length}
                                    </span>
                                )}
                                <button
                                    className={`generate-quiz-btn ${!hasReadAll ? "disabled" : ""} ${quizLoading ? "loading" : ""}`}
                                    onClick={handleGenerateQuiz}
                                    disabled={!hasReadAll || quizLoading}
                                    title={!hasReadAll ? "Read the entire note to unlock quiz" : "Generate a quiz from this note"}
                                >
                                    {quizLoading ? (
                                        <>
                                            <span className="spinner" /> Generating…
                                        </>
                                    ) : (
                                        <>✨ Generate Quiz</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!hasReadAll && pdfPages.length > 0 && (
                            <div className="read-prompt">
                                📖 Scroll through the entire note to unlock the quiz generator
                            </div>
                        )}

                        <div className="pdf-scroll-area" onScroll={handleScroll}>
                            {pdfLoading ? (
                                <div className="pdf-loading">
                                    <div className="spinner large" />
                                    <p>Loading PDF…</p>
                                </div>
                            ) : pdfPages.length === 0 ? (
                                <p style={{ padding: "2rem", color: "#6b7280" }}>
                                    No PDF content found for this note.
                                </p>
                            ) : (
                                pdfPages.map((page, idx) => (
                                    <div key={idx} className="pdf-page">
                                        <img
                                            src={page.imageUrl}
                                            alt={`Page ${idx + 1}`}
                                            style={{ width: "100%", display: "block" }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showProfile && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfile(false)}
                    onLogout={logout}
                />
            )}

            {showQuiz && quizQuestions && (
                <QuizModal
                    questions={quizQuestions}
                    noteTitle={activeNote?.title}
                    onClose={() => setShowQuiz(false)}
                />
            )}
        </div>
    );
};

export default StudentNotesPage;
