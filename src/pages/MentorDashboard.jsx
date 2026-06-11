import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Modal from '../components/Modal';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [todaySession, setTodaySession] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], topic: '', description: '', message_to_scholars: '' });
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('Cohort@2026');

  useEffect(() => {
    api.getMentees().then(setMentees).catch(() => {});
    api.getTodaySession().then(setTodaySession).catch(() => {});
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    await api.createSession({ ...form, is_global: false });
    setShowCreate(false);
    setForm({ date: new Date().toISOString().split('T')[0], topic: '', description: '', message_to_scholars: '' });
  };

  const avgScore = mentees.length ? Math.round(mentees.reduce((s, m) => s + (m.score || 0), 0) / mentees.length) : 0;
  const profilesComplete = mentees.filter(m => m.profile_completed).length;
  const needsFollowUp = mentees.filter(m => !m.profile_completed || (m.score || 0) < 30 || (m.attendance || 0) === 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-equity-navy to-equity-dark rounded-3xl p-8 text-white shadow-xl">
        <h1 className="font-display text-3xl font-bold">Mentor Dashboard</h1>
        <p className="text-white/70 mt-1">Welcome, {user?.name}</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <Link to="/sessions" className="bg-white/20 px-4 py-2 rounded-xl text-sm hover:bg-white/30">📋 Mark Today's Attendance</Link>
          <Link to="/mentor-report" className="bg-equity-gold/30 px-4 py-2 rounded-xl text-sm hover:bg-equity-gold/40">📥 Weekly Report PDF</Link>
        </div>
      </div>

      {todaySession && (
        <div className="card-glow border-l-4 border-equity-red">
          <h3 className="font-semibold">Today's Session: {todaySession.topic}</h3>
          <p className="text-sm text-gray-500 mt-1">{todaySession.description}</p>
          <Link to="/sessions" className="btn-primary text-sm mt-3 inline-block">Mark Scholar Attendance →</Link>
        </div>
      )}

      {needsFollowUp.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <h3 className="font-semibold text-red-800 mb-3">🔔 Scholars Needing Follow-up ({needsFollowUp.length})</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {needsFollowUp.map(m => (
              <div key={m.id} className="bg-white p-3 rounded-xl border border-red-100 text-sm">
                <p className="font-medium">{m.name} <span className="text-gray-400 font-mono">PF {m.pf_number}</span></p>
                <p className="text-red-600 text-xs mt-1">
                  {!m.profile_completed && 'Profile incomplete • '}
                  {(m.attendance || 0) === 0 && 'No attendance • '}
                  {(m.score || 0) < 30 && 'Low engagement'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-3xl font-bold text-equity-red">{mentees.length}</p><p className="text-sm text-gray-500 mt-1">My Scholars</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-green-600">{profilesComplete}</p><p className="text-sm text-gray-500 mt-1">Profiles Complete</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-equity-navy">{avgScore}</p><p className="text-sm text-gray-500 mt-1">Avg Score</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-amber-600">{needsFollowUp.length}</p><p className="text-sm text-gray-500 mt-1">Need Follow-up</p></div>
      </div>

      <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">+ Create Session for My Scholars</button>

      {showCreate && (
        <form onSubmit={handleCreateSession} className="card space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" required />
            <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Session Topic" className="input-field" required />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field h-20" />
          <textarea value={form.message_to_scholars} onChange={e => setForm({ ...form, message_to_scholars: e.target.value })} placeholder="Message to your scholars" className="input-field h-16" />
          <button type="submit" className="btn-primary">Create Session</button>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="bg-equity-dark text-white px-6 py-3"><h2 className="font-display font-bold">My Scholars Progress</h2></div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left">
              <th className="pb-3 pr-4">PF</th><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">School</th>
              <th className="pb-3 pr-4">Profile</th><th className="pb-3 pr-4">Attendance</th><th className="pb-3 pr-4">Score</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody>
              {mentees.sort((a, b) => (b.score || 0) - (a.score || 0)).map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i < 3 ? 'bg-yellow-50/30' : ''}`}>
                  <td className="py-3 pr-4 font-mono text-xs">{m.pf_number}</td>
                  <td className="py-3 pr-4 font-medium">{m.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{m.school || '—'}</td>
                  <td className="py-3 pr-4">{m.profile_completed ? '✅' : <span className="text-red-500">⏳</span>}</td>
                  <td className="py-3 pr-4">{m.attendance || 0}</td>
                  <td className="py-3 pr-4"><span className="badge bg-equity-red/10 text-equity-red font-bold">{m.score || 0}</span></td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <button onClick={() => api.downloadScholarPdf(m.id, m.pf_number).catch(e => alert(e.message))} className="text-xs text-equity-navy dark:text-equity-gold hover:underline">📥 PDF</button>
                    <button onClick={() => { setResetTarget(m); setNewPassword('Cohort@2026'); }} className="text-xs text-equity-red hover:underline">Reset Password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget?.name}`}>
        <p className="text-sm text-gray-500 mb-4">Upon scholar request, set a new password. Share it securely with the scholar.</p>
        <input value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field mb-4" placeholder="New password" />
        <button onClick={async () => {
          await api.mentorResetMenteePassword(resetTarget.id, newPassword);
          alert(`Password reset for ${resetTarget.name}. New password: ${newPassword}`);
          setResetTarget(null);
        }} className="btn-primary w-full">Confirm Reset</button>
      </Modal>
    </div>
  );
}
