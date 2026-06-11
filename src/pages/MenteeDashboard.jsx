import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProgramTimeline from '../components/ProgramTimeline';
import MenteeResponsibilities from '../components/MenteeResponsibilities';
import SATPrepSimulator from '../components/SATPrepSimulator';
import StaggeredParent from '../components/StaggeredParent';
import { useECCPState } from '../hooks/useECCPState';

const RATING_EMOJIS = ['😕', '😐', '🙂', '😊', '🤩'];
const RATING_LABELS = ['Struggled', 'Unclear', 'Okay', 'Good', 'Excellent'];

export default function MenteeDashboard() {
  const { user, refreshUser } = useAuth();
  const { logAuditEvent } = useECCPState();
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [rating, setRating] = useState(0);
  const [feelings, setFeelings] = useState('');
  const [questions, setQuestions] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.getTodaySession().then(setSession).catch(() => {});
    api.getMyProgress().then(setProgress).catch(() => {});
    api.getMessages().then(setMessages).catch(() => {});
    api.getPlatformContent().then(setContent).catch(() => {});
  }, []);

  const handleFeedback = async () => {
    setError('');
    if (!rating) { setError('Please rate your understanding'); return; }
    if (!feelings.trim()) { setError('Please share how you feel (required)'); return; }
    if (!questions.trim()) { setError('Please share your questions or thoughts (required)'); return; }
    try {
      const feedbackData = { understanding_rating: rating, feelings, questions };
      await api.submitFeedback(session.id, feedbackData);
      setFeedbackSent(true);
      refreshUser();
      api.getMyProgress().then(setProgress);
      // Log feedback submitted (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Session feedback submitted',
        details: {
          sessionId: session.id,
          sessionTopic: session.topic,
          rating: rating,
          hasFeelings: !!feelings.trim(),
          hasQuestions: !!questions.trim()
        },
        user
      });
    } catch (e) { setError(e.message); }
  };

  const adminMsgs = messages.filter(m => m.message_source === 'admin' && !m.is_read);
  const mentorMsgs = messages.filter(m => m.message_source === 'mentor' && !m.is_read);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-equity-red via-red-600 to-equity-navy rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="font-display text-3xl font-bold mb-2 relative">Welcome, {user?.name?.split(' ').pop()}! 👋</h1>
        <p className="text-white/80 relative">PF {user?.pf_number} • {user?.school || 'Please complete your school in profile'}</p>
        {!user?.profile_completed && (
          <Link to="/profile" className="inline-flex items-center gap-2 mt-4 bg-white/20 backdrop-blur px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition relative">
            ⚠️ Complete your profile — required for full program access →
          </Link>
        )}
      </div>

      {content?.quote_of_day && (
        <div className="card bg-gradient-to-r from-equity-navy to-equity-dark text-white text-center py-6">
          <p className="text-equity-gold text-xs uppercase tracking-widest mb-2">Daily Motivation</p>
          <p className="text-lg italic font-display">"{content.quote_of_day}"</p>
        </div>
      )}

      <MenteeResponsibilities />
      <ProgramTimeline />

      <div className="card-glow bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">📌 Important Program Notice</h3>
        <ul className="text-sm text-amber-800 space-y-2">
          <li>• Fill your profile <strong>seriously and completely</strong> — mentors use it to support your applications.</li>
          <li>• <strong>Ethical AI use:</strong> AI may assist brainstorming, but all essays and applications must reflect your authentic voice. Misuse may affect recommendations.</li>
          <li>• Feel free to <strong>reach out to your mentor</strong> anytime via Messages or email if you encounter any problem.</li>
          <li>• Your mentor marks attendance after each session — stay engaged and submit daily feedback.</li>
        </ul>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">📚 Academic Preparation</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sharpen your skills with standardized test practice to stay competitive for global university admissions.
        </p>
        <SATPrepSimulator />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-3xl font-bold text-equity-red">{progress?.score || 0}</p><p className="text-sm text-gray-500 mt-1">Your Score</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-green-600">{progress?.attendance || 0}</p><p className="text-sm text-gray-500 mt-1">Sessions Attended</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-equity-gold">{progress?.quizzes_taken || 0}</p><p className="text-sm text-gray-500 mt-1">Quizzes Done</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-equity-navy">{progress?.feedback_given || 0}</p><p className="text-sm text-gray-500 mt-1">Feedback Submitted</p></div>
      </div>

      <div className="card-glow">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">📚 Today's Session</h2>
        {session ? (
          <div>
            <h3 className="font-semibold text-equity-dark text-2xl">{session.topic}</h3>
            <p className="text-gray-600 mt-2">{session.description}</p>
            {session.message_to_scholars && <div className="mt-3 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">💬 {session.message_to_scholars}</div>}
            {session.google_drive_url && <a href={session.google_drive_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-4 text-equity-red font-medium hover:underline">📁 Open Session Materials →</a>}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {session.user_attendance ? <span className="badge bg-green-100 text-green-800 text-sm px-4 py-2">✅ Attendance recorded by your mentor</span>
                : <span className="badge bg-yellow-100 text-yellow-800 text-sm px-4 py-2">⏳ Awaiting mentor attendance confirmation</span>}
              {session.quiz && <Link to={`/quiz/${session.quiz.id}`} className="btn-primary">📝 Take Session Quiz</Link>}
            </div>
          </div>
        ) : <p className="text-gray-500">No session scheduled for today. Check the Sessions page.</p>}
      </div>

      {session && !feedbackSent && !session.user_feedback && (
        <div className="card border-2 border-equity-gold/40 bg-gradient-to-br from-white to-amber-50/50">
          <h2 className="font-display font-bold text-xl mb-2">💭 Daily Session Reflection <span className="text-red-500 text-sm">*All fields required</span></h2>
          <p className="text-sm text-gray-500 mb-4">How well did you understand today's topic?</p>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}
          <StaggeredParent className="flex gap-3 justify-center mb-6 flex-wrap">
            {RATING_EMOJIS.map((emoji, i) => (
              <button key={i} onClick={() => setRating(i + 1)} title={RATING_LABELS[i]}
                className={`flex flex-col items-center p-4 rounded-2xl transition-all ${rating === i + 1 ? 'bg-equity-red/10 scale-110 ring-2 ring-equity-red shadow-lg' : 'hover:bg-gray-100'}`}>
                <span className="text-4xl">{emoji}</span>
                <span className="text-xs mt-1 text-gray-500">{RATING_LABELS[i]}</span>
              </button>
            ))}
          </StaggeredParent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">How do you feel about today's session? *</label>
              <textarea value={feelings} onChange={e => setFeelings(e.target.value)} required placeholder="Share your honest feelings and thoughts..."
                className="input-field h-24 resize-none mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Questions or reflections for your mentor? *</label>
              <textarea value={questions} onChange={e => setQuestions(e.target.value)} required placeholder="Any questions? What would you like clarified?"
                className="input-field h-20 resize-none mt-1" />
            </div>
            <button onClick={handleFeedback} className="btn-primary w-full md:w-auto">Submit Reflection</button>
          </div>
        </div>
      )}
      {feedbackSent && <div className="card bg-green-50 border-green-200 text-green-800 text-center py-6">✅ Thank you! Your reflection has been recorded.</div>}

      {(adminMsgs.length > 0 || mentorMsgs.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {adminMsgs.length > 0 && (
            <div className="card border-l-4 border-purple-500">
              <h3 className="font-semibold flex items-center gap-2"><span className="badge-admin">Org Admin</span> {adminMsgs.length} new</h3>
              {adminMsgs.slice(0, 2).map(m => <p key={m.id} className="text-sm mt-2 text-gray-600 truncate">{m.subject}</p>)}
            </div>
          )}
          {mentorMsgs.length > 0 && (
            <div className="card border-l-4 border-blue-500">
              <h3 className="font-semibold flex items-center gap-2"><span className="badge-mentor">Your Mentor</span> {mentorMsgs.length} new</h3>
              {mentorMsgs.slice(0, 2).map(m => <p key={m.id} className="text-sm mt-2 text-gray-600 truncate">{m.subject}</p>)}
            </div>
          )}
          <Link to="/messages" className="md:col-span-2 text-center text-equity-red hover:underline text-sm">View all messages →</Link>
        </div>
      )}
    </div>
  );
}
