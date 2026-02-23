import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { assignmentsAPI, submissionsAPI } from "../../services/api";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const StudentAssignmentsPage = () => {
    const { user, logout } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    // Per-assignment upload state: { [assignmentId]: { fileName, fileData } }
    const [uploadState, setUploadState] = useState({});
    const fileInputRefs = useRef({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [aRes, sRes] = await Promise.all([
            assignmentsAPI.getAll(),
            submissionsAPI.getAll()
        ]);
        setAssignments(aRes.data || []);
        setSubmissions(sRes.data || []);
        setIsLoading(false);
    };

    // When student picks a file for a specific assignment
    const handleFileChange = (assignmentId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large. Maximum size is 10MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadState(prev => ({
                ...prev,
                [assignmentId]: { fileName: file.name, fileData: reader.result }
            }));
        };
        reader.readAsDataURL(file);
    };

    // Submit the assignment — file is REQUIRED
    const handleHandIn = async (assignmentId) => {
        const upload = uploadState[assignmentId];

        if (!upload || !upload.fileData) {
            alert("⚠️ Please attach a PDF or image before handing in.");
            return;
        }

        const studentEmail = user?.email || "student@example.com";

        const submission = {
            assignmentId,
            studentEmail,
            fileName: upload.fileName,
            file_url: upload.fileData,  // ✅ actual Base64 file
        };

        const res = await submissionsAPI.submit(submission);
        setSubmissions(prev => [res.data, ...prev]);

        // Clear upload state for this assignment after success
        setUploadState(prev => {
            const next = { ...prev };
            delete next[assignmentId];
            return next;
        });
        if (fileInputRefs.current[assignmentId]) {
            fileInputRefs.current[assignmentId].value = "";
        }

        alert("✅ Assignment handed in successfully!");
    };

    // Open a Base64 or plain URL file in a new tab
    const handleViewFile = (fileUrl) => {
        if (!fileUrl) return;
        if (fileUrl.startsWith("http")) {
            window.open(fileUrl, "_blank");
            return;
        }
        try {
            const arr = fileUrl.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            const newTab = window.open(blobUrl, "_blank");
            if (!newTab) alert("Please allow popups to view files.");
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (e) {
            console.error("Error opening file:", e);
            alert("Could not open file.");
        }
    };

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />
            <main className="main">
                <StudentHeader
                    title="Assignments"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="box-content" style={{ marginTop: "2rem" }}>
                    <p style={{ marginBottom: "1.5rem", color: "#6b7280" }}>
                        Track and submit your work:
                    </p>

                    {isLoading ? (
                        <p>Loading assignments...</p>
                    ) : assignments.length === 0 ? (
                        <p className="empty">No assignments set yet.</p>
                    ) : (
                        <div className="assignments-list">
                            {assignments.map((a) => {
                                const isSubmitted = submissions.some(
                                    s => s.assignmentId === a.id && s.studentEmail === user?.email
                                );
                                const upload = uploadState[a.id] || {};

                                return (
                                    <div
                                        className="note-card"
                                        key={a.id}
                                        style={{ marginBottom: "1.25rem", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}
                                    >
                                        {/* Assignment info row */}
                                        <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: "1rem" }}>
                                            <div style={{ flex: 1 }}>
                                                <p className="note-title">{a.title}</p>
                                                <p className="note-meta">{a.subject} · Due: {a.deadline}</p>
                                                {a.desc && <p className="asgn-inline-desc">{a.desc}</p>}
                                            </div>

                                            {/* Reference material button — shown only if teacher attached one */}
                                            {a.ref_url && (
                                                <button
                                                    className="badge badge-blue"
                                                    style={{ border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                                                    onClick={() => handleViewFile(a.ref_url)}
                                                    title={`View reference: ${a.ref_name || "material"}`}
                                                >
                                                    📎 View Reference
                                                </button>
                                            )}
                                        </div>

                                        {/* Submission section */}
                                        {isSubmitted ? (
                                            <span className="badge badge-green">✅ Submitted</span>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", width: "100%" }}>
                                                {/* File picker */}
                                                <label
                                                    className="file-label"
                                                    style={{ margin: 0, flex: 1, minWidth: "180px" }}
                                                >
                                                    {upload.fileName
                                                        ? `📄 ${upload.fileName}`
                                                        : "📎 Attach PDF / Image *"
                                                    }
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept=".pdf,image/*,.doc,.docx"
                                                        ref={el => { fileInputRefs.current[a.id] = el; }}
                                                        onChange={(e) => handleFileChange(a.id, e)}
                                                    />
                                                </label>

                                                {/* Hand In button — active only when file chosen */}
                                                <button
                                                    className="badge badge-purple"
                                                    style={{
                                                        border: "none",
                                                        cursor: upload.fileData ? "pointer" : "not-allowed",
                                                        opacity: upload.fileData ? 1 : 0.5,
                                                    }}
                                                    onClick={() => handleHandIn(a.id)}
                                                    title={upload.fileData ? "Hand in your work" : "Please attach a file first"}
                                                >
                                                    Hand In Work
                                                </button>
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
        </div>
    );
};

export default StudentAssignmentsPage;
