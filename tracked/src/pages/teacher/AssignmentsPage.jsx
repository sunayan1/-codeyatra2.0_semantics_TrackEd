import { useState, useEffect } from "react";
import { assignmentsAPI, submissionsAPI } from "../../services/api";

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ title: "", subject: "", deadline: "", desc: "" });
    const [showSubmissions, setShowSubmissions] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [aRes, sRes] = await Promise.all([
            assignmentsAPI.getAll(),
            submissionsAPI.getAll()
        ]);
        setAssignments(aRes.data || []);
        setSubmissions(sRes.data || []);
        setIsLoading(false);
    };

    const handleAdd = async () => {
        if (!form.title || !form.subject || !form.deadline)
            return alert("Fill title, subject, and deadline");
        const res = await assignmentsAPI.create(form);
        setAssignments((a) => [res.data, ...a]);
        setForm({ title: "", subject: "", deadline: "", desc: "" });
    };

    const handleDelete = async (id) => {
        await assignmentsAPI.delete(id);
        setAssignments((a) => a.filter((x) => x.id !== id));
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
                    <input
                        placeholder="Subject"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                </div>
                <div className="form-row">
                    <input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        className="date-input"
                    />
                    <input
                        placeholder="Description (optional)"
                        value={form.desc}
                        onChange={(e) => setForm({ ...form, desc: e.target.value })}
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
                                <p className="note-meta">{a.subject} · Due: {a.deadline}</p>
                            </div>
                            <div className="asgn-actions">
                                <button className="badge badge-purple" onClick={() => setShowSubmissions(showSubmissions === a.id ? null : a.id)}>
                                    View Submissions ({submissions.filter(s => s.assignmentId === a.id).length})
                                </button>
                                <button className="del-btn" onClick={() => handleDelete(a.id)}>Delete</button>
                            </div>
                        </div>
                        {a.desc && <p className="asgn-desc">{a.desc}</p>}

                        {showSubmissions === a.id && (
                            <div className="submissions-panel">
                                {submissions.filter(s => s.assignmentId === a.id).map(sub => (
                                    <div key={sub.id} className="submission-item">
                                        <p><strong>{sub.studentEmail}</strong></p>
                                        <p>{sub.fileName || "work_submission.pdf"}</p>
                                        <p className="note-meta">Submitted: {new Date(sub.createdAt).toLocaleString()}</p>
                                    </div>
                                ))}
                                {submissions.filter(s => s.assignmentId === a.id).length === 0 && <p className="empty">No submissions yet.</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignmentsPage;
