import React, { useState, useEffect } from "react";
import { subjectsAPI } from "../../services/api";

const StudentRecordsPage = () => {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await subjectsAPI.getProgress();
            setStudents(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Error loading student records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="sub-page">
            <div className="sub-header">
                <h3>Student Performance Records</h3>
                <p className="note-meta">Review attendance, assignments, and grades from live data.</p>
            </div>

            {isLoading ? (
                <p style={{ marginTop: '2rem' }}>Loading records...</p>
            ) : students.length === 0 ? (
                <p style={{ marginTop: '2rem', color: '#6b7280' }}>No students enrolled in your subjects yet.</p>
            ) : (
                <div className="student-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {students.map(student => (
                        <div
                            key={student.id}
                            className="note-card"
                            style={{ cursor: 'pointer', border: selectedStudentId === student.id ? '2px solid #2563eb' : '1px solid #e5e7eb' }}
                            onClick={() => setSelectedStudentId(student.id)}
                        >
                            <div>
                                <p className="note-title">{student.full_name}</p>
                                <p className="note-meta">{student.email}</p>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Att: {student.attendance}%</span>
                                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Asgn: {student.completedAssignments}/{student.totalAssignments}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedStudent && (
                <div className="box-content" style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4>Performance Details: {selectedStudent.full_name}</h4>
                        <button className="badge badge-blue" onClick={() => setSelectedStudentId(null)} style={{ border: 'none', cursor: 'pointer' }}>Close Details</button>
                    </div>

                    <div className="progress-stats-grid">
                        <div className="progress-card">
                            <p className="label">Attendance</p>
                            <p className="val" style={{ color: selectedStudent.attendance < 75 ? '#ef4444' : '#10b981' }}>{selectedStudent.attendance}%</p>
                        </div>
                        <div className="progress-card">
                            <p className="label">Assignments Score</p>
                            <p className="val">{selectedStudent.completedAssignments} / {selectedStudent.totalAssignments}</p>
                        </div>
                    </div>

                    <div className="assignment-stats" style={{ marginTop: '1.5rem' }}>
                        <h5>Assignment Status</h5>
                        <table style={{ width: '100%', marginTop: '0.5rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Title</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedStudent.assignments?.map((a, i) => (
                                    <tr key={i}>
                                        <td>{a.title}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${a.status === 'submitted' ? 'badge-green' : 'badge-blue'}`}>{a.status}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{a.marks !== null ? `${a.marks}/15` : '-'}</td>

                                    </tr>
                                ))}
                                {(!selectedStudent.assignments || selectedStudent.assignments.length === 0) && (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No assignments tracked.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentRecordsPage;

