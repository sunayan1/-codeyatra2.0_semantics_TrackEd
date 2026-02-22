import React, { useState } from "react";
import { ALL_STUDENTS, STUDENT_PROGRESS } from "../../data/progressData";

const StudentRecordsPage = () => {
    const [selectedStudent, setSelectedStudent] = useState(null);

    return (
        <div className="sub-page">
            <div className="sub-header">
                <h3>Student Performance Records</h3>
                <p className="note-meta">Review attendance, assignments, and file feedback.</p>
            </div>

            <div className="student-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                {ALL_STUDENTS.map(student => (
                    <div
                        key={student.email}
                        className="note-card"
                        style={{ cursor: 'pointer', border: selectedStudent === student.email ? '2px solid #2563eb' : '1px solid #e5e7eb' }}
                        onClick={() => setSelectedStudent(student.email)}
                    >
                        <div>
                            <p className="note-title">{student.name}</p>
                            <p className="note-meta">{student.email}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedStudent && (
                <div className="box-content" style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4>Performance Details: {ALL_STUDENTS.find(s => s.email === selectedStudent)?.name}</h4>
                        <button className="badge badge-blue" onClick={() => setSelectedStudent(null)}>Close Details</button>
                    </div>

                    <div className="progress-stats-grid">
                        <div className="progress-card">
                            <p className="label">Attendance</p>
                            <p className="val">{STUDENT_PROGRESS[selectedStudent]?.attendance || 0}%</p>
                        </div>
                        <div className="progress-card">
                            <p className="label">Assignments</p>
                            <p className="val">{STUDENT_PROGRESS[selectedStudent]?.assignments?.length || 0}</p>
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
                                {STUDENT_PROGRESS[selectedStudent]?.assignments?.map((a, i) => (
                                    <tr key={i}>
                                        <td>{a.title}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${a.status === 'submitted' ? 'badge-green' : 'badge-blue'}`}>{a.status}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{a.grade || '-'}</td>
                                    </tr>
                                ))}
                                {(!STUDENT_PROGRESS[selectedStudent]?.assignments || STUDENT_PROGRESS[selectedStudent].assignments.length === 0) && (
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
