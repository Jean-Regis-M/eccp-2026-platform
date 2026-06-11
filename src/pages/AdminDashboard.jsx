import { useState, useEffect } from 'react';
import { api } from '../api';
import { ensureArray } from '../utils/safe';
import Modal from '../components/Modal';
import ProgramTimeline from '../components/ProgramTimeline';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/passwordValidator';
import { useECCPState } from '../hooks/useECCPState';
import AdminSurveillanceHub from '../components/AdminSurveillanceHub';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { setScholarSuspensionStatus, logAuditEvent } = useECCPState();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [platformHistory, setPlatformHistory] = useState(null);
  const [tab, setTab] = useState('overview');
  const [sessionForm, setSessionForm] = useState({ date: new Date().toISOString().split('T')[0], topic: '', description: '', message_to_scholars: '', google_drive_url: '' });
  const [msgForm, setMsgForm] = useState({ target_type: 'all_scholars', subject: '', content: '' });
  const [credResult, setCredResult] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [reminderModal, setReminderModal] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [newScholar, setNewScholar] = useState({ pf_number: '', name: '', email: '', gender: 'F', school: '', mentor_id: '' });
  const [smtpForm, setSmtpForm] = useState({ smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '' });

  const load = () => {
    api.getAdminDashboard().then(setData).catch(() => {});
    api.getAllUsers().then(setUsers).catch(() => {});
    api.getMentors().then(setMentors).catch(() => {});
    api.getAuditLog().then(setAuditLog).catch(() => {});
    api.getPlatformHistory().then(setPlatformHistory).catch(() => {});
    api.getSettings().then(setSmtpForm).catch(() => {});
  };
  useEffect(load, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    await api.createSession({ ...sessionForm, is_global: true });
    setSessionForm({ date: new Date().toISOString().split('T')[0], topic: '', description: '', message_to_scholars: '', google_drive_url: '' });
    alert('Session created!');
    load();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await api.sendMessage(msgForm);
    setMsgForm({ target_type: 'all_scholars', subject: '', content: '' });
    alert('Message broadcast sent!');
  };

  const handleResetPassword = async (userToReset) => {
    // Guard: only admin can reset passwords
    if (user.role !== 'admin') {
      alert('Unauthorized: Only administrators can reset passwords');
      return;
    }
    setResetModal({ user: userToReset, loading: true });
    try {
      const res = await api.resetUserPassword(userToReset.id);
      setResetModal({ user: userToReset, result: res, loading: false });
      load();
    } catch (e) {
      setResetModal({ user: userToReset, error: e.message, loading: false });
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await api.sendReminders();
      setReminderModal(res);
      load();
    } catch (e) { alert(e.message); }
    setSendingReminders(false);
  };

  const handleAddScholar = async (e) => {
    e.preventDefault();
    // Guard: only admin can add scholars
    if (user.role !== 'admin') {
      alert('Unauthorized: Only administrators can add scholars');
      return;
    }
    const scholarData = { ...newScholar, role: 'mentee', mentor_id: parseInt(newScholar.mentor_id) };
    await api.createUser(scholarData);
    setNewScholar({ pf_number: '', name: '', email: '', gender: 'F', school: '', mentor_id: '' });
    // Log scholar added (roster operation)
    logAuditEvent({
      category: 'ROSTER',
      action: 'Scholar added',
      details: scholarData,
      user
    });
    load();
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    // Guard: only admin can update settings
    if (user.role !== 'admin') {
      alert('Unauthorized: Only administrators can update email settings');
      return;
    }
    await api.updateSettings(smtpForm);
    // Log settings update (system action)
    logAuditEvent({
      category: 'SYSTEM',
      action: 'Email settings updated',
      details: smtpForm,
      user
    });
    alert('Email settings saved!');
  };

  if (!data) return <div className="animate-pulse text-gray-400">Loading admin dashboard...</div>;

  const stats = data.stats || {};
  const mentorPerformance = ensureArray(data.mentor_performance);
  const inactiveScholars = ensureArray(data.inactive_scholars);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-equity-red to-red-800 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="font-display text-3xl font-bold">Admin Command Center</h1>
        <p className="text-white/70">ECCP 2026 Program Coordination</p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {[
          { label: 'Scholars', value: stats.total_scholars ?? 0, color: 'text-equity-red' },
          { label: 'Mentors', value: stats.total_mentors ?? 0, color: 'text-equity-navy' },
          { label: 'Sessions', value: stats.total_sessions ?? 0, color: 'text-equity-gold' },
          { label: 'Profiles Done', value: stats.profiles_completed ?? 0, color: 'text-green-600' },
          { label: 'Today Attendance', value: stats.today_attendance ?? 0, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card"><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['overview', 'sessions', 'messages', 'users', 'mentors', 'history', 'timeline', 'email', 'surveillance'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? 'bg-equity-red text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {t === 'history' ? 'Platform History' : t === 'email' ? 'Email Settings' : t === 'surveillance' ? 'Surveillance' : t}
          </button>
        ))}
        <button onClick={() => api.exportProfiles()} className="btn-outline text-sm ml-auto">📥 Export Profiles</button>
        <button onClick={handleSendReminders} disabled={sendingReminders} className="btn-primary text-sm">
          {sendingReminders ? 'Sending...' : '📧 Send Reminders'}
        </button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="card">
            <h3 className="font-semibold mb-4">Mentor Performance</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500 text-left">
                <th className="pb-2">Mentor</th><th className="pb-2">Scholars</th><th className="pb-2">Avg Score</th><th className="pb-2">Sessions</th><th className="pb-2">Messages</th>
              </tr></thead>
              <tbody>
                {mentorPerformance.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium">{m.name}</td>
                    <td className="py-2">{m.mentee_count}</td>
                    <td className="py-2"><span className="badge bg-equity-red/10 text-equity-red">{m.avg_mentee_score}</span></td>
                    <td className="py-2">{m.sessions_created}</td>
                    <td className="py-2">{m.messages_sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inactiveScholars.length > 0 && (
            <div className="card border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold text-yellow-800 mb-3">⚠️ Scholars Needing Follow-up ({inactiveScholars.length})</h3>
              {inactiveScholars.map(s => (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span>{s.name} (PF {s.pf_number}) — {s.mentor_name}</span>
                  <button onClick={async () => { const r = await api.sendCredentials(s.id); setCredResult(r); }} className="text-equity-red hover:underline">Send Credentials</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'sessions' && (
        <form onSubmit={handleCreateSession} className="card space-y-4">
          <h3 className="font-semibold">Create Global Session</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="date" value={sessionForm.date} onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} className="input-field" required />
            <input value={sessionForm.topic} onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })} placeholder="Topic" className="input-field" required />
          </div>
          <textarea value={sessionForm.description} onChange={e => setSessionForm({ ...sessionForm, description: e.target.value })} placeholder="Description" className="input-field h-20" />
          <textarea value={sessionForm.message_to_scholars} onChange={e => setSessionForm({ ...sessionForm, message_to_scholars: e.target.value })} placeholder="Message to all scholars" className="input-field h-16" />
          <input value={sessionForm.google_drive_url} onChange={e => setSessionForm({ ...sessionForm, google_drive_url: e.target.value })} placeholder="Google Drive URL" className="input-field" />
          <button type="submit" className="btn-primary">Create Session</button>
        </form>
      )}

      {tab === 'messages' && (
        <form onSubmit={handleSendMessage} className="card space-y-4">
          <h3 className="font-semibold">Broadcast to All</h3>
          <select value={msgForm.target_type} onChange={e => setMsgForm({ ...msgForm, target_type: e.target.value })} className="input-field">
            <option value="all_scholars">All Scholars</option>
            <option value="all_mentors">All Mentors</option>
          </select>
          <input value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} placeholder="Subject" className="input-field" required />
          <textarea value={msgForm.content} onChange={e => setMsgForm({ ...msgForm, content: e.target.value })} placeholder="Message" className="input-field h-32" required />
          <button type="submit" className="btn-primary">Send Broadcast</button>
        </form>
      )}

      {tab === 'users' && (
        <>
          <form onSubmit={handleAddScholar} className="card space-y-3 bg-green-50/50 border-green-200">
            <h3 className="font-semibold text-green-800">+ Add New Scholar</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input value={newScholar.pf_number} onChange={e => setNewScholar({ ...newScholar, pf_number: e.target.value })} placeholder="PF Number" className="input-field" required />
              <input value={newScholar.name} onChange={e => setNewScholar({ ...newScholar, name: e.target.value })} placeholder="Full Name" className="input-field" required />
              <input value={newScholar.email} onChange={e => setNewScholar({ ...newScholar, email: e.target.value })} placeholder="Email" className="input-field" required />
              <input value={newScholar.school} onChange={e => setNewScholar({ ...newScholar, school: e.target.value })} placeholder="School" className="input-field" />
              <select value={newScholar.mentor_id} onChange={e => setNewScholar({ ...newScholar, mentor_id: e.target.value })} className="input-field" required>
                <option value="">Assign Mentor</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button type="submit" className="btn-primary">Add Scholar</button>
            </div>
          </form>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-gray-500 text-left">
                <th className="p-3">PF</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Mentor</th><th className="p-3">Status</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {users.filter(u => u.role === 'mentee').map(u => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{u.pf_number}</td>
                    <td className="p-3">{u.name}</td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3">{u.mentor_name || '—'}</td>
                    <td className="p-3">{u.is_active ? <span className="badge bg-green-100 text-green-700">Active</span> : <span className="badge bg-red-100 text-red-700">Removed</span>}</td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => handleResetPassword(u)} className="text-xs text-equity-red hover:underline font-medium">Reset Password</button>
                      <button onClick={async () => { const r = await api.sendCredentials(u.id); setCredResult(r); }} className="text-xs text-blue-600 hover:underline">Credentials</button>
                      <button onClick={async () => {
                        // Guard: only admin can update user status
                        if (user.role !== 'admin') {
                          alert('Unauthorized: Only administrators can update user status');
                          return;
                        }
                        if (confirm(`${u.is_active ? 'Remove' : 'Restore'} ${u.name}?`)) {
                          await api.updateUser(u.id, { is_active: u.is_active ? 0 : 1 });
                          // Log scholar status change (roster operation)
                          logAuditEvent({
                            category: 'ROSTER',
                            action: `${u.is_active ? 'Scholar removed' : 'Scholar restored'}`,
                            details: { scholarId: u.id, pfNumber: u.pf_number, name: u.name, isActive: !u.is_active },
                            user
                          });
                          load();
                        }
                      }} className="text-xs text-gray-500 hover:underline">
                        {u.is_active ? 'Remove' : 'Restore'}
                      </button>
                      {/* Suspension Controls */}
                      <div className="flex flex-col space-x-1 px-1 pt-1">
                        {u.role === 'mentee' && (
                          <>
                            <button
                              onClick={async () => {
                                // Guard: only admin can update suspension status
                                if (user.role !== 'admin') {
                                  alert('Unauthorized: Only administrators can update suspension status');
                                  return;
                                }
                                const isCurrentlySuspended = u.isSuspended || false;
                                const reason = prompt("Enter reason for suspension:", isCurrentlySuspended ? u.suspensionReason || "" : "");
                                if (reason !== null) { // User didn't cancel
                                  setScholarSuspensionStatus(u.pf_number, !isCurrentlySuspended, reason, user);
                                  load(); // Reload to reflect changes
                                }
                              }}
                              className="text-xs {user.role === 'admin' ? (u.isSuspended ? 'text-equity-red' : 'text-equity-green') : 'text-gray-400'} hover:underline font-medium"
                            >
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'mentors' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {users.filter(u => u.role === 'mentor').map(u => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3"><button onClick={() => handleResetPassword(u)} className="text-equity-red hover:underline text-sm">Reset Password</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && platformHistory && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => api.downloadPlatformHistory().catch(e => alert(e.message))} className="btn-primary text-sm">📥 Download Full History (CSV)</button>
          </div>
          <div className="card overflow-x-auto max-h-[50vh]">
            <h3 className="font-semibold mb-4">🔍 Platform History — Full Chronological Log</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500 text-left"><th className="pb-2">Time</th><th className="pb-2">User</th><th className="pb-2">Role</th><th className="pb-2">Action</th><th className="pb-2">Details</th></tr></thead>
              <tbody>
                {platformHistory.platform_history?.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-xs text-gray-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-2">{l.user_name || '—'}</td>
                    <td className="py-2 capitalize">{l.user_role}</td>
                    <td className="py-2"><span className="badge bg-purple-100 text-purple-800">{l.action}</span></td>
                    <td className="py-2 text-gray-600">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-x-auto max-h-[40vh]">
            <h3 className="font-semibold mb-4">🔐 Login Attempts (Security)</h3>
            <table className="w-full text-sm">
              <tbody>
                {platformHistory.login_attempts?.slice(0, 50).map(l => (
                  <tr key={l.id} className={`border-b ${l.success ? '' : 'bg-red-50/50'}`}>
                    <td className="py-1 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-1">{l.identifier}</td>
                    <td className="py-1 capitalize">{l.role}</td>
                    <td className="py-1">{l.success ? '✅' : '❌ Failed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'timeline' && <ProgramTimeline editable />}

      {tab === 'email' && (
        <form onSubmit={handleSaveSmtp} className="card space-y-4 max-w-lg">
          <h3 className="font-semibold">SMTP Email Configuration</h3>
          <p className="text-sm text-gray-500">Configure to enable automatic reminder & credential emails. Use Gmail App Password or SendGrid.</p>
          <input value={smtpForm.smtp_host || ''} onChange={e => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })} placeholder="SMTP Host (e.g. smtp.gmail.com)" className="input-field" />
          <input value={smtpForm.smtp_port || '587'} onChange={e => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })} placeholder="Port" className="input-field" />
          <input value={smtpForm.smtp_user || ''} onChange={e => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })} placeholder="SMTP Username / Email" className="input-field" />
          <input type="password" value={smtpForm.smtp_pass || ''} onChange={e => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value })} placeholder="SMTP Password / App Password" className="input-field" />
          <input value={smtpForm.smtp_from || ''} onChange={e => setSmtpForm({ ...smtpForm, smtp_from: e.target.value })} placeholder="From Address" className="input-field" />
          <button type="submit" className="btn-primary">Save Email Settings</button>
        </form>
      )}

      {tab === 'surveillance' && (
        <AdminSurveillanceHub />
      )}

      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title="Password Reset">
        {resetModal?.loading && <p className="animate-pulse">Resetting password...</p>}
        {resetModal?.result && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <p className="font-semibold text-green-800">✅ Password reset for {resetModal.result.user.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 font-mono text-sm">
              <p><strong>Login:</strong> {resetModal.result.login_hint}</p>
              <p><strong>Temporary Password:</strong> <span className="text-equity-red font-bold">{resetModal.result.temporary_password}</span></p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`Login: ${resetModal.result.login_hint}\nPassword: ${resetModal.result.temporary_password}`); alert('Copied!'); }} className="btn-primary w-full">📋 Copy Credentials</button>
          </div>
        )}
        {resetModal?.error && <p className="text-red-600">{resetModal.error}</p>}
      </Modal>

      <Modal open={!!reminderModal} onClose={() => setReminderModal(null)} title="Reminders Sent" wide>
        {reminderModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-xl"><p className="text-2xl font-bold text-green-600">{reminderModal.sent}</p><p className="text-sm">Sent</p></div>
              <div className="bg-yellow-50 p-4 rounded-xl"><p className="text-2xl font-bold text-yellow-600">{reminderModal.queued}</p><p className="text-sm">Queued</p></div>
              <div className="bg-blue-50 p-4 rounded-xl"><p className="text-2xl font-bold text-blue-600">{reminderModal.count}</p><p className="text-sm">Total</p></div>
            </div>
            <p className="text-sm text-gray-600">{reminderModal.message}</p>
            {reminderModal.reminders?.slice(0, 5).map((r, i) => (
              <div key={i} className="text-xs bg-gray-50 p-3 rounded-lg"><strong>{r.to}</strong>: {r.subject}</div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!credResult} onClose={() => setCredResult(null)} title="Login Credentials" wide>
        {credResult && (
          <div>
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{credResult.body}</pre>
            <button onClick={() => { navigator.clipboard.writeText(credResult.body); alert('Copied!'); }} className="btn-primary mt-4">📋 Copy to Clipboard</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
