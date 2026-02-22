import { useState, useEffect } from "react";
import { subjectsAPI } from "../../services/api";

const SubjectsPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ title: "", description: "" });

    // Enrollment state
    const [enrollForm, setEnrollForm] = useState({ subject_id: "", student_email: "" });
    const [enrolledStudents, setEnrolledStudents] = useState({});
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const res = await subjectsAPI.getAll();
            setSubjects(res.data || []);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title || !form.description)
            return alert("Fill in both title and description");
        try {
            const res = await subjectsAPI.create(form);
            if (res.data) {
                setSubjects((prev) => [res.data, ...prev]);
                setForm({ title: "", description: "" });
            }
        } catch (err) {
            alert("Failed to create subject: " + err.message);
        }
    };

    const handleEnroll = async () => {
        if (!enrollForm.subject_id || !enrollForm.student_email)
            return alert("Select a subject and enter a student email");
        try {
            await subjectsAPI.enrollStudent(enrollForm);
            setEnrollForm({ ...enrollForm, student_email: "" });
            // Refresh the student list if this subject is expanded
            if (expandedSubject === enrollForm.subject_id) {
                loadStudents(enrollForm.subject_id);
            }
            alert("Student enrolled successfully!");
        } catch (err) {
            alert("Failed to enroll student: " + err.message);
        }
    };

    const loadStudents = async (subjectId) => {
        try {
            const res = await subjectsAPI.getStudents(subjectId);
            setEnrolledStudents((prev) => ({ ...prev, [subjectId]: res.data || [] }));
        } catch (err) {
            console.error("Failed to load students:", err);
        }
    };

    const toggleStudents = (subjectId) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
        } else {
            setExpandedSubject(subjectId);
            if (!enrolledStudents[subjectId]) {
                loadStudents(subjectId);
            }
        }
    };

    const handleUnenroll = async (enrollmentId, subjectId) => {
        if (!window.confirm("Remove this student from the subject?")) return;
        try {
            await subjectsAPI.unenrollStudent(enrollmentId);
            setEnrolledStudents((prev) => ({
                ...prev,
                [subjectId]: prev[subjectId].filter((s) => s.enrollment_id !== enrollmentId),
            }));
        } catch (err) {
            alert("Failed to unenroll student: " + err.message);
        }
    };

    return (
        <div className="sub-page">
            {/* Create Subject */}
            <div className="form-card">
                <h3>Create Subject</h3>
                <div className="form-row">
                    <input
                        placeholder="Subject Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <input
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>
                <button className="save-btn" onClick={handleCreate}>Create Subject</button>
            </div>

            {/* Enroll Student */}
            <div className="form-card" style={{ marginTop: "1.5rem" }}>
                <h3>Enroll Student</h3>
                <div className="form-row">
                    <select
                        value={enrollForm.subject_id}
                        onChange={(e) => setEnrollForm({ ...enrollForm, subject_id: e.target.value })}
                        style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.95rem" }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    <input
                        type="email"
                        placeholder="Student Email"
                        value={enrollForm.student_email}
                        onChange={(e) => setEnrollForm({ ...enrollForm, student_email: e.target.value })}
                    />
                </div>
                <button className="save-btn" onClick={handleEnroll}>Enroll Student</button>
            </div>

            {/* Subject List */}
            <div className="notes-list" style={{ marginTop: "1.5rem" }}>
                {isLoading ? (
                    <p>Loading subjects...</p>
                ) : subjects.length === 0 ? (
                    <p className="empty">No subjects created yet.</p>
                ) : (
                    subjects.map((s) => (
                        <div className="note-card" key={s.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <p className="note-title">{s.title}</p>
                                    {s.description && <p className="note-meta">{s.description}</p>}
                                </div>
                                <button
                                    className="badge badge-purple"
                                    onClick={() => toggleStudents(s.id)}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {expandedSubject === s.id ? "Hide Students" : "View Students"}
                                </button>
                            </div>

                            {expandedSubject === s.id && (
                                <div className="submissions-panel" style={{ marginTop: "0.75rem" }}>
                                    {!enrolledStudents[s.id] ? (
                                        <p>Loading...</p>
                                    ) : enrolledStudents[s.id].length === 0 ? (
                                        <p className="empty">No students enrolled yet.</p>
                                    ) : (
                                        enrolledStudents[s.id].map((st) => (
                                            <div key={st.enrollment_id} className="submission-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{st.full_name}</p>
                                                    <p className="note-meta">{st.email}</p>
                                                </div>
                                                <button
                                                    className="del-btn"
                                                    onClick={() => handleUnenroll(st.enrollment_id, s.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SubjectsPage;
