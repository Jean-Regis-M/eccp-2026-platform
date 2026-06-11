import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import AttendanceModal from '../components/AttendanceModal';
import { useECCPState } from '../hooks/useECCPState';

export default function Sessions() {
  const { user } = useAuth();
  const { logAuditEvent } = useECCPState();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [quizForm, setQuizForm] = useState({ title: '', time_limit_minutes: 10, questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] });
  const [uploadFile, setUploadFile] = useState(null);

  const load = (q) => api.getSessions(q).then(setSessions).catch(() => {});
  useEffect(() => { load(); }, []);

  const viewDetails = async (s) => {
    setSelected(s);
    setShowEdit(false);
    setFeedback([]);
    if (user.role !== 'mentee') {
      try {
        const fb = await api.getSessionFeedback(s.id);
        setFeedback(Array.isArray(fb) ? fb : []);
      } catch {
        setFeedback([]);
      }
    }
  };

  const openAttendance = (s) => setAttendanceModal(s);

  const handleEdit = async (e) => {
    e.preventDefault();
    await api.updateSession(selected.id, editForm);
    if (uploadFile) await api.uploadSessionFile(selected.id, uploadFile);
    setShowEdit(false);
    load(search);
    alert('Session updated!');
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this session permanently?')) return;
    // Get session details before deleting for logging
    const sessionToDelete = sessions.find(s => s.id === id);
    await api.deleteSession(id);
    setSelected(null);
    load(search);
    // Log session deleted (system action)
    logAuditEvent({
      category: 'SYSTEM',
      action: 'Session deleted',
      details: {
        sessionId: id,
        sessionTopic: sessionToDelete?.topic || 'Unknown',
        sessionDate: sessionToDelete?.date || null
      },
      user
    });
  };

  const startEdit = (s) => {
    setEditForm({ date: s.date, topic: s.topic, description: s.description, message_to_scholars: s.message_to_scholars, google_drive_url: s.google_drive_url, session_link: s.session_link || '', presentation_url: s.presentation_url || '' });
    setShowEdit(true);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const quizData = { session_id: selected.id, title: quizForm.title, time_limit_minutes: quizForm.time_limit_minutes, questions: quizForm.questions };
    await api.createQuiz(quizData);
    setShowQuiz(false);
    alert(`Quiz published! Scholars have ${quizForm.time_limit_minutes} minutes to complete it.`);
    // Log quiz created (academic progress)
    logAuditEvent({
      category: 'ACADEMIC',
      action: 'Quiz created',
      details: quizData,
      user
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-equity-red to-equity-navy bg-clip-text text-transparent">📚 Sessions</h1>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..." className="input-field md:w-72" />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} onClick={() => viewDetails(s)}
              className={`card cursor-pointer transition-all hover:shadow-xl ${selected?.id === s.id ? 'ring-2 ring-equity-red' : ''}`}>
              <p className="text-xs text-equity-red font-semibold">{s.date} {s.is_future && <span className="text-gray-400">(Upcoming)</span>}</p>
              <h3 className="font-semibold text-lg">{s.topic}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>👥 {s.attendance_count}</span><span>💬 {s.feedback_count}</span>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card-glow sticky top-24 space-y-4">
            <h2 className="font-display font-bold text-xl">{selected.topic}</h2>
            <p className="text-equity-red text-sm font-medium">{selected.date}</p>
            <p className="text-gray-600">{selected.description}</p>

            {selected.session_link && <a href={selected.session_link} target="_blank" rel="noopener" className="btn-primary inline-block text-sm">🎥 Join Session</a>}
            {selected.google_drive_url && <a href={selected.google_drive_url} target="_blank" rel="noopener" className="text-equity-red text-sm block hover:underline">📁 Google Drive Materials</a>}
            {selected.presentation_url && <a href={selected.presentation_url} target="_blank" rel="noopener" className="text-blue-600 text-sm block hover:underline">📎 Presentation</a>}

            {user.role === 'mentee' && (
              <div className={`p-4 rounded-xl text-sm ${selected.user_attended ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                {selected.user_attended ? '✅ Attendance confirmed by your mentor' : '⏳ Awaiting mentor attendance confirmation'}
              </div>
            )}

            {user.role !== 'mentee' && (
              <div className="flex flex-wrap gap-2">
                {selected.can_mark_attendance && (
                  <button onClick={() => openAttendance(selected)} className="btn-primary">👥 Mark Attendance</button>
                )}
                <button onClick={() => startEdit(selected)} className="btn-outline text-sm">✏️ Edit</button>
                {user.role === 'admin' && <button onClick={() => handleDelete(selected.id)} className="text-red-600 text-sm border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50">🗑 Delete</button>}
                <button onClick={() => setShowQuiz(!showQuiz)} className="btn-secondary text-sm">+ Quiz</button>
              </div>
            )}

            {showEdit && (
              <form onSubmit={handleEdit} className="border rounded-xl p-4 space-y-3 bg-slate-50">
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="input-field" />
                <input value={editForm.topic} onChange={e => setEditForm({ ...editForm, topic: e.target.value })} placeholder="Topic" className="input-field" />
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className="input-field h-20" />
                <input value={editForm.session_link} onChange={e => setEditForm({ ...editForm, session_link: e.target.value })} placeholder="Session Link (Zoom/Meet)" className="input-field" />
                <input value={editForm.google_drive_url} onChange={e => setEditForm({ ...editForm, google_drive_url: e.target.value })} placeholder="Google Drive URL" className="input-field" />
                <input value={editForm.presentation_url} onChange={e => setEditForm({ ...editForm, presentation_url: e.target.value })} placeholder="Presentation Link" className="input-field" />
                <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="input-field" />
                <button type="submit" className="btn-primary w-full">Save Changes</button>
              </form>
            )}

            {showQuiz && user.role !== 'mentee' && (
              <form onSubmit={handleCreateQuiz} className="border rounded-xl p-4 space-y-3 bg-gray-50">
                <input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Quiz Title" className="input-field" required />
                <div>
                  <label className="text-sm font-medium">Time Limit (minutes)</label>
                  <select value={quizForm.time_limit_minutes} onChange={e => setQuizForm({ ...quizForm, time_limit_minutes: +e.target.value })} className="input-field mt-1">
                    {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                  <p className="text-xs text-red-600 mt-1">Quiz auto-closes after time limit. Scholars who miss it lose ranking points.</p>
                </div>
                {quizForm.questions.map((q, qi) => (
                  <div key={qi} className="border-t pt-2">
                    <input value={q.question} onChange={e => { const qs = [...quizForm.questions]; qs[qi].question = e.target.value; setQuizForm({ ...quizForm, questions: qs }); }} placeholder={`Q${qi + 1}`} className="input-field mb-2" required />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2 mb-1">
                        <input type="radio" checked={q.correct_answer === oi} onChange={() => { const qs = [...quizForm.questions]; qs[qi].correct_answer = oi; setQuizForm({ ...quizForm, questions: qs }); }} />
                        <input value={opt} onChange={e => { const qs = [...quizForm.questions]; qs[qi].options[oi] = e.target.value; setQuizForm({ ...quizForm, questions: qs }); }} className="input-field text-sm" required />
                      </div>
                    ))}
                  </div>
                ))}
                <button type="button" onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correct_answer: 0 }] })} className="text-sm text-equity-red">+ Question</button>
                <button type="submit" className="btn-primary w-full">Publish Timed Quiz</button>
              </form>
            )}

            {user.role !== 'mentee' && feedback.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Scholar Feedback</h3>
                {feedback.map(f => (
                  <div key={f.id} className="bg-gray-50 p-3 rounded-xl mb-2 text-sm">
                    <p className="font-medium">{f.name} — {'⭐'.repeat(f.understanding_rating)}</p>
                    <p className="text-gray-600">{f.feelings}</p>
                    {f.questions && <p className="text-blue-600">Q: {f.questions}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AttendanceModal session={attendanceModal} open={!!attendanceModal} onClose={() => setAttendanceModal(null)} onSaved={() => load(search)} />
    </div>
  );
}
