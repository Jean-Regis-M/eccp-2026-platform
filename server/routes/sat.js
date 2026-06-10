import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const exams = db.prepare('SELECT * FROM sat_exams ORDER BY created_at DESC').all();
  const enriched = exams.map(e => {
    let submission = null;
    if (req.user.role === 'mentee') {
      submission = db.prepare('SELECT * FROM sat_submissions WHERE exam_id = ? AND user_id = ?').get(e.id, req.user.id);
    }
    const submissionCount = db.prepare('SELECT COUNT(*) as c FROM sat_submissions WHERE exam_id = ?').get(e.id).c;
    return { ...e, submission, submission_count: submissionCount };
  });
  res.json(enriched);
});

router.post('/', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { title, description, link, time_limit } = req.body;
  const result = db.prepare(`
    INSERT INTO sat_exams (title, description, link, mentor_id, time_limit) VALUES (?, ?, ?, ?, ?)
  `).run(title, description || '', link || '', req.user.id, time_limit || 60);
  res.json({ id: result.lastInsertRowid, message: 'SAT exam created' });
});

router.put('/:id/close', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  db.prepare("UPDATE sat_exams SET is_active = 0, closed_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ message: 'SAT exam closed' });
});

router.post('/:id/submit', authenticate, requireRole('mentee'), (req, res) => {
  const exam = db.prepare('SELECT * FROM sat_exams WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found or closed' });

  const { score, notes } = req.body;
  db.prepare(`
    INSERT INTO sat_submissions (exam_id, user_id, score, notes) VALUES (?, ?, ?, ?)
    ON CONFLICT(exam_id, user_id) DO UPDATE SET score = ?, notes = ?, submitted_at = datetime('now')
  `).run(req.params.id, req.user.id, score, notes || '', score, notes || '');

  res.json({ message: 'Submission recorded' });
});

router.get('/:id/submissions', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  let query = `
    SELECT ss.*, u.name, u.pf_number FROM sat_submissions ss
    JOIN users u ON ss.user_id = u.id WHERE ss.exam_id = ?
  `;
  const params = [req.params.id];
  if (req.user.role === 'mentor') {
    query += ' AND u.mentor_id = ?';
    params.push(req.user.id);
  }
  res.json(db.prepare(query).all(...params));
});

export default router;
