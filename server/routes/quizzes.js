import { Router } from 'express';
import db, { logHistory } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logActivity } from '../utils/audit.js';

const router = Router();

function isQuizOpen(quiz) {
  if (!quiz.is_active) return false;
  const now = new Date().toISOString();
  if (quiz.opens_at && quiz.opens_at > now) return false;
  if (quiz.closes_at && quiz.closes_at < now) return false;
  return true;
}

function closeExpiredQuizzes() {
  db.prepare("UPDATE quizzes SET is_active = 0, closed_at = datetime('now') WHERE is_active = 1 AND closes_at IS NOT NULL AND closes_at < datetime('now')").run();
  const expired = db.prepare("SELECT id FROM quizzes WHERE is_active = 0 AND closes_at IS NOT NULL AND closes_at < datetime('now')").all();
  for (const q of expired) {
    const mentees = db.prepare('SELECT id FROM users WHERE role = ? AND is_active = 1').all('mentee');
    for (const m of mentees) {
      const sub = db.prepare('SELECT id FROM quiz_submissions WHERE quiz_id = ? AND user_id = ?').get(q.id, m.id);
      if (!sub) {
        db.prepare('INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, max_score, missed) VALUES (?, ?, ?, 0, 0, 1)').run(q.id, m.id, '{}');
        logActivity(m.id, 'quiz_missed', `Missed quiz ${q.id}`);
      }
    }
  }
}

router.get('/', authenticate, (req, res) => {
  closeExpiredQuizzes();
  const quizzes = db.prepare('SELECT q.*, s.topic as session_topic, s.date as session_date FROM quizzes q LEFT JOIN sessions s ON q.session_id = s.id ORDER BY q.created_at DESC').all();

  res.json(quizzes.map(q => {
    const questionCount = db.prepare('SELECT COUNT(*) as c FROM quiz_questions WHERE quiz_id = ?').get(q.id).c;
    let submission = null;
    if (req.user.role === 'mentee') {
      submission = db.prepare('SELECT score, max_score, missed FROM quiz_submissions WHERE quiz_id = ? AND user_id = ?').get(q.id, req.user.id);
    }
    return { ...q, question_count: questionCount, submission, is_open: isQuizOpen(q), time_limit_minutes: q.time_limit };
  }));
});

router.get('/:id', authenticate, (req, res) => {
  closeExpiredQuizzes();
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const questions = db.prepare('SELECT id, question, options, points FROM quiz_questions WHERE quiz_id = ?').all(req.params.id);
  const parsed = questions.map(q => ({ ...q, options: JSON.parse(q.options) }));

  if (req.user.role === 'mentee') {
    if (!isQuizOpen(quiz)) return res.status(403).json({ error: 'Quiz is closed or not yet open' });
    const submission = db.prepare('SELECT * FROM quiz_submissions WHERE quiz_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (submission) return res.status(400).json({ error: 'You already submitted or missed this quiz', submission });
    return res.json({ ...quiz, questions: parsed, time_limit_minutes: quiz.time_limit, closes_at: quiz.closes_at });
  }

  const submissions = db.prepare(`SELECT qs.*, u.name, u.pf_number FROM quiz_submissions qs JOIN users u ON qs.user_id = u.id WHERE qs.quiz_id = ?`).all(req.params.id);
  res.json({ ...quiz, questions: parsed, submissions });
});

router.post('/', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { session_id, title, time_limit, time_limit_minutes, questions } = req.body;
  const minutes = time_limit_minutes || time_limit || 10;
  if (!title || !questions?.length) return res.status(400).json({ error: 'Title and questions required' });

  const opensAt = new Date().toISOString();
  const closesAt = new Date(Date.now() + minutes * 60000).toISOString();

  const result = db.prepare(`
    INSERT INTO quizzes (session_id, title, mentor_id, time_limit, opens_at, closes_at) VALUES (?, ?, ?, ?, ?, ?)
  `).run(session_id || null, title, req.user.id, minutes, opensAt, closesAt);

  const insertQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, points) VALUES (?, ?, ?, ?, ?)');
  for (const q of questions) {
    insertQ.run(result.lastInsertRowid, q.question, JSON.stringify(q.options), q.correct_answer, q.points || 1);
  }

  logHistory(req.user.id, '', req.user.role, 'quiz_create', 'quiz', result.lastInsertRowid, `${title} (${minutes} min)`);
  res.json({ id: result.lastInsertRowid, closes_at: closesAt, time_limit_minutes: minutes, message: 'Quiz published — auto-closes after time limit' });
});

router.post('/:id/submit', authenticate, requireRole('mentee'), (req, res) => {
  closeExpiredQuizzes();
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz || !isQuizOpen(quiz)) return res.status(404).json({ error: 'Quiz closed — time expired' });

  const existing = db.prepare('SELECT id FROM quiz_submissions WHERE quiz_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(400).json({ error: 'Already submitted' });

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(req.params.id);
  const answers = req.body.answers || {};
  let score = 0, maxScore = 0;
  for (const q of questions) {
    maxScore += q.points;
    if (answers[q.id] === q.correct_answer) score += q.points;
  }

  db.prepare('INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, max_score, missed) VALUES (?, ?, ?, ?, ?, 0)')
    .run(req.params.id, req.user.id, JSON.stringify(answers), score, maxScore);
  logActivity(req.user.id, 'quiz_submit', `${quiz.title}: ${score}/${maxScore}`);
  res.json({ score, max_score: maxScore, percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0 });
});

router.put('/:id/close', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  db.prepare("UPDATE quizzes SET is_active = 0, closed_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ message: 'Quiz closed' });
});

export default router;
