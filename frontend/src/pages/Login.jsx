import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return setError("Please fill all fields.");

        setIsLoading(true);
        setError("");

        try {
            const res = await authAPI.login({ email, password });

            if (res.success && res.data) {
                const { token, user: profile } = res.data;
                const userRole = profile?.role || role;

                login(
                    {
                        id: profile?.id,
                        email: profile?.email || email,
                        full_name: profile?.full_name || "",
                        role: userRole,
                    },
                    token
                );

                navigate(userRole === "student" ? "/student" : "/teacher");
            } else {
                setError("Invalid credentials. Please try again.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "A server error occurred. Please try again later.");
        } finally {
            setIsLoading(false);
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

                {error && <p className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

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
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? "Signing in…" : "Sign In"}
                    </button>
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