import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

async function fetchUserWithRetry(maxAttempts = 6) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await api.me();
    } catch (err) {
      const isNetwork = err.message?.includes('Cannot reach the server');
      if (!isNetwork || i === maxAttempts - 1) throw err;
      await new Promise(r => setTimeout(r, 600 + i * 400));
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverUnreachable, setServerUnreachable] = useState(false);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('eccp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const u = await fetchUserWithRetry();
      setUser(u);
      setServerUnreachable(false);
      if (u?.role) sessionStorage.setItem('eccp_last_role', u.role);
    } catch (err) {
      if (err.message?.includes('Cannot reach the server')) {
        setServerUnreachable(true);
      } else {
        localStorage.removeItem('eccp_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    restoreSession().then(() => { if (!active) return; });
    return () => { active = false; };
  }, [restoreSession]);

  const login = async (identifier, password, role) => {
    const { token, user: u } = await api.login(identifier, password, role);
    localStorage.setItem('eccp_token', token);
    sessionStorage.setItem('eccp_last_role', role);
    setUser(u);
    setServerUnreachable(false);
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
    } catch (err) {
      if (!err.message?.includes('Cannot reach the server')) {
        localStorage.removeItem('eccp_token');
        setUser(null);
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, serverUnreachable, retrySession: restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
