import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { logHistory } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logActivity } from '../utils/audit.js';
import { logAdminAction } from '../utils/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads', 'sessions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
});

const router = Router();

function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date());
}

function enrichSession(s, req) {
  const attendanceCount = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE session_id = ? AND attended = 1').get(s.id).c;
  const feedbackCount = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE session_id = ?').get(s.id).c;
  let userAttended = null;
  if (req.user.role === 'mentee') {
    userAttended = db.prepare('SELECT attended FROM attendance WHERE session_id = ? AND user_id = ?').get(s.id, req.user.id);
  }
  return {
    ...s,
    attendance_count: attendanceCount,
    feedback_count: feedbackCount,
    user_attended: userAttended?.attended || 0,
    can_mark_attendance: req.user.role !== 'mentee' && s.date <= todayStr(),
    is_future: s.date > todayStr(),
  };
}

router.get('/', authenticate, (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT s.*, u.name as created_by_name, m.name as mentor_name
    FROM sessions s
    LEFT JOIN users u ON s.created_by = u.id
    LEFT JOIN users m ON s.mentor_id = m.id
    WHERE COALESCE(s.is_deleted, 0) = 0
  `;
  const params = [];
  if (search) {
    query += ` AND (s.topic LIKE ? OR s.description LIKE ? OR s.date LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (req.user.role === 'mentor') {
    query += ' AND (s.is_global = 1 OR s.mentor_id = ? OR s.created_by = ?)';
    params.push(req.user.id, req.user.id);
  }
  query += ' ORDER BY s.date DESC';
  res.json(db.prepare(query).all(...params).map(s => enrichSession(s, req)));
});

router.get('/today', authenticate, (req, res) => {
  const today = todayStr();
  const session = db.prepare(`
    SELECT s.*, u.name as created_by_name FROM sessions s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.date = ? AND COALESCE(s.is_deleted,0)=0 ORDER BY s.id DESC LIMIT 1
  `).get(today);
  if (!session) return res.json(null);

  const quiz = db.prepare('SELECT * FROM quizzes WHERE session_id = ? AND is_active = 1').get(session.id);
  const userFeedback = db.prepare('SELECT * FROM feedback WHERE session_id = ? AND user_id = ?').get(session.id, req.user.id);
  const userAttendance = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND user_id = ?').get(session.id, req.user.id);

  res.json({ ...enrichSession(session, req), quiz, user_feedback: userFeedback, user_attendance: userAttendance });
});

router.post('/', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { date, topic, description, presentation_url, notes_url, message_to_scholars, google_drive_url, session_link, is_global } = req.body;
  if (!date || !topic) return res.status(400).json({ error: 'Date and topic required' });

  const mentorId = req.user.role === 'mentor' ? req.user.id : req.body.mentor_id || null;
  const result = db.prepare(`
    INSERT INTO sessions (date, topic, description, mentor_id, created_by, presentation_url, notes_url, message_to_scholars, google_drive_url, session_link, is_global)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(date, topic, description || '', mentorId, req.user.id, presentation_url || '', notes_url || '', message_to_scholars || '', google_drive_url || '', session_link || '', req.user.role === 'admin' ? (is_global !== false ? 1 : 0) : 0);

  logActivity(req.user.id, 'session_create', `Created: ${topic}`);
  logHistory(req.user.id, '', req.user.role, 'session_create', 'session', result.lastInsertRowid, topic);
  res.json({ id: result.lastInsertRowid, message: 'Session created' });
});

router.post('/:id/upload', authenticate, requireRole('admin', 'mentor'), upload.single('file'), (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = `/api/sessions/file/${req.file.filename}`;
  db.prepare('UPDATE sessions SET presentation_file = ?, presentation_url = COALESCE(presentation_url, ?) WHERE id = ?').run(fileUrl, fileUrl, req.params.id);
  res.json({ message: 'Uploaded', file: fileUrl });
});

router.get('/file/:filename', authenticate, (req, res) => {
  const fp = path.join(uploadDir, path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  res.download(fp);
});

router.put('/:id', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'mentor' && session.created_by !== req.user.id && session.mentor_id !== req.user.id) {
    return res.status(403).json({ error: 'Can only edit your own sessions' });
  }

  const { topic, description, presentation_url, notes_url, message_to_scholars, google_drive_url, session_link, date } = req.body;
  db.prepare(`
    UPDATE sessions SET topic = COALESCE(?, topic), description = COALESCE(?, description),
    presentation_url = COALESCE(?, presentation_url), notes_url = COALESCE(?, notes_url),
    message_to_scholars = COALESCE(?, message_to_scholars), google_drive_url = COALESCE(?, google_drive_url),
    session_link = COALESCE(?, session_link), date = COALESCE(?, date) WHERE id = ?
  `).run(topic, description, presentation_url, notes_url, message_to_scholars, google_drive_url, session_link, date, req.params.id);

  logHistory(req.user.id, '', req.user.role, 'session_edit', 'session', req.params.id, topic || session.topic);
  res.json({ message: 'Session updated' });
});

router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE sessions SET is_deleted = 1 WHERE id = ?').run(req.params.id);
  logAdminAction(req.user.id, 'session_delete', 'session', session.id, session.topic);
  logHistory(req.user.id, '', 'admin', 'session_delete', 'session', session.id, session.topic);
  res.json({ message: 'Session removed' });
});

router.put('/:id/attendance', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND COALESCE(is_deleted,0)=0').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.date > todayStr()) return res.status(400).json({ error: 'Cannot mark attendance for future sessions' });

  const { attendance } = req.body;
  if (!Array.isArray(attendance)) return res.status(400).json({ error: 'Attendance array required' });

  const upsert = db.prepare(`
    INSERT INTO attendance (session_id, user_id, attended, marked_by, marked_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(session_id, user_id) DO UPDATE SET attended = ?, marked_by = ?, marked_at = datetime('now')
  `);

  let savedCount = 0;
  let presentCount = 0;
  for (const { user_id, attended } of attendance) {
    if (req.user.role === 'mentor') {
      const mentee = db.prepare('SELECT mentor_id FROM users WHERE id = ? AND role = ?').get(user_id, 'mentee');
      if (mentee?.mentor_id !== req.user.id) continue;
    }
    const isPresent = attended ? 1 : 0;
    upsert.run(req.params.id, user_id, isPresent, req.user.id, isPresent, req.user.id);
    savedCount++;
    if (isPresent) presentCount++;
  }

  if (savedCount === 0) {
    return res.status(400).json({ error: 'No attendance records were saved. Check scholar assignments.' });
  }

  logActivity(req.user.id, 'attendance_mark', session.topic);
  logHistory(req.user.id, '', req.user.role, 'attendance_mark', 'session', session.id, session.topic);
  res.json({
    message: `Attendance saved — ${presentCount} present, ${savedCount - presentCount} absent (${savedCount} scholars total)`,
    saved: savedCount,
    present: presentCount,
    absent: savedCount - presentCount,
  });
});

router.get('/:id/attendance', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const session = db.prepare('SELECT date, topic FROM sessions WHERE id = ?').get(req.params.id);
  let query = `
    SELECT u.id, u.pf_number, u.name, COALESCE(a.attended, 0) as attended, a.marked_at
    FROM users u LEFT JOIN attendance a ON a.user_id = u.id AND a.session_id = ?
    WHERE u.role = 'mentee' AND u.is_active = 1
  `;
  const params = [req.params.id];
  if (req.user.role === 'mentor') { query += ' AND u.mentor_id = ?'; params.push(req.user.id); }

  res.json({
    session,
    can_mark: session && session.date <= todayStr(),
    is_future: session && session.date > todayStr(),
    scholars: db.prepare(query).all(...params),
  });
});

router.post('/:id/feedback', authenticate, requireRole('mentee'), (req, res) => {
  const { understanding_rating, feelings, questions } = req.body;
  if (!understanding_rating || !feelings?.trim() || !questions?.trim()) {
    return res.status(400).json({ error: 'Rating, feelings, and questions are all required' });
  }
  db.prepare(`
    INSERT INTO feedback (session_id, user_id, understanding_rating, feelings, questions) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(session_id, user_id) DO UPDATE SET understanding_rating=?, feelings=?, questions=?
  `).run(req.params.id, req.user.id, understanding_rating, feelings.trim(), questions.trim(), understanding_rating, feelings.trim(), questions.trim());
  logActivity(req.user.id, 'feedback_submit', 'Session feedback');
  res.json({ message: 'Feedback submitted' });
});

router.get('/:id/feedback', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  let query = `SELECT f.*, u.name, u.pf_number FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.session_id = ?`;
  const params = [req.params.id];
  if (req.user.role === 'mentor') { query += ' AND u.mentor_id = ?'; params.push(req.user.id); }
  res.json(db.prepare(query).all(...params));
});

router.get('/reports/weekly', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const start = req.query.week_start || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const end = req.query.week_end || new Date().toISOString().split('T')[0];
  const sessions = db.prepare('SELECT * FROM sessions WHERE date BETWEEN ? AND ? AND COALESCE(is_deleted,0)=0 ORDER BY date').all(start, end);

  const report = sessions.map(s => {
    const attendance = db.prepare(`
      SELECT u.name, u.pf_number, COALESCE(a.attended,0) as attended FROM users u
      LEFT JOIN attendance a ON a.user_id=u.id AND a.session_id=?
      WHERE u.role='mentee' AND u.is_active=1 ${req.user.role === 'mentor' ? 'AND u.mentor_id=?' : ''}
    `).all(...(req.user.role === 'mentor' ? [s.id, req.user.id] : [s.id]));
    const feedback = db.prepare(`
      SELECT u.name, f.understanding_rating, f.feelings, f.questions FROM feedback f
      JOIN users u ON f.user_id=u.id WHERE f.session_id=? ${req.user.role === 'mentor' ? 'AND u.mentor_id=?' : ''}
    `).all(...(req.user.role === 'mentor' ? [s.id, req.user.id] : [s.id]));
    return { ...s, attendance, feedback };
  });

  if (req.query.format === 'csv') {
    let csv = 'Date,Topic,Scholar,Attended,Rating\n';
    for (const s of report) {
      for (const a of (s.attendance.length ? s.attendance : [{ name: 'N/A', attended: 0 }])) {
        const fb = s.feedback.find(f => f.name === a.name) || {};
        csv += [s.date, s.topic, a.name, a.attended ? 'Yes' : 'No', fb.understanding_rating || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
      }
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=eccp-weekly-${start}.csv`);
    return res.send(csv);
  }
  res.json({ week_start: start, week_end: end, sessions: report });
});

export default router;
