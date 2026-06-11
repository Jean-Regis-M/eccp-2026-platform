import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useECCPState } from '../hooks/useECCPState';

export default function ForcePasswordChange() {
  const { user, refreshUser } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user?.must_change_password) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPass !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.changePassword(current, newPass);
      await refreshUser();
      // Log forced password change (security)
      logAuditEvent({
        category: 'SECURITY',
        action: 'Forced password change completed',
        details: {
          userId: user?.id || null,
          userRole: user?.role || null,
          wasMandatory: true
        },
        user
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-equity-navy rounded-2xl shadow-2xl max-w-md w-full p-8 border border-equity-red/20">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="font-display text-xl font-bold text-equity-dark dark:text-white">Change Your Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
            For security, you must set a new password before continuing. Scholars cannot use &quot;Forgot Password&quot; — contact your mentor if you need help.
          </p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current password" className="input-field" required />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (min 8 chars)" className="input-field" minLength={8} required />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" className="input-field" minLength={8} required />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Updating...' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
