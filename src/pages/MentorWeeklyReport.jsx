import { useState, useEffect } from 'react';
import { api } from '../api';
import { ensureArray } from '../utils/safe';
import { useAuth } from '../context/AuthContext';
import { useECCPState } from '../hooks/useECCPState';

export default function MentorWeeklyReport() {
  const [dates, setDates] = useState({
    week_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    week_end: new Date().toISOString().split('T')[0],
  });
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ challenges: '', actions_taken: '', recommendations: '', goals_next_week: '', reflections: '' });
  const [loading, setLoading] = useState(false);
  const { scholars, reviewAbsenceExcuse, logAuditEvent } = useECCPState();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMentorReportPreview(dates);
      setPreview(data);
      if (data.saved) setForm({
        challenges: data.saved.challenges || '',
        actions_taken: data.saved.actions_taken || '',
        recommendations: data.saved.recommendations || '',
        goals_next_week: data.saved.goals_next_week || '',
        reflections: data.saved.reflections || '',
      });
      // Log mentor report preview loaded (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Mentor report preview loaded',
        details: {
          weekStart: dates.week_start,
          weekEnd: dates.week_end,
          mentorId: preview?.mentor?.id || null,
          mentorName: preview?.mentor?.name || 'Unknown',
          hasSavedData: !!data.saved
        },
        user
      });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    await api.saveMentorReport({ ...dates, ...form });
    alert('Report sections saved! You can now download the PDF.');
    // Log mentor report sections saved (academic progress)
    logAuditEvent({
      category: 'ACADEMIC',
      action: 'Mentor report sections saved',
      details: {
        weekStart: dates.week_start,
        weekEnd: dates.week_end,
        formData: { ...form }
      },
      user
    });
    load();
  };

  const handleDownload = async () => {
    try {
      await api.saveMentorReport({ ...dates, ...form });
      await api.downloadMentorReportPdf(dates);
      // Log mentor report PDF downloaded (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Mentor report PDF downloaded',
        details: {
          weekStart: dates.week_start,
          weekEnd: dates.week_end
        },
        user
      });
    } catch (e) {
      alert('Downloading report... If sections are empty, the PDF will still include the full structure.');
      await api.downloadMentorReportPdf(dates);
      // Log mentor report PDF downloaded (academic progress) even in error case
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Mentor report PDF downloaded',
        details: {
          weekStart: dates.week_start,
          weekEnd: dates.week_end
        },
        user
      });
    }
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDates = ensureArray(preview?.weekDates);
  const attendanceGrid = ensureArray(preview?.attendanceGrid);
  const followUp = ensureArray(preview?.followUp);
  const sessions = ensureArray(preview?.sessions);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-equity-navy to-equity-dark rounded-3xl p-8 text-white">
        <h1 className="font-display text-2xl font-bold">Weekly Mentorship Report</h1>
        <p className="text-white/70 mt-1">Equity Leaders Program — College Counselling Program (ECCP)</p>
        <p className="text-xs text-equity-gold mt-2">Executive Monitoring & Compliance Document</p>
      </div>

      <div className="card flex flex-wrap gap-4 items-end">
        <div><label className="text-sm font-medium">Week Start</label><input type="date" value={dates.week_start} onChange={e => setDates({ ...dates, week_start: e.target.value })} className="input-field mt-1" /></div>
        <div><label className="text-sm font-medium">Week End</label><input type="date" value={dates.week_end} onChange={e => setDates({ ...dates, week_end: e.target.value })} className="input-field mt-1" /></div>
        <button onClick={load} className="btn-secondary">Load Week</button>
        <button onClick={handleSave} className="btn-outline">Save Sections</button>
        <button onClick={handleDownload} className="btn-primary ml-auto">📥 Download PDF Report</button>
      </div>

      {loading && <p className="text-gray-400 animate-pulse">Loading report data...</p>}

      {preview && (
        <>
          {/* Section 1 Preview */}
          <div className="card-glow border-l-4 border-equity-red">
            <h2 className="font-display font-bold text-lg text-equity-red mb-4">Section 1: Attendance Summary & Scholar Engagement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Scholar</th>
                    {weekDates.map((d, i) => <th key={d} className="p-2 text-center">{DAYS[i] || d}</th>)}
                    <th className="p-2">Missed</th>
                    <th className="p-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceGrid.map(m => (
                    <tr key={m.id} className={`border-b ${m.needsFollowUp ? 'bg-red-50' : ''}`}>
                      <td className="p-2 font-medium">{m.name}</td>
                      {weekDates.map(d => (
                        <td key={d} className={`p-2 text-center font-bold ${m.days[d] === 'P' ? 'text-green-600' : m.days[d] === 'A' ? 'text-red-600' : 'text-gray-300'}`}>
                          {m.days[d] || '—'}
                        </td>
                      ))}
                      <td className="p-2 text-center">{m.missed}</td>
                      <td className="p-2 text-center">{m.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {followUp.length > 0 && (
            <div className="card bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">⚠️ Follow-up & Intervention Tracker</h3>
              <div className="space-y-2">
                {followUp.map(m => {
                  // Find the scholar record to check excuse status
                  const scholar = scholars.find(s => s.pfNumber === m.pf_number);
                  const excuseSubmitted = scholar?.absenceExcuseSubmitted || false;

                  return (
                    <div key={m.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-red-100">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <p className="font-medium">{m.name} <span className="text-gray-400 font-mono text-xs">PF {m.pf_number}</span></p>
                        <p className="text-sm text-red-700">Missed {m.missed} session(s) • Score: {m.score} • Profile: {m.profile_completed ? 'Complete' : 'Incomplete'}</p>
                        {/* Absence Excuse Review - shown if excuse has been submitted */}
                        {excuseSubmitted && (
                          <div className="mt-2 space-x-2 text-xs">
                            <button
                              onClick={async () => {
                                // Guard: only mentor/reviewer can excuse
                                if (user.role !== 'mentor' && user.role !== 'admin') {
                                  alert('Unauthorized: Only mentors and administrators can review excuses');
                                  return;
                                }
                                if (confirm(`Approve absence excuse for ${m.name}?`)) {
                                  const { reviewAbsenceExcuse } = await import('../hooks/useECCPState');
                                  reviewAbsenceExcuse(m.pf_number, 'APPROVE', user);
                                  load(); // Reload to reflect changes
                                }
                              }}
                              className="bg-green-100 text-green-800 hover:bg-green-200 rounded px-2 py-1"
                            >
                              Approve Excuse
                            </button>
                            <button
                              onClick={async () => {
                                // Guard: only mentor/reviewer can excuse
                                if (user.role !== 'mentor' && user.role !== 'admin') {
                                  alert('Unauthorized: Only mentors and administrators can review excuses');
                                  return;
                                }
                                if (confirm(`Dismiss absence excuse for ${m.name}?`)) {
                                  const { reviewAbsenceExcuse } = await import('../hooks/useECCPState');
                                  reviewAbsenceExcuse(m.pf_number, 'DISMISS', user);
                                  load(); // Reload to reflect changes
                                }
                              }}
                              className="bg-red-100 text-red-800 hover:bg-red-200 rounded px-2 py-1"
                            >
                              Dismiss Excuse
                            </button>
                          </div>
                        )}
                        {!excuseSubmitted && m.missed > 0 && (
                          <p className="mt-1 text-xs text-gray-500">Awaiting excuse submission...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-3">Section 2: Session Summaries (Mon–Sat)</h3>
            {sessions.length === 0 ? <p className="text-gray-400">No sessions this week</p> : sessions.map(s => (
              <div key={s.id} className="border-b py-2 last:border-0">
                <p className="font-medium text-equity-red">{s.date}: {s.topic}</p>
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'challenges', label: 'Section 4: Challenges Encountered', placeholder: 'Describe challenges faced this week...' },
              { key: 'actions_taken', label: 'Section 5: Actions Taken', placeholder: 'What actions did you take to address challenges?' },
              { key: 'recommendations', label: 'Section 6: Recommendations & Strategic Adjustments', placeholder: 'Your recommendations for the program...' },
              { key: 'goals_next_week', label: 'Section 7: Goals for Next Week', placeholder: 'Goals aligned with upcoming sessions...' },
              { key: 'reflections', label: 'Section 8: Mentorship Reflections & 360° Support', placeholder: 'Your reflections on mentorship this week...' },
            ].map(f => (
              <div key={f.key} className="card md:col-span-2">
                <label className="font-semibold text-equity-dark block mb-2">{f.label}</label>
                <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} className="input-field h-28 resize-none" />
              </div>
            ))}
          </div>

          <div className="card bg-gray-50 border-2 border-dashed border-gray-300">
            <h3 className="font-semibold mb-2">Section 9: Mentor Declaration</h3>
            <p className="text-sm text-gray-600 italic">
              I hereby confirm that the information provided in this weekly report is accurate, truthful, and complies with the Equity College Counselling Mentor Guidelines 2026. I understand that misrepresentation may lead to disciplinary action.
            </p>
            <p className="text-sm mt-4 font-medium">Mentor: {preview.mentor?.name || '—'} • Date: {new Date().toISOString().split('T')[0]}</p>
            <p className="text-xs text-gray-500 mt-2">Download the PDF, sign it, and email to the org admin for filing.</p>
          </div>
        </>
      )}
    </div>
  );
}
