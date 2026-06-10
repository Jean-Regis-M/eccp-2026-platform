import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkApiHealth } from '../api';

const roleConfig = {
  mentee: { title: 'Scholar Login', subtitle: 'Enter your PF Number', identifierLabel: 'PF Number', identifierPlaceholder: 'e.g. 56647', icon: '🎓' },
  mentor: { title: 'Mentor Login', subtitle: 'Enter your email address', identifierLabel: 'Email', identifierPlaceholder: 'your@email.com', icon: '🧑‍🏫' },
  admin: { title: 'Admin Login', subtitle: 'Program administration', identifierLabel: 'Email', identifierPlaceholder: 'admin@email.com', icon: '🛡️' },
};

export default function Login() {
  const { role } = useParams();
  const config = roleConfig[role] || roleConfig.mentee;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverOk, setServerOk] = useState(null);

  useEffect(() => {
    checkApiHealth().then(setServerOk);
    const t = setInterval(() => checkApiHealth().then(setServerOk), 8000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password, role);
      navigate(`/${user.role === 'admin' ? 'admin' : user.role}`);
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
    <div className="min-h-screen bg-gradient-to-br from-equity-dark to-equity-navy flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="text-white/60 text-sm hover:text-white mb-6 inline-block">← Back to Home</Link>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">{config.icon}</div>
            <h1 className="font-display text-2xl font-bold text-equity-dark">{config.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{config.subtitle}</p>
          </div>

          {serverOk === false && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 rounded-lg mb-4">
              <p className="font-semibold">Server not running</p>
              <p className="mt-1 text-xs">Open PowerShell in the project folder and run: <code className="bg-amber-100 px-1 rounded">npm run dev</code></p>
              <p className="mt-1 text-xs">Then use <strong>http://localhost:5173</strong> (not a file from Downloads).</p>
            </div>
          )}
          {serverOk === true && (
            <div className="bg-green-50 text-green-700 text-xs p-2 rounded-lg mb-4 text-center">✅ Server connected — you can sign in</div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{config.identifierLabel}</label>
                <input type={role === 'mentee' ? 'text' : 'email'} value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder={config.identifierPlaceholder} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="input-field" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button type="button" onClick={() => setShowReset(true)} className="text-sm text-equity-red hover:underline w-full text-center">
                Forgot password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{config.identifierLabel}</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className="input-field" required />
              </div>
              {resetToken && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reset Token</label>
                    <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
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
            <p className="text-xs text-gray-400 text-center mt-6">Default password: Cohort@2026 — change after first login</p>
          )}
        </div>
      </div>
    </div>
  );
}
