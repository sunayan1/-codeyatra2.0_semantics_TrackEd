import { useNavigate, useLocation, Link } from "react-router-dom";
import { SUBJECTS } from "../../data/learningData";

const StudentSidebar = ({ logout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { key: "home", path: "/student", icon: "🏠", label: "Dashboard" },
        { key: "notes", path: "/student/notes", icon: "📓", label: "My Notes" },
        { key: "asgn", path: "/student/assignments", icon: "✍️", label: "Assignments" },
        { key: "room", path: "/student/study-room", icon: "🏠", label: "Study Room" },
    ];

    return (
        <aside className="sidebar">
            <div className="logo" onClick={() => navigate("/student")} style={{ cursor: 'pointer' }}>
                🎓 SmartCampus
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

            <div className="sidebar-section">
                <p className="section-title">My Learning</p>
                <div className="sub-nav">
                    {SUBJECTS.map((subject) => (
                        <Link
                            key={subject.id}
                            to={`/student/subject/${subject.id}`}
                            className={`sub-link ${location.pathname.includes(subject.id) ? "active" : ""}`}
                        >
                            <i style={{ fontStyle: 'normal' }}>📖</i> {subject.title}
                        </Link>
                    ))}
                </div>
            </div>

            <button className="logout-btn" onClick={logout} style={{ marginTop: 'auto' }}>
                Logout
            </button>
        </aside>
    );
};

export default StudentSidebar;
