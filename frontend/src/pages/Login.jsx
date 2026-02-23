import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { ALL_STUDENTS } from "../data/progressData";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert("Please fill all fields");

        // --- Demo Login Bypass ---
        console.log(`Demo login attempt: ${email} as ${role}`);

        let canLogin = false;
        let userData = { email, role };

        if (role === "student") {
            const student = ALL_STUDENTS.find(s => s.email.toLowerCase() === email.toLowerCase());
            if (student) {
                canLogin = true;
                userData.name = student.name;
            } else {
                alert("Demo Student email not found. Use one from our records (e.g. anjana@gmail.com)");
                return;
            }
        } else {
            // Teacher demo bypass - allow any email for now, or a specific one
            canLogin = true;
            userData.name = "Demo Teacher";
        }

        if (canLogin) {
            // Mock successful login
            const dummyToken = "demo-token-" + Date.now();
            localStorage.setItem('authToken', dummyToken);
            login(email, role, userData.name);
            navigate(role === "student" ? "/student" : "/teacher");
        } else {
            alert("Invalid demo credentials.");
        }
    };

    const toggleRole = () => setRole((r) => (r === "student" ? "teacher" : "student"));

    const greeting = role === "student" ? "Join as Student" : "Access Teacher Portal";
    const tagline =
        role === "student"
            ? "Your central hub for academic productivity."
            : "Manage your courses and evaluate student progress.";

    return (
        <div className="login-wrapper">
            {/* LEFT – Sign In Form */}
            <div className="login-left">
                <h2 className="login-title">Sign In</h2>
                <p className="login-sub">as a <strong>{role === "student" ? "Student" : "Teacher"}</strong></p>

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">Sign In</button>
                </form>
            </div>

            {/* RIGHT – Welcome Panel */}
            <div className="login-right">
                <h2>{greeting}</h2>
                <p>{tagline}</p>
                <button className="btn-outline" onClick={toggleRole}>
                    Switch to {role === "student" ? "Teacher" : "Student"}
                </button>
            </div>
        </div>
    );
};

export default Login;