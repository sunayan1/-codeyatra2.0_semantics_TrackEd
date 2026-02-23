import React, { useState, useEffect } from "react";
import { subjectsAPI, attendanceAPI } from "../../services/api";

const StudentRecordsPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [metrics, setMetrics] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) loadPerformance(selectedSubject);
    }, [selectedSubject]);

    const loadSubjects = async () => {
        try {
            const res = await subjectsAPI.getAll();
            const list = res.data?.data || res.data || [];
            setSubjects(list);
            if (list.length > 0) setSelectedSubject(list[0].id);
        } catch (_) {}
        setLoading(false);
    };

    const loadPerformance = async (subjectId) => {
        try {
            const res = await attendanceAPI.getPerformance(subjectId);
            setMetrics(res.data?.data || res.data || []);
        } catch (_) {
            setMetrics([]);
        }
    };

    const selected = metrics.find(m => m.student_id === selectedStudent);

    return (
        <div className="sub-page">
            <div className="sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3>Student Performance Records</h3>
                    <p className="note-meta">Review attendance, assignments, and quiz metrics.</p>
                </div>
                <select
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setSelectedStudent(null); }}
                    style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                </select>
            </div>

            {loading ? <p>Loading...</p> : metrics.length === 0 ? (
                <p className="empty" style={{ marginTop: '2rem' }}>
                    {selectedSubject ? "No students enrolled in this subject." : "Select a subject to view records."}
                </p>
            ) : (
                <>
                    <div className="student-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                        {metrics.map(m => (
                            <div
                                key={m.student_id}
                                className="note-card"
                                style={{ cursor: 'pointer', border: selectedStudent === m.student_id ? '2px solid #2563eb' : '1px solid #e5e7eb' }}
                                onClick={() => setSelectedStudent(m.student_id)}
                            >
                                <div>
                                    <p className="note-title">{m.full_name}</p>
                                    <p className="note-meta">{m.email}</p>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#2563eb' }}>Att: {m.attendance.percentage}%</span>
                                        <span style={{ color: '#059669' }}>Quiz: {m.quizzes.passed}/{m.quizzes.attempted}</span>
                                        <span style={{ color: '#f59e0b' }}>Asgn: {m.assignments.graded}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selected && (
                        <div className="box-content" style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4>Performance: {selected.full_name}</h4>
                                <button className="badge badge-blue" onClick={() => setSelectedStudent(null)}>Close</button>
                            </div>

                            <div className="progress-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                                <div className="progress-card" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                                    <p className="label">Attendance</p>
                                    <p className="val" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>{selected.attendance.percentage}%</p>
                                    <p className="note-meta">{selected.attendance.present}/{selected.attendance.total} classes</p>
                                </div>
                                <div className="progress-card" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                                    <p className="label">Quizzes Passed</p>
                                    <p className="val" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{selected.quizzes.passed}/{selected.quizzes.attempted}</p>
                                </div>
                                <div className="progress-card" style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px' }}>
                                    <p className="label">Assignments</p>
                                    <p className="val" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{selected.assignments.graded} graded</p>
                                    <p className="note-meta">Avg: {selected.assignments.avgMarks !== null ? selected.assignments.avgMarks : '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentRecordsPage;
