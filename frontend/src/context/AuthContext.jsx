import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tracked_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData, token) => {
    const u = typeof userData === 'string' ? { email: userData, role: token } : userData;
    setUser(u);
    localStorage.setItem('tracked_user', JSON.stringify(u));
    if (typeof token === 'string' && token.length > 20) {
      localStorage.setItem('tracked_token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tracked_user');
    localStorage.removeItem('tracked_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};