import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useECCPState } from '../hooks/useECCPState';

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
  const { logAuditEvent } = useECCPState();

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
      // Log successful session restore
      logAuditEvent({
        category: 'SECURITY',
        action: 'Session restored',
        details: { role: u?.role },
        user: u
      });
    } catch (err) {
      if (err.message?.includes('Cannot reach the server')) {
        setServerUnreachable(true);
      } else {
        localStorage.removeItem('eccp_token');
        setUser(null);
        // Log failed session restore (invalid token)
        logAuditEvent({
          category: 'SECURITY',
          action: 'Session restore failed (invalid token)',
          details: { reason: err.message },
          user: null
        });
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
    try {
      const { token, user: u } = await api.login(identifier, password, role);
      localStorage.setItem('eccp_token', token);
      sessionStorage.setItem('eccp_last_role', role);
      setUser(u);
      setServerUnreachable(false);
      // Log successful login
      logAuditEvent({
        category: 'SECURITY',
        action: 'User login',
        details: { role, identifier },
        user: u
      });
      return u;
    } catch (err) {
      // Log failed login attempt
      logAuditEvent({
        category: 'SECURITY',
        action: 'Failed login attempt',
        details: { role, identifier, reason: err.message },
        user: null
      });
      throw err;
    }
  };

  const logout = () => {
    const currentUser = user;
    localStorage.removeItem('eccp_token');
    setUser(null);
    // Log logout
    logAuditEvent({
      category: 'SECURITY',
      action: 'User logout',
      details: {},
      user: currentUser
    });
  };

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
      // Log user refresh (token validation)
      logAuditEvent({
        category: 'SECURITY',
        action: 'User refreshed (token valid)',
        details: {},
        user: u
      });
      return u;
    } catch (err) {
      if (!err.message?.includes('Cannot reach the server')) {
        localStorage.removeItem('eccp_token');
        setUser(null);
        // Log user refresh failed (invalid token)
        logAuditEvent({
          category: 'SECURITY',
          action: 'User refresh failed (invalid token)',
          details: { reason: err.message },
          user: null
        });
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
