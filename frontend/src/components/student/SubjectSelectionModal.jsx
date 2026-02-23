import React, { useEffect, useState } from "react";
import { subjectsAPI } from "../../services/api";
import "./SubjectSelectionModal.css";

const COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const SubjectSelectionModal = ({ onClose, onSelect }) => {
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        subjectsAPI.getAll()
            .then(res => setSubjects(res.data || []))
            .catch(() => setSubjects([]));
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="selection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Which subject do you want to move to?</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="subjects-grid">
                    {subjects.map((subject, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        return (
                            <button
                                key={subject.id}
                                className="subject-selection-card"
                                style={{ "--subject-color": color }}
                                onClick={() => onSelect(subject.id)}
                            >
                                <span className="subject-dot" style={{ backgroundColor: color }}></span>
                                {subject.title}
                            </button>
                        );
                    })}
                    {subjects.length === 0 && (
                        <p style={{ color: "#6b7280", gridColumn: "1/-1", textAlign: "center" }}>
                            No subjects enrolled yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionModal;
