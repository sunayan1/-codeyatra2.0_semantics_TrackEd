import { useState, useEffect } from "react";
import { subjectsAPI } from "../../services/api";

const SubjectsPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ title: "", description: "", faculty: "", semester: "" });

    // Enrollment state
    const [enrollSubjectId, setEnrollSubjectId] = useState("");
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState({});
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const res = await subjectsAPI.getAll();
            setSubjects(res.data?.data || res.data || []);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title)
            return alert("Subject title is required");
        try {
            const payload = { title: form.title };
            if (form.description) payload.description = form.description;
            if (form.faculty) payload.faculty = form.faculty;
            if (form.semester) payload.semester = parseInt(form.semester, 10);
            const res = await subjectsAPI.create(payload);
            const created = res.data?.data || res.data;
            if (created) {
                setSubjects((prev) => [created, ...prev]);
                setForm({ title: "", description: "", faculty: "", semester: "" });
            }
        } catch (err) {
            alert("Failed to create subject: " + err.message);
        }
    };

    const handleEnrollAll = async () => {
        if (!enrollSubjectId) return alert("Select a subject");
        const sub = subjects.find(s => s.id === enrollSubjectId);
        const label = sub ? `${sub.title}${sub.faculty ? ` (${sub.faculty})` : ''}` : enrollSubjectId;
        if (!window.confirm(`Enroll all students from faculty "${sub?.faculty || 'all'}" semester ${sub?.semester || 'all'} into ${label}?`)) return;
        setEnrollLoading(true);
        try {
            const res = await subjectsAPI.enrollAllBySubject({ subject_id: enrollSubjectId });
            const info = res.data?.data || res.data || {};
            alert(`Enrolled ${info.enrolled || 0} students into ${info.subject || label}\n(${info.studentsMatched || 0} students matched)`);
            // Refresh student list if expanded
            setEnrolledStudents({});
            if (expandedSubject === enrollSubjectId) loadStudents(enrollSubjectId);
        } catch (err) {
            alert("Enrollment failed: " + err.message);
        }
        setEnrollLoading(false);
    };

    const loadStudents = async (subjectId) => {
        try {
            const res = await subjectsAPI.getStudents(subjectId);
            setEnrolledStudents((prev) => ({ ...prev, [subjectId]: res.data?.data || res.data || [] }));
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
                        placeholder="Subject Title *"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <input
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>
                <div className="form-row" style={{ marginTop: "0.5rem" }}>
                    <input
                        placeholder="Faculty / Department"
                        value={form.faculty}
                        onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    />
                    <select
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: e.target.value })}
                        style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.95rem" }}
                    >
                        <option value="">Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>Semester {n}</option>
                        ))}
                    </select>
                </div>
                <button className="save-btn" onClick={handleCreate}>Create Subject</button>
            </div>

            {/* Enroll Students */}
            <div className="form-card" style={{ marginTop: "1.5rem" }}>
                <h3>Enroll Students</h3>
                <p className="note-meta" style={{ marginBottom: "0.75rem" }}>
                    Select a subject to enroll all students matching its faculty and semester.
                </p>
                <div className="form-row">
                    <select
                        value={enrollSubjectId}
                        onChange={(e) => setEnrollSubjectId(e.target.value)}
                        style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.95rem", flex: 1 }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}{s.faculty ? ` — ${s.faculty}` : ''}{s.semester ? ` (Sem ${s.semester})` : ''}
                            </option>
                        ))}
                    </select>
                    <button
                        className="save-btn"
                        onClick={handleEnrollAll}
                        disabled={enrollLoading || !enrollSubjectId}
                        style={{ margin: 0 }}
                    >
                        {enrollLoading ? "Enrolling..." : "Enroll All Students"}
                    </button>
                </div>
                {enrollSubjectId && (() => {
                    const sub = subjects.find(s => s.id === enrollSubjectId);
                    return sub ? (
                        <p className="note-meta" style={{ marginTop: "0.5rem" }}>
                            Will enroll all students{sub.faculty ? ` from "${sub.faculty}"` : ''}{sub.semester ? ` (Sem ${sub.semester})` : ''} into <strong>{sub.title}</strong>
                        </p>
                    ) : null;
                })()}
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
                                    <p className="note-meta" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                                        {s.faculty && <span style={{ marginRight: "1rem" }}>Faculty: {s.faculty}</span>}
                                        {s.semester && <span>Semester {s.semester}</span>}
                                    </p>
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
