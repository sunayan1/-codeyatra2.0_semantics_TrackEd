import { useState, useEffect } from "react";
import { assignmentsAPI, submissionsAPI, subjectsAPI } from "../../services/api";

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ title: "", subject_id: "", due_date: "", description: "" });
    const [showSubmissions, setShowSubmissions] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [aRes, sRes, subRes] = await Promise.all([
                assignmentsAPI.getAll(),
                submissionsAPI.getTeacher(),
                subjectsAPI.getAll()
            ]);
            setAssignments(aRes.data || []);
            setSubmissions(sRes.data || []);
            setSubjects(subRes.data || []);
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!form.title || !form.subject_id || !form.due_date)
            return alert("Fill title, subject, and due date");
        try {
            const res = await assignmentsAPI.create(form);
            if (res.data) {
                const subject = subjects.find(s => s.id === form.subject_id);
                const enriched = { ...res.data, subject: subject?.title || '' };
                setAssignments((a) => [enriched, ...a]);
                setForm({ title: "", subject_id: "", due_date: "", description: "" });
            }
        } catch (err) {
            alert("Failed to create assignment: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await assignmentsAPI.delete(id);
            setAssignments((a) => a.filter((x) => x.id !== id));
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
                <h3>New Assignment</h3>
                <div className="form-row">
                    <input
                        placeholder="Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <select
                        value={form.subject_id}
                        onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
                <div className="form-row">
                    <input
                        type="datetime-local"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        className="date-input"
                    />
                    <input
                        placeholder="Description (optional)"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>
                <button className="save-btn" onClick={handleAdd}>Assign</button>
            </div>

            <div className="assignment-list">
                {isLoading ? <p>Loading...</p> : assignments.map((a) => (
                    <div className="assignment-card" key={a.id}>
                        <div className="asgn-top">
                            <div>
                                <p className="asgn-title">{a.title}</p>
                                <p className="note-meta">{a.subject} · Due: {formatDate(a.due_date)}</p>
                            </div>
                            <div className="asgn-actions">
                                <button className="badge badge-purple" onClick={() => setShowSubmissions(showSubmissions === a.id ? null : a.id)}>
                                    View Submissions ({submissions.filter(s => s.assignment_id === a.id).length})
                                </button>
                                <button className="del-btn" onClick={() => handleDelete(a.id)}>Delete</button>
                            </div>
                        </div>
                        {a.description && <p className="asgn-desc">{a.description}</p>}

                        {showSubmissions === a.id && (
                            <div className="submissions-panel">
                                {submissions.filter(s => s.assignment_id === a.id).map(sub => (
                                    <div key={sub.id} className="submission-item">
                                        <p><strong>{sub.studentName || sub.studentEmail}</strong></p>
                                        <p>{sub.file_url || "work_submission.pdf"}</p>
                                        <p className="note-meta">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                                        {sub.status === 'graded' && (
                                            <p className="note-meta">Grade: {sub.marks}/15 {sub.feedback && `- ${sub.feedback}`}</p>
                                        )}
                                    </div>
                                ))}
                                {submissions.filter(s => s.assignment_id === a.id).length === 0 && <p className="empty">No submissions yet.</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignmentsPage;
