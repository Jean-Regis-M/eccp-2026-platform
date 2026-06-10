import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eccp_token');
    if (token) {
      api.me().then(setUser).catch(() => {
        localStorage.removeItem('eccp_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
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
    const u = await api.me();
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
