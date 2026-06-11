import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkApiHealth } from '../api';
import { getSavedPath } from '../components/RoutePersistence';
import Logo from '../components/Logo';

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


  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center py-12 px-4 overflow-hidden aurora-animate-glow" id="auth-gateway">
      {/* Ambient Glowing Orbs mimicking Gemini's modern UI transitions */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[130px] pointer-events-none aurora-glow-blob-1 z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none aurora-glow-blob-2 z-0" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none aurora-glow-blob-1 z-0" />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="bg-white/10 text-white border border-white/20 hover:bg-white/20" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="text-white/60 text-sm hover:text-white mb-6 inline-block">← Back to Home</Link>
        <div className="bg-slate-900/75 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block hover:scale-105 transition-all duration-300">
              <Logo layout="vertical" iconHeight={48} className="mx-auto" />
              {/* Subtle logo back-shadow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-15" />
            </div>

            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-3" />

            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight font-display">
              ECCP Counselor Cohort
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              The unified launchpad for Rwandan academic excellence. Synchronizing admissions profiles, essay developments, and live telemetry.
            </p>
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
              {/* Contact Administrator Banner - Replaces Forgot Password functionality */}
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs p-3 rounded-lg text-center">
                <p className="font-semibold">To reset your password, contact your org admin!</p>
              </div>
            </form>
          )

          {role === 'mentee' && (
            <p className="text-xs text-slate-400 text-center mt-6">Default password: Cohort@2026 — you must change it after first login</p>
          )}
        </div>
      </div>
    </div>
  );
}
