import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentHeader from "../../components/student/StudentHeader";
import ProfileModal from "../../components/ProfileModal";
import "../Dashboard.css";

const SUBJECTS = ["Data Structures", "Operating Systems", "Mathematics III", "Digital Logic", "Computer Networks"];

const SubjectsPage = () => {
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className="dashboard">
            <StudentSidebar logout={logout} />
            <main className="main">
                <StudentHeader
                    title="My Subjects"
                    user={user}
                    onAvatarClick={() => setShowProfile(true)}
                />

                <div className="box-content" style={{ marginTop: '2rem' }}>
                    <ul className="subject-list">
                        {SUBJECTS.map((s) => (
                            <li key={s} className="note-card" style={{ padding: '1.5rem' }}>
                                <span style={{ fontWeight: 600 }}>{s}</span>
                            </li>
                        ))}
                    </ul>
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

export default SubjectsPage;
