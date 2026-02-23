import React from "react";
import { STUDENT_PROGRESS } from "../../data/progressData";

const ProgressTracker = ({ user }) => {
    const progress = STUDENT_PROGRESS[user?.email] || {
        attendance: 0,
        assignments: [],
        fileReviews: []
    };

    return (
        <div className="box-content">
            <h3>My Progress Tracking</h3>
            <div className="progress-stats-grid">
                <div className="progress-card">
                    <p className="label">Attendance</p>
                    <p className="val">{progress.attendance}%</p>
                </div>
                <div className="progress-card">
                    <p className="label">Assignments</p>
                    <p className="val">{progress.assignments.filter(a => a.status === "submitted").length} / {progress.assignments.length}</p>
                </div>
                <div className="progress-card">
                    <p className="label">Reviewed Files</p>
                    <p className="val">{progress.fileReviews.filter(f => f.status === "reviewed").length}</p>
                </div>
            </div>

            <div className="recent-reviews">
                <h4>Recent Instructor Feedback</h4>
                {progress.assignments.filter(a => a.review).map((a, i) => (
                    <div key={i} className="review-item">
                        <p><strong>{a.title}:</strong> {a.review} <span className="grade-badge">{a.grade}</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgressTracker;
