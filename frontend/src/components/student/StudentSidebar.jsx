import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { subjectsAPI } from "../../services/api";

const StudentSidebar = ({ logout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        subjectsAPI.getAll()
            .then(res => setSubjects(res.data || []))
            .catch(() => setSubjects([]));
    }, []);

    const navItems = [
        { key: "home", path: "/student", icon: "", label: "Dashboard" },
        { key: "subjects", path: "/student/subjects", icon: "", label: "Subjects" },
        { key: "notes", path: "/student/notes", icon: "", label: "My Notes" },
        { key: "asgn", path: "/student/assignments", icon: "", label: "Assignments" },
        { key: "room", path: "/student/study-room", icon: "", label: "Study Room" },
    ];

    return (
        <aside className="sidebar">
            <div className="logo" onClick={() => navigate("/student")} style={{ cursor: 'pointer' }}>
                TrackEd
            </div>

            <div className="sidebar-section">
                <p className="section-title">Menu</p>
                <nav>
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <i>{item.icon}</i> {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {subjects.length > 0 && (
                <div className="sidebar-section">
                    <p className="section-title">My Learning</p>
                    <div className="sub-nav">
                        {subjects.map((subject) => (
                            <Link
                                key={subject.id}
                                to={`/student/subject/${subject.id}`}
                                className={`sub-link ${location.pathname.includes(subject.id) ? "active" : ""}`}
                            >
                                <i>•</i> {subject.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <button className="logout-btn" onClick={logout} style={{ marginTop: 'auto' }}>
                Logout
            </button>
        </aside>
    );
};

export default StudentSidebar;
