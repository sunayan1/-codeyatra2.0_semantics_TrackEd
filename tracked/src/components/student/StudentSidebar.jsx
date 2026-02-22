import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const StudentSidebar = ({ logout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { key: "home", path: "/student", icon: "🏠", label: "Dashboard" },
        { key: "subjects", path: "/student/subjects", icon: "📚", label: "Subjects" },
        { key: "notes", path: "/student/notes", icon: "📄", label: "My Notes" },
        { key: "asgn", path: "/student/assignments", icon: "📝", label: "Assignments" },
        { key: "room", path: "/student/study-room", icon: "🏠", label: "Study Room" },
    ];

    return (
        <aside className="sidebar">
            <div className="logo" onClick={() => navigate("/student")} style={{ cursor: 'pointer' }}>🎓 SmartCampus</div>
            <nav>
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon} {item.label}
                    </button>
                ))}
            </nav>
            <button className="logout-btn" onClick={logout}>🚪 Logout</button>
        </aside>
    );
};

export default StudentSidebar;
