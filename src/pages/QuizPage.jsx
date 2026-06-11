import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { ensureArray } from '../utils/safe';
import { useECCPState } from '../hooks/useECCPState';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logAuditEvent } = useECCPState();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const goBack = () => {
    const home = user?.role === 'admin' ? '/admin' : user?.role === 'mentor' ? '/mentor' : '/mentee';
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(home, { replace: true });
    }
  };

  useEffect(() => {
    setQuiz(null);
    setError('');
    setAnswers({});
    setResult(null);
    setTimeLeft(null);

    api.getQuiz(id).then(q => {
      setQuiz(q);
      const mins = q.time_limit_minutes || q.time_limit || 10;
      if (q.closes_at) {
        const secs = Math.max(0, Math.floor((new Date(q.closes_at) - new Date()) / 1000));
        setTimeLeft(secs || mins * 60);
      } else {
        setTimeLeft(mins * 60);
      }
      if (q.submitted) setResult(q.submission);
    }).catch((e) => {
      setError(e.message || 'Quiz unavailable');
    });
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      setError('Time expired! Quiz closed.');
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleSubmit = async () => {
    try {
      const res = await api.submitQuiz(id, answers);
      setResult(res);
      // Log quiz submission (academic progress)
      logAuditEvent({
        category: 'ACADEMIC',
        action: 'Quiz submitted',
        details: {
          quizId: id,
          quizTitle: quiz?.title || 'Unknown Quiz',
          score: res.score,
          maxScore: res.max_score,
          percentage: res.percentage
        },
        user
      });
    } catch (e) {
      setError(e.message || 'Failed to submit quiz');
    }
  };

  if (error && !quiz) {
    return (
      <div className="max-w-lg mx-auto card text-center py-12 space-y-4">
        <div className="text-4xl">📝</div>
        <p className="text-gray-600">{error}</p>
        <button onClick={goBack} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  if (!quiz) return <div className="animate-pulse text-gray-400">Loading quiz...</div>;

  const questions = ensureArray(quiz.questions);

  if (result) {
    return (
      <div className="max-w-lg mx-auto card text-center py-12">
        <div className="text-6xl mb-4">{result.percentage >= 70 ? '🎉' : result.percentage >= 40 ? '👍' : '💪'}</div>
        <h2 className="font-display text-2xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-4xl font-bold text-equity-red mb-2">{result.score}/{result.max_score}</p>
        <p className="text-gray-500 mb-6">{result.percentage}% — Keep pushing forward!</p>
        <button onClick={goBack} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto card text-center py-12 space-y-4">
        <p className="text-gray-600">This quiz has no questions yet.</p>
        <button onClick={goBack} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold">{quiz.title}</h1>
        {timeLeft !== null && (
          <span className={`badge text-lg px-4 py-2 ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
            ⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {questions.map((q, i) => (
        <div key={q.id || i} className="card">
          <p className="font-medium mb-4">Q{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {ensureArray(q.options).map((opt, oi) => (
              <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                answers[q.id] === oi ? 'border-equity-red bg-equity-red/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}
        className="btn-primary w-full disabled:opacity-50">
        Submit Answers
      </button>
    </div>
  );
}
