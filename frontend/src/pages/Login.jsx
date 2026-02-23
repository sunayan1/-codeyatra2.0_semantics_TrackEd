import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
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

        try {
            const res = await authAPI.login({ email, password, role });
            if (res.data && res.data.success) {
                const user = res.data.data?.user;
                const token = res.data.data?.token;
                const userRole = user?.role || role;
                login({ email: user?.email || email, role: userRole, id: user?.id, full_name: user?.full_name, faculty: user?.faculty }, token);
                navigate(userRole === "student" ? "/student" : "/teacher");
            } else {
                alert(res.data?.error || "Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert(error.message || "A server error occurred. Please try again later.");
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