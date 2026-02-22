import React from "react";
import { SUBJECTS } from "../../data/learningData";
import "./SubjectSelectionModal.css";

const SubjectSelectionModal = ({ onClose, onSelect }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="selection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Which subject do you want to move to?</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="subjects-grid">
                    {SUBJECTS.map((subject) => (
                        <button
                            key={subject.id}
                            className="subject-selection-card"
                            style={{ "--subject-color": subject.color }}
                            onClick={() => onSelect(subject.id)}
                        >
                            <span className="subject-dot" style={{ backgroundColor: subject.color }}></span>
                            {subject.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionModal;
