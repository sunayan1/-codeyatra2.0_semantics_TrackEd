import { useState, useEffect } from "react";
import { assignmentsAPI, submissionsAPI, subjectsAPI } from "../../services/api";

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ title: "", subject_id: "", deadline: "", desc: "", max_marks: "100" });
    const [showSubmissions, setShowSubmissions] = useState(null);
    const [gradingForm, setGradingForm] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [aRes, sRes, subjRes] = await Promise.all([
                assignmentsAPI.getAll(),
                submissionsAPI.getTeacher(),
                subjectsAPI.getAll()
            ]);
            setAssignments(aRes.data?.data || aRes.data || []);
            setSubmissions(sRes.data?.data || sRes.data || []);
            setSubjects(subjRes.data?.data || subjRes.data || []);
        } catch (_) {}
        setIsLoading(false);
    };

    const handleAdd = async () => {
        if (!form.title || !form.subject_id || !form.deadline)
            return alert("Fill title, subject, and deadline");
        try {
            const payload = {
                subject_id: form.subject_id,
                title: form.title,
                description: form.desc || null,
                due_date: form.deadline,
                max_marks: parseInt(form.max_marks, 10) || 100
            };
            const res = await assignmentsAPI.create(payload);
            const created = res.data?.data || res.data;
            const subjectName = subjects.find(s => s.id === form.subject_id)?.title || '';
            setAssignments((a) => [{ ...created, subject: subjectName }, ...a]);
            setForm({ title: "", subject_id: "", deadline: "", desc: "", max_marks: "100" });
        } catch (err) {
            alert("Failed to create assignment: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        await assignmentsAPI.delete(id);
        setAssignments((a) => a.filter((x) => x.id !== id));
    };

    const handleGrade = async (submissionId) => {
        const g = gradingForm[submissionId];
        if (!g || g.marks === undefined || g.marks === '') return alert("Enter marks");
        try {
            await submissionsAPI.grade(submissionId, {
                marks: parseFloat(g.marks),
                feedback: g.feedback || ''
            });
            setSubmissions(prev => prev.map(s =>
                s.id === submissionId ? { ...s, marks: parseFloat(g.marks), feedback: g.feedback || '', status: 'graded' } : s
            ));
            setGradingForm(prev => { const c = { ...prev }; delete c[submissionId]; return c; });
        } catch (err) {
            alert("Failed to grade: " + err.message);
        }
    };

    const getSubjectName = (sid) => subjects.find(s => s.id === sid)?.title || '';

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
                        style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
                <div className="form-row">
                    <input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        className="date-input"
                    />
                    <input
                        type="number"
                        placeholder="Max Marks (default 100)"
                        value={form.max_marks}
                        onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                        style={{ width: '140px' }}
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
                {isLoading ? <p>Loading...</p> : assignments.length === 0 ? <p className="empty">No assignments yet.</p> : assignments.map((a) => {
                    const aSubmissions = submissions.filter(s => s.assignment_id === a.id);
                    return (
                        <div className="assignment-card" key={a.id}>
                            <div className="asgn-top">
                                <div>
                                    <p className="asgn-title">{a.title}</p>
                                    <p className="note-meta">
                                        {a.subject || getSubjectName(a.subject_id)} · Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : a.deadline}
                                        {a.max_marks && <span> · Max: {a.max_marks}</span>}
                                    </p>
                                </div>
                                <div className="asgn-actions">
                                    <button className="badge badge-blue" onClick={() => setShowSubmissions(showSubmissions === a.id ? null : a.id)}>
                                        Submissions ({aSubmissions.length})
                                    </button>
                                    <button className="del-btn" onClick={() => handleDelete(a.id)}>Delete</button>
                                </div>
                            </div>
                            {a.description && <p className="asgn-desc">{a.description}</p>}

                            {showSubmissions === a.id && (
                                <div className="submissions-panel">
                                    {aSubmissions.length === 0 ? (
                                        <p className="empty">No submissions yet.</p>
                                    ) : aSubmissions.map(sub => (
                                        <div key={sub.id} className="submission-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div>
                                                <p><strong>{sub.studentName || sub.studentEmail}</strong></p>
                                                {sub.file_url && (
                                                    <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#818cf8' }}>
                                                        View Submission
                                                    </a>
                                                )}
                                                <p className="note-meta">
                                                    {new Date(sub.submitted_at).toLocaleString()}
                                                    {sub.status === 'graded' && <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>Graded: {sub.marks}</span>}
                                                </p>
                                                {sub.feedback && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Feedback: {sub.feedback}</p>}
                                            </div>
                                            {sub.status !== 'graded' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Marks"
                                                        value={gradingForm[sub.id]?.marks || ''}
                                                        onChange={(e) => setGradingForm(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], marks: e.target.value } }))}
                                                        style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                                    />
                                                    <input
                                                        placeholder="Feedback"
                                                        value={gradingForm[sub.id]?.feedback || ''}
                                                        onChange={(e) => setGradingForm(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))}
                                                        style={{ width: '160px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                                    />
                                                    <button className="badge badge-green" onClick={() => handleGrade(sub.id)}>Grade</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssignmentsPage;