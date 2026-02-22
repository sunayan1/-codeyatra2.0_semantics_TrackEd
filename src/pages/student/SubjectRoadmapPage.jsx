import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LEARNING_DATA } from "../../data/learningData";
import { useAuth } from "../../context/AuthContext";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "./SubjectRoadmapPage.css";

const SubjectRoadmapPage = () => {
    const { subjectId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [progress, setProgress] = useState({});

    const subjectContent = LEARNING_DATA[subjectId];

    useEffect(() => {
        if (user && user.email) {
            const savedProgress = localStorage.getItem(`progress_${user.email}_${subjectId}`);
            if (savedProgress) {
                setProgress(JSON.parse(savedProgress));
            }
        }
    }, [user, subjectId]);

    if (!subjectContent) {
        return <div className="error-page">Subject not found</div>;
    }

    const isLevelUnlocked = (levelId, index) => {
        if (index === 0) return true;
        const prevLevelId = subjectContent.chapters[0].levels[index - 1].id;
        return progress[prevLevelId] === "completed";
    };

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />
            <main className="main">
                <StudentHeader
                    title={subjectContent.title}
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="roadmap-container">
                    <div className="roadmap-header">
                        <h2>Learning Path</h2>
                        <p>Complete each level to unlock the next one.</p>
                    </div>

                    <div className="path-svg-container">
                        {/* Simulating a path with CSS/HTML for simplicity, can use SVG for better curves */}
                        <div className="levels-path">
                            {subjectContent.chapters[0].levels.map((level, index) => {
                                const unlocked = isLevelUnlocked(level.id, index);
                                const completed = progress[level.id] === "completed";

                                return (
                                    <div
                                        key={level.id}
                                        className={`level-node ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`}
                                        onClick={() => unlocked && navigate(`/student/subject/${subjectId}/level/${level.id}`)}
                                    >
                                        <div className="level-circle">
                                            {completed ? "✓" : index + 1}
                                        </div>
                                        <div className="level-info">
                                            <h3>{level.title}</h3>
                                            <span>{completed ? "Completed" : unlocked ? "Unlocked" : "Locked"}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {showProfile && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfile(false)}
                    onLogout={logout}
                />
            )}
        </div>
    );
};

export default SubjectRoadmapPage;
