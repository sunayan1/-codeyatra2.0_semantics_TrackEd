import React, { useState, useEffect } from "react";
import "./style/TodoModal.css"; // Reuse modal styling

const PomodoroModal = ({ onClose, onStart, activeTimer }) => {
    const [minutes, setMinutes] = useState(25);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="todo-modal pomodoro-modal" onClick={(e) => e.stopPropagation()}>
                <div className="todo-header">
                    <h2>⏲️ Pomodoro Timer</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="todo-content" style={{ textAlign: "center", padding: "2rem" }}>
                    {!activeTimer ? (
                        <>
                            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                                Set your study duration. The room will lock until the timer ends.
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                                <button className="add-btn" style={{ padding: "0.5rem 1rem" }} onClick={() => setMinutes(Math.max(1, minutes - 5))}>-</button>
                                <span style={{ fontSize: "2rem", fontWeight: "700" }}>{minutes} min</span>
                                <button className="add-btn" style={{ padding: "0.5rem 1rem" }} onClick={() => setMinutes(minutes + 5)}>+</button>
                            </div>
                            <button
                                className="save-btn"
                                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
                                onClick={() => onStart(minutes)}
                            >
                                Start Deep Work 🚀
                            </button>
                        </>
                    ) : (
                        <>
                            <p style={{ color: "#ef4444", fontWeight: "600", marginBottom: "1rem" }}>
                                🔥 Deep Work in Progress
                            </p>
                            <div style={{ fontSize: "3rem", fontWeight: "800", color: "#1e1b4b", marginBottom: "1.5rem" }}>
                                {Math.floor(activeTimer / 60)}:{(activeTimer % 60).toString().padStart(2, '0')}
                            </div>
                            <p className="note-meta">
                                Room is locked. Stay focused!
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PomodoroModal;
