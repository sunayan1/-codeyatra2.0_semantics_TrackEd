import { useState, useEffect } from "react";
import { attendanceAPI } from "../../services/api";

const today = new Date().toISOString().split("T")[0];

const AttendancePage = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [date, setDate] = useState(today);
    const [students, setStudents] = useState([]);       // [{ id, full_name, email }]
    const [records, setRecords] = useState({});         // { [student_id]: 'present'|'absent'|'late' }
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // Load teacher's subjects once on mount
    useEffect(() => {
        const fetchSubjects = async () => {
            const res = await attendanceAPI.getSubjects();
            const data = res?.data?.data || res?.data || [];
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0].id);
        };
        fetchSubjects();
    }, []);

    // When subject OR date changes — load students + existing attendance records for that day
    useEffect(() => {
        if (!selectedSubject) return;
        const fetchStudentsAndRecords = async () => {
            setLoadingStudents(true);
            setSaved(false);
            setError("");
            try {
                const [studRes, recRes] = await Promise.all([
                    attendanceAPI.getStudents(selectedSubject),
                    attendanceAPI.getRecords(selectedSubject, date),
                ]);

                const studs = studRes?.data?.data || studRes?.data || [];
                const recs = recRes?.data?.data || recRes?.data || [];

                setStudents(studs);

                // Build a map of existing records (student_id → status)
                const existingMap = Object.fromEntries(recs.map(r => [r.student_id, r.status]));

                // Default everyone to 'present' if no existing record
                const defaultRecords = Object.fromEntries(
                    studs.map(s => [s.id, existingMap[s.id] || "present"])
                );
                setRecords(defaultRecords);
            } catch (e) {
                setError("Failed to load class data. Check your connection.");
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudentsAndRecords();
    }, [selectedSubject, date]);

    const toggle = (studentId, status) => {
        setRecords(r => ({ ...r, [studentId]: status }));
        setSaved(false);
    };

    const handleSave = async () => {
        if (students.length === 0) return;
        setSaving(true);
        setError("");
        try {
            const recordsArr = students.map(s => ({
                student_id: s.id,
                status: records[s.id] || "present",
            }));
            await attendanceAPI.save({
                subject_id: selectedSubject,
                date,
                records: recordsArr,
            });
            setSaved(true);
        } catch (e) {
            setError("Failed to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const presentCount = students.filter(s => records[s.id] === "present").length;
    const absentCount = students.filter(s => records[s.id] === "absent").length;
    const lateCount = students.filter(s => records[s.id] === "late").length;

    return (
        <div className="sub-page">

            {/* ── Controls Bar ── */}
            <div className="sub-header">
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Subject selector */}
                    {subjects.length === 0 ? (
                        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                            No subjects found. Create a subject first.
                        </p>
                    ) : (
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="date-input"
                            style={{ minWidth: "180px" }}
                        >
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                    )}

                    {/* Date picker */}
                    <input
                        type="date"
                        value={date}
                        onChange={e => { setDate(e.target.value); setSaved(false); }}
                        className="date-input"
                    />
                </div>

                {/* Summary stats */}
                {students.length > 0 && (
                    <p className="sub-stat">
                        Present: <strong style={{ color: "#10b981" }}>{presentCount}</strong>
                        &nbsp;|&nbsp;
                        Absent: <strong style={{ color: "#ef4444" }}>{absentCount}</strong>
                        &nbsp;|&nbsp;
                        Late: <strong style={{ color: "#f59e0b" }}>{lateCount}</strong>
                    </p>
                )}
            </div>

            {/* ── Error banner ── */}
            {error && (
                <p style={{ color: "#ef4444", margin: "0.5rem 0", fontSize: "0.9rem" }}>
                    ⚠️ {error}
                </p>
            )}

            {/* ── Student List ── */}
            {loadingStudents ? (
                <p style={{ color: "#6b7280", marginTop: "1rem" }}>Loading students...</p>
            ) : students.length === 0 ? (
                <p style={{ color: "#6b7280", marginTop: "1rem" }}>
                    No students enrolled in this subject yet.
                </p>
            ) : (
                <div className="attendance-list">
                    {students.map(student => (
                        <div className="attendance-row" key={student.id}>
                            <div>
                                <span className="student-name">{student.full_name}</span>
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.5rem" }}>
                                    {student.email}
                                </span>
                            </div>
                            <div className="toggle-group">
                                <button
                                    className={`att-btn ${records[student.id] === "present" ? "btn-present" : ""}`}
                                    onClick={() => toggle(student.id, "present")}
                                >
                                    Present
                                </button>
                                <button
                                    className={`att-btn ${records[student.id] === "late" ? "btn-late" : ""}`}
                                    onClick={() => toggle(student.id, "late")}
                                    style={records[student.id] === "late"
                                        ? { background: "#f59e0b", color: "#fff", borderColor: "#f59e0b" }
                                        : {}}
                                >
                                    Late
                                </button>
                                <button
                                    className={`att-btn ${records[student.id] === "absent" ? "btn-absent" : ""}`}
                                    onClick={() => toggle(student.id, "absent")}
                                >
                                    Absent
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Save Button ── */}
            {students.length > 0 && (
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: "1.5rem", opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? "Saving..." : saved ? "✅ Attendance Saved!" : "Save Attendance"}
                </button>
            )}
        </div>
    );
};

export default AttendancePage;
