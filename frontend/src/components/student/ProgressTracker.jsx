import { useState, useEffect } from "react";
import { attendanceAPI, submissionsAPI, assignmentsAPI } from "../../services/api";

const StatCard = ({ label, value }) => (
    <div className="progress-card">
        <p className="label">{label}</p>
        <p className="val">{value}</p>
    </div>
);

const FeedbackItem = ({ submission }) => (
    <div className="review-item">
        <p>
            <strong>{submission.assignment_title || 'Assignment'}:</strong> {submission.feedback || 'No feedback yet.'}{" "}
            {submission.marks !== null && <span className="grade-badge">{submission.marks} / 15</span>}
        </p>
    </div>
);

const ProgressTracker = ({ user }) => {
    const [stats, setStats] = useState({ attendance: 0, completed: 0, total: 0 });
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProgress = async () => {
            setIsLoading(true);
            try {
                const [attRes, subRes, asgnRes] = await Promise.all([
                    attendanceAPI.getMy(),
                    submissionsAPI.getMySubmissions(),
                    assignmentsAPI.getAll()
                ]);

                const extract = (res) => {
                    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
                    if (res?.data && Array.isArray(res.data)) return res.data;
                    return [];
                };

                const attData = extract(attRes);
                const subData = extract(subRes);
                const asgnData = extract(asgnRes);

                // Calculate attendance %
                const totalDays = attData.length;
                const presentDays = attData.filter(d => d.status === 'present' || d.status === 'late').length;
                const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;


                const completedCount = new Set(subData.map(s => s.assignment_id)).size;

                setStats({
                    attendance,
                    completed: completedCount,
                    total: asgnData.length
                });


                // Enrich submissions with assignment titles if needed or just use what we have
                // The backend already enriches submissions if implemented correctly, but let's be safe
                setSubmissions(subData);
            } catch (error) {
                console.error("Error loading progress:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) loadProgress();
    }, [user]);

    if (isLoading) return <div className="box-content"><p>Loading progress...</p></div>;

    return (
        <div className="box-content">
            <h3>My Progress Tracking</h3>
            <div className="progress-stats-grid">
                <StatCard label="Attendance" value={`${stats.attendance}%`} />
                <StatCard label="Assignments" value={`${stats.completed} / ${stats.total}`} />
                <StatCard label="Live Status" value={stats.attendance < 75 ? "Warning" : "Good"} />
            </div>

            <div className="recent-reviews">
                <h4>Recent Instructor Feedback</h4>
                {submissions.filter(s => s.feedback || s.marks !== null).length === 0 ? (
                    <p className="note-meta">No feedback received yet.</p>
                ) : (
                    submissions
                        .filter((s) => s.feedback || s.marks !== null)
                        .map((s, i) => (
                            <FeedbackItem key={i} submission={s} />
                        ))
                )}
            </div>
        </div>
    );
};

export default ProgressTracker;

