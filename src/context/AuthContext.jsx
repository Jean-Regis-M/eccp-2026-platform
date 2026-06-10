import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('eccp_token');
    if (token) {
      api.me()
        .then(u => { if (active) setUser(u); })
        .catch(() => {
          localStorage.removeItem('eccp_token');
          if (active) setUser(null);
        })
        .finally(() => { if (active) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, []);

  const login = async (identifier, password, role) => {
    const { token, user: u } = await api.login(identifier, password, role);
    localStorage.setItem('eccp_token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('eccp_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
      return u;
    } catch {
      localStorage.removeItem('eccp_token');
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
