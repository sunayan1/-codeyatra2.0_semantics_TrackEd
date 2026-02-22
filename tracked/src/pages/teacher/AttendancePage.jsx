import { useState } from "react";

const STUDENTS = [
    "Anjana Shrestha",
    "Roshan Tamang",
    "Priya Karki",
    "Bikal Thapa",
    "Sita Rai",
    "Manish Gurung",
];

const today = new Date().toISOString().split("T")[0];

const AttendancePage = () => {
    const [date, setDate] = useState(today);
    const [records, setRecords] = useState(
        Object.fromEntries(STUDENTS.map((s) => [s, "present"]))
    );
    const [saved, setSaved] = useState(false);

    const toggle = (name, val) => {
        setRecords((r) => ({ ...r, [name]: val }));
        setSaved(false);
    };

    const handleSave = () => setSaved(true);

    const presentCount = Object.values(records).filter((v) => v === "present").length;

    return (
        <div className="sub-page">
            <div className="sub-header">
                <div>
                    <p className="sub-stat">
                        Present: <strong>{presentCount}</strong> &nbsp;|&nbsp;
                        Absent: <strong>{STUDENTS.length - presentCount}</strong>
                    </p>
                </div>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSaved(false); }}
                    className="date-input"
                />
            </div>

            <div className="attendance-list">
                {STUDENTS.map((name) => (
                    <div className="attendance-row" key={name}>
                        <span className="student-name">{name}</span>
                        <div className="toggle-group">
                            <button
                                className={`att-btn ${records[name] === "present" ? "btn-present" : ""}`}
                                onClick={() => toggle(name, "present")}
                            >Present</button>
                            <button
                                className={`att-btn ${records[name] === "absent" ? "btn-absent" : ""}`}
                                onClick={() => toggle(name, "absent")}
                            >Absent</button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="save-btn" onClick={handleSave}>
                {saved ? "Attendance Saved" : "Save Attendance"}
            </button>
        </div>
    );
};

export default AttendancePage;
