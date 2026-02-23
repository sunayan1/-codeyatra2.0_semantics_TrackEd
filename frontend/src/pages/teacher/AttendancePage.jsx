import { useState, useEffect } from "react";
import { subjectsAPI, attendanceAPI } from "../../services/api";

const today = new Date().toISOString().split("T")[0];

const AttendancePage = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(today);
    const [records, setRecords] = useState({});
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            loadStudents(selectedSubject);
            loadExistingAttendance(selectedSubject, date);
        }
    }, [selectedSubject]);

    useEffect(() => {
        if (selectedSubject) {
            loadExistingAttendance(selectedSubject, date);
        }
    }, [date]);

    const loadSubjects = async () => {
        try {
            const res = await subjectsAPI.getAll();
            const list = res.data?.data || res.data || [];
            setSubjects(list);
            if (list.length > 0) {
                setSelectedSubject(list[0].id);
            }
        } catch (_) {}
        setLoading(false);
    };

    const loadStudents = async (subjectId) => {
        try {
            const res = await subjectsAPI.getStudents(subjectId);
            const list = res.data?.data || res.data || [];
            setStudents(list);
            // Initialize records if not already loaded from existing attendance
            setRecords(prev => {
                const updated = { ...prev };
                list.forEach(s => {
                    if (!updated[s.id]) updated[s.id] = "present";
                });
                return updated;
            });
        } catch (_) {
            setStudents([]);
        }
    };

    const loadExistingAttendance = async (subjectId, d) => {
        try {
            const res = await attendanceAPI.getByDate(subjectId, d);
            const existing = res.data?.data || res.data || [];
            if (existing.length > 0) {
                const map = {};
                existing.forEach(a => { map[a.student_id] = a.status; });
                setRecords(prev => ({ ...prev, ...map }));
                setSaved(true);
            } else {
                // Reset to default present for all students
                const map = {};
                students.forEach(s => { map[s.id] = "present"; });
                setRecords(map);
                setSaved(false);
            }
        } catch (_) {
            setSaved(false);
        }
    };

    const toggle = (studentId, val) => {
        setRecords((r) => ({ ...r, [studentId]: val }));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!selectedSubject) return alert("Select a subject");
        setSaving(true);
        try {
            const attendanceRecords = students.map(s => ({
                student_id: s.id,
                status: records[s.id] || "present"
            }));
            await attendanceAPI.mark({
                subject_id: selectedSubject,
                date,
                records: attendanceRecords
            });
            setSaved(true);
        } catch (err) {
            alert("Failed to save attendance: " + err.message);
        }
        setSaving(false);
    };

    const presentCount = students.filter(s => records[s.id] === "present").length;
    const absentCount = students.filter(s => records[s.id] === "absent").length;

    if (loading) return <div className="sub-page"><p>Loading...</p></div>;

    return (
        <div className="sub-page">
            <div className="sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value); setSaved(false); }}
                        style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    <p className="sub-stat">
                        Present: <strong>{presentCount}</strong> &nbsp;|&nbsp;
                        Absent: <strong>{absentCount}</strong> &nbsp;|&nbsp;
                        Late: <strong>{students.length - presentCount - absentCount}</strong>
                    </p>
                </div>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSaved(false); }}
                    className="date-input"
                />
            </div>

            {students.length === 0 ? (
                <p className="empty" style={{ marginTop: '2rem' }}>
                    {selectedSubject ? "No students enrolled in this subject." : "Select a subject to mark attendance."}
                </p>
            ) : (
                <div className="attendance-list">
                    {students.map((student) => (
                        <div className="attendance-row" key={student.id}>
                            <span className="student-name">
                                {student.full_name}
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.5rem' }}>{student.email}</span>
                            </span>
                            <div className="toggle-group">
                                <button
                                    className={`att-btn ${records[student.id] === "present" ? "btn-present" : ""}`}
                                    onClick={() => toggle(student.id, "present")}
                                >Present</button>
                                <button
                                    className={`att-btn ${records[student.id] === "late" ? "btn-late" : ""}`}
                                    onClick={() => toggle(student.id, "late")}
                                    style={records[student.id] === "late" ? { background: '#fbbf24', color: '#fff' } : {}}
                                >Late</button>
                                <button
                                    className={`att-btn ${records[student.id] === "absent" ? "btn-absent" : ""}`}
                                    onClick={() => toggle(student.id, "absent")}
                                >Absent</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="save-btn" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? "Saving..." : saved ? "Attendance Saved ✓" : "Save Attendance"}
            </button>
        </div>
    );
};

export default AttendancePage;
