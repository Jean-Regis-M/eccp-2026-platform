import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function SatExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', link: '', time_limit: 60 });
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submitForm, setSubmitForm] = useState({ score: '', notes: '' });

  const load = () => api.getSatExams().then(setExams).catch(() => {});
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createSatExam(form);
    setShowCreate(false);
    setForm({ title: '', description: '', link: '', time_limit: 60 });
    load();
  };

  const viewSubmissions = async (exam) => {
    setSelected(exam);
    if (user.role !== 'mentee') {
      const subs = await api.getSatSubmissions(exam.id);
      setSubmissions(subs);
    }
  };

  const handleSubmit = async (examId) => {
    await api.submitSat(examId, submitForm);
    setSubmitForm({ score: '', notes: '' });
    load();
    alert('Submission recorded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">📝 SAT Exam Coordination</h1>
        {user.role !== 'mentee' && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">+ New SAT Exam</button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Exam Title (e.g. SAT Practice Test 5)" className="input-field" required />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Instructions" className="input-field h-20" />
          <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Bluebook/Khan Academy Link" className="input-field" />
          <input type="number" value={form.time_limit} onChange={e => setForm({ ...form, time_limit: +e.target.value })} placeholder="Time limit (minutes)" className="input-field" />
          <button type="submit" className="btn-primary">Create Exam</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {exams.map(exam => (
          <div key={exam.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{exam.title}</h3>
              <span className={`badge ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {exam.is_active ? 'Active' : 'Closed'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{exam.description}</p>
            {exam.link && <a href={exam.link} target="_blank" rel="noopener" className="text-equity-red text-sm hover:underline block mb-3">🔗 Open Exam Link</a>}
            <p className="text-xs text-gray-400">⏱️ {exam.time_limit} min • {exam.submission_count} submissions</p>

            {user.role === 'mentee' && exam.is_active && !exam.submission && (
              <div className="mt-3 space-y-2">
                <input type="number" value={submitForm.score} onChange={e => setSubmitForm({ ...submitForm, score: e.target.value })} placeholder="Your Score" className="input-field" />
                <input value={submitForm.notes} onChange={e => setSubmitForm({ ...submitForm, notes: e.target.value })} placeholder="Notes (optional)" className="input-field" />
                <button onClick={() => handleSubmit(exam.id)} className="btn-primary w-full">Submit Score</button>
              </div>
            )}
            {exam.submission && <p className="mt-3 text-green-600 text-sm">✅ Submitted: Score {exam.submission.score}</p>}

            {user.role !== 'mentee' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => viewSubmissions(exam)} className="text-sm text-equity-red hover:underline">View Submissions</button>
                {exam.is_active && <button onClick={async () => { await api.closeSatExam(exam.id); load(); }} className="text-sm text-gray-500 hover:underline">Close Exam</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && submissions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Submissions for: {selected.title}</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left"><th className="pb-2">Scholar</th><th className="pb-2">PF</th><th className="pb-2">Score</th><th className="pb-2">Notes</th></tr></thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2">{s.name}</td><td className="py-2 font-mono text-xs">{s.pf_number}</td>
                  <td className="py-2 font-bold">{s.score}</td><td className="py-2 text-gray-500">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
