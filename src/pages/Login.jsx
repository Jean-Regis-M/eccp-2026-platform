import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkApiHealth } from '../api';
import { getSavedPath } from '../components/RoutePersistence';
import ThemeToggle from '../components/ThemeToggle';

const roleConfig = {
  mentee: { title: 'Scholar Login', subtitle: 'Enter your PF Number', identifierLabel: 'PF Number', identifierPlaceholder: 'e.g. 56647', icon: '🎓' },
  mentor: { title: 'Mentor Login', subtitle: 'Enter your email address', identifierLabel: 'Email', identifierPlaceholder: 'your@email.com', icon: '🧑‍🏫' },
  admin: { title: 'Admin Login', subtitle: 'Program administration', identifierLabel: 'Email', identifierPlaceholder: 'admin@email.com', icon: '🛡️' },
};

function getRememberKey(role) {
  return `eccp_remember_${role}`;
}

export default function Login() {
  const { role } = useParams();
  const config = roleConfig[role] || roleConfig.mentee;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverOk, setServerOk] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(getRememberKey(role));
    if (saved) {
      try {
        const { identifier: id, remember } = JSON.parse(saved);
        if (remember && id) { setIdentifier(id); setRememberMe(true); }
      } catch { /* ignore */ }
    }
    checkApiHealth(4).then(setServerOk);
    const t = setInterval(() => checkApiHealth(2).then(setServerOk), 10000);
    return () => clearInterval(t);
  }, [role]);

  const postLoginNavigate = (user) => {
    const saved = getSavedPath();
    const dashboard = `/${user.role === 'admin' ? 'admin' : user.role}`;
    if (saved && saved !== '/' && !saved.startsWith('/login')) {
      navigate(saved, { replace: true });
    } else {
      navigate(dashboard, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password, role);
      if (rememberMe) {
        localStorage.setItem(getRememberKey(role), JSON.stringify({ identifier, remember: true }));
      } else {
        localStorage.removeItem(getRememberKey(role));
      }
      postLoginNavigate(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const { api } = await import('../api');
      if (resetToken && newPassword) {
        await api.resetPassword(resetToken, newPassword);
        setError('');
        alert('Password reset successful! Please login.');
        setShowReset(false);
      } else {
        const res = await api.resetPasswordRequest(identifier, role);
        if (res.token) {
          setResetToken(res.token);
          alert('Reset token generated. Enter your new password below.');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-equity-dark via-equity-navy to-equity-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-equity-red rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-equity-gold rounded-full blur-3xl" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle className="bg-white/10 text-white border border-white/20 hover:bg-white/20" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="text-white/60 text-sm hover:text-white mb-6 inline-block">← Back to Home</Link>
        <div className="bg-white dark:bg-equity-navy rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">{config.icon}</div>
            <h1 className="font-display text-2xl font-bold text-equity-dark dark:text-white">{config.title}</h1>
            <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">{config.subtitle}</p>
          </div>

          {serverOk === false && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-sm p-3 rounded-lg mb-4">
              <p className="font-semibold">Connecting to server...</p>
              <p className="mt-1 text-xs">If this persists, open PowerShell in the project folder and run: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">npm run dev</code></p>
              <p className="mt-1 text-xs">Then use <strong>http://localhost:5173</strong> (not a file from Downloads).</p>
            </div>
          )}
          {serverOk === true && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs p-2 rounded-lg mb-4 text-center">✅ Server connected — you can sign in</div>
          )}

          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{config.identifierLabel}</label>
                <input type={role === 'mentee' ? 'text' : 'email'} value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder={config.identifierPlaceholder} className="input-field" required autoComplete="username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="input-field" required autoComplete="current-password" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 accent-equity-red" />
                Remember my login details
              </label>
              <button type="submit" disabled={loading || serverOk === false} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {role === 'mentee' ? (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 text-xs p-3 rounded-lg text-center">
                  <p className="font-semibold">Forgot your password?</p>
                  <p className="mt-1">Scholars cannot reset passwords online. Please contact your mentor to reset it for you.</p>
                </div>
              ) : (
                <button type="button" onClick={() => setShowReset(true)} className="text-sm text-equity-red hover:underline w-full text-center">
                  Forgot password?
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{config.identifierLabel}</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className="input-field" required />
              </div>
              {resetToken && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Reset Token</label>
                    <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" minLength={8} required />
                  </div>
                </>
              )}
              <button type="submit" className="btn-primary w-full">
                {resetToken ? 'Set New Password' : 'Request Reset'}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="text-sm text-gray-500 w-full text-center">Back to login</button>
            </form>
          )}

          {role === 'mentee' && (
            <p className="text-xs text-gray-400 text-center mt-6">Default password: Cohort@2026 — you must change it after first login</p>
          )}
        </div>
      </div>
    </div>
  );
}
