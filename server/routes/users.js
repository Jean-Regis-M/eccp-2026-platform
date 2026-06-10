import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAdminAction, logActivity } from '../utils/audit.js';

const router = Router();

function computeScore(userId) {
  const attendance = db.prepare(`
    SELECT COUNT(*) as total FROM attendance WHERE user_id = ? AND attended = 1
  `).get(userId).total;

  const totalSessions = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c || 1;
  const attendanceScore = (attendance / totalSessions) * 40;

  const quizAvg = db.prepare(`
    SELECT AVG(CASE WHEN max_score > 0 THEN (score / max_score) * 100 ELSE 0 END) as avg
    FROM quiz_submissions WHERE user_id = ?
  `).get(userId).avg || 0;
  const quizScore = (quizAvg / 100) * 35;

  const feedbackCount = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE user_id = ?').get(userId).c;
  const feedbackScore = Math.min((feedbackCount / totalSessions) * 15, 15);

  const profileBonus = db.prepare('SELECT profile_completed FROM users WHERE id = ?').get(userId)?.profile_completed ? 10 : 0;

  const missedQuizzes = db.prepare('SELECT COUNT(*) as c FROM quiz_submissions WHERE user_id = ? AND missed = 1').get(userId).c;
  const missedPenalty = Math.min(missedQuizzes * 5, 25);

  return Math.max(0, Math.round(attendanceScore + quizScore + feedbackScore + profileBonus - missedPenalty));
}

router.get('/rankings', authenticate, (req, res) => {
  if (req.user.role === 'mentee') {
    return res.status(403).json({ error: 'Rankings are visible to mentors and administrators only' });
  }

  const mentees = db.prepare(`
    SELECT u.id, u.pf_number, u.name, u.school, u.mentor_id, m.name as mentor_name
    FROM users u LEFT JOIN users m ON u.mentor_id = m.id
    WHERE u.role = 'mentee' AND u.is_active = 1
  `).all();

  const ranked = mentees.map(m => ({
    ...m,
    score: computeScore(m.id),
    attendance: db.prepare('SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND attended = 1').get(m.id).c,
    quizzes_taken: db.prepare('SELECT COUNT(*) as c FROM quiz_submissions WHERE user_id = ?').get(m.id).c,
    feedback_given: db.prepare('SELECT COUNT(*) as c FROM feedback WHERE user_id = ?').get(m.id).c,
    profile_completed: db.prepare('SELECT profile_completed FROM users WHERE id = ?').get(m.id).profile_completed,
  })).sort((a, b) => b.score - a.score).map((m, i) => ({ ...m, rank: i + 1 }));

  if (req.user.role === 'mentor') {
    const filtered = ranked
      .filter(m => m.mentor_id === req.user.id)
      .map((m, i) => ({ ...m, rank: i + 1 }));
    return res.json(filtered);
  }

  res.json(ranked);
});

router.get('/my-progress', authenticate, requireRole('mentee'), (req, res) => {
  const score = computeScore(req.user.id);
  const attendance = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND attended = 1').get(req.user.id).c;
  const quizzes = db.prepare('SELECT COUNT(*) as c FROM quiz_submissions WHERE user_id = ?').get(req.user.id).c;
  const feedback = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE user_id = ?').get(req.user.id).c;
  res.json({ score, attendance, quizzes_taken: quizzes, feedback_given: feedback, profile_completed: db.prepare('SELECT profile_completed FROM users WHERE id = ?').get(req.user.id).profile_completed });
});

router.get('/export/rankings', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  let mentees = db.prepare(`
    SELECT u.id, u.pf_number, u.name, u.email, u.school, u.mentor_id, m.name as mentor_name
    FROM users u LEFT JOIN users m ON u.mentor_id = m.id
    WHERE u.role = 'mentee' AND u.is_active = 1
    ${req.user.role === 'mentor' ? 'AND u.mentor_id = ?' : ''}
    ORDER BY u.name
  `).all(...(req.user.role === 'mentor' ? [req.user.id] : []));

  const rows = mentees.map(m => {
    const score = computeScore(m.id);
    const attendance = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND attended = 1').get(m.id).c;
    const quizzes = db.prepare('SELECT COUNT(*) as c FROM quiz_submissions WHERE user_id = ?').get(m.id).c;
    const feedback = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE user_id = ?').get(m.id).c;
    return { ...m, score, attendance, quizzes_taken: quizzes, feedback_given: feedback };
  }).sort((a, b) => b.score - a.score).map((m, i) => ({ ...m, rank: i + 1 }));

  const csv = ['Rank,PF Number,Name,Email,School,Mentor,Score,Attendance,Quizzes,Feedback,Profile Complete'];
  for (const r of rows) {
    const pc = db.prepare('SELECT profile_completed FROM users WHERE id = ?').get(r.id).profile_completed;
    csv.push([r.rank, r.pf_number, r.name, r.email, r.school || '', r.mentor_name || '', r.score, r.attendance, r.quizzes_taken, r.feedback_given, pc ? 'Yes' : 'No']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=eccp-scholar-rankings.csv');
  res.send(csv.join('\n'));
});

router.get('/mentees', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  let query = `
    SELECT u.id, u.pf_number, u.name, u.email, u.gender, u.phone, u.school, u.mentor_id,
           u.profile_completed, u.profile_data, u.is_active, u.last_login, m.name as mentor_name
    FROM users u LEFT JOIN users m ON u.mentor_id = m.id
    WHERE u.role = 'mentee'
  `;
  const params = [];

  if (req.user.role === 'mentor') {
    query += ' AND u.mentor_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY u.name';
  const mentees = db.prepare(query).all(...params);

  const enriched = mentees.map(m => ({
    ...m,
    profile_data: JSON.parse(m.profile_data || '{}'),
    score: computeScore(m.id),
    attendance: db.prepare('SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND attended = 1').get(m.id).c,
  }));

  res.json(enriched);
});

router.get('/mentors', authenticate, (req, res) => {
  const mentors = db.prepare(`
    SELECT id, name, email, mentor_bio, mentor_linkedin, mentor_instagram, mentor_photo
    FROM users WHERE role = 'mentor' AND is_active = 1
  `).all();

  const enriched = mentors.map(m => {
    const menteeCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE mentor_id = ? AND is_active = 1').get(m.id).c;
    const mentees = db.prepare('SELECT id, name, pf_number FROM users WHERE mentor_id = ? AND is_active = 1').all(m.id);
    return { ...m, mentee_count: menteeCount, mentees };
  });

  res.json(enriched);
});

router.get('/admin/all', authenticate, requireRole('admin'), (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.pf_number, u.email, u.role, u.name, u.gender, u.school, u.mentor_id,
           u.is_active, u.last_login, m.name as mentor_name
    FROM users u LEFT JOIN users m ON u.mentor_id = m.id
    ORDER BY u.role, u.name
  `).all();
  res.json(users);
});

router.get('/:id', authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT id, pf_number, email, role, name, gender, phone, school, mentor_id,
           profile_completed, profile_data, mentor_bio, mentor_linkedin, mentor_instagram, mentor_photo, is_active, last_login
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.user.role === 'mentee' && req.user.id !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'mentor' && user.role === 'mentee' && user.mentor_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  user.profile_data = JSON.parse(user.profile_data || '{}');
  if (user.mentor_id) {
    user.mentor = db.prepare('SELECT id, name, email, mentor_bio, mentor_linkedin, mentor_instagram, mentor_photo FROM users WHERE id = ?').get(user.mentor_id);
  }
  user.score = user.role === 'mentee' ? computeScore(user.id) : null;
  res.json(user);
});

router.put('/profile', authenticate, (req, res) => {
  const { phone, school, profile_data, mentor_bio, mentor_linkedin, mentor_instagram } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (user.role === 'mentee') {
    const data = profile_data || JSON.parse(user.profile_data || '{}');
    const completed = !!(data.career_interests && data.subjects && data.goals && data.ai_acknowledgment && data.mentor_contact_ack && data.target_universities);
    db.prepare(`
      UPDATE users SET phone = ?, school = ?, profile_data = ?, profile_completed = ? WHERE id = ?
    `).run(phone || user.phone, school || user.school, JSON.stringify(data), completed ? 1 : 0, req.user.id);
  } else if (user.role === 'mentor') {
    db.prepare(`
      UPDATE users SET mentor_bio = ?, mentor_linkedin = ?, mentor_instagram = ? WHERE id = ?
    `).run(mentor_bio ?? user.mentor_bio, mentor_linkedin ?? user.mentor_linkedin, mentor_instagram ?? user.mentor_instagram, req.user.id);
  }

  db.prepare('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)').run(req.user.id, 'profile_update', 'Profile updated');
  res.json({ message: 'Profile updated' });
});

router.post('/admin/create', authenticate, requireRole('admin'), (req, res) => {
  const { pf_number, email, name, role, gender, school, mentor_id, password } = req.body;
  const hash = bcrypt.hashSync(password || (role === 'mentee' ? 'Cohort@2026' : 'Equity@2026'), 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (pf_number, email, password_hash, role, name, gender, school, mentor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pf_number || null, email?.toLowerCase(), hash, role, name, gender, school, mentor_id || null);
    logAdminAction(req.user.id, 'create_user', role, result.lastInsertRowid, `Created ${name}`);
    res.json({ id: result.lastInsertRowid, message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

router.put('/admin/:id', authenticate, requireRole('admin'), (req, res) => {
  const { mentor_id, is_active, name, email, school } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`
    UPDATE users SET mentor_id = COALESCE(?, mentor_id), is_active = COALESCE(?, is_active),
    name = COALESCE(?, name), email = COALESCE(?, email), school = COALESCE(?, school)
    WHERE id = ?
  `).run(mentor_id, is_active, name, email?.toLowerCase(), school, req.params.id);

  logAdminAction(req.user.id, is_active === 0 ? 'deactivate_user' : is_active === 1 ? 'activate_user' : 'update_user', 'user', parseInt(req.params.id), JSON.stringify({ mentor_id, is_active, name }));
  res.json({ message: 'User updated' });
});

router.post('/admin/reset-password/:id', authenticate, requireRole('admin'), (req, res) => {
  const { password } = req.body;
  const user = db.prepare('SELECT id, name, role, email, pf_number FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const defaultPass = password || (user.role === 'mentee' ? 'Cohort@2026' : 'Equity@2026');
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  logAdminAction(req.user.id, 'reset_password', user.role, user.id, `Reset password for ${user.name}`);
  res.json({
    message: 'Password reset successfully',
    temporary_password: defaultPass,
    user: { id: user.id, name: user.name, email: user.email, pf_number: user.pf_number, role: user.role },
    login_hint: user.role === 'mentee' ? `PF Number: ${user.pf_number}` : `Email: ${user.email}`,
  });
});

router.get('/export/profiles', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  let query = `SELECT u.*, m.name as mentor_name FROM users u LEFT JOIN users m ON u.mentor_id = m.id WHERE u.role = 'mentee'`;
  const params = [];
  if (req.user.role === 'mentor') {
    query += ' AND u.mentor_id = ?';
    params.push(req.user.id);
  }
  const mentees = db.prepare(query).all(...params);

  const csv = ['PF Number,Name,Email,Gender,Phone,School,Mentor,Profile Completed,Career Interests,Subjects,Goals,Score'];
  for (const m of mentees) {
    const pd = JSON.parse(m.profile_data || '{}');
    csv.push([
      m.pf_number, m.name, m.email, m.gender || '', m.phone || '', m.school || '',
      m.mentor_name || '', m.profile_completed ? 'Yes' : 'No',
      pd.career_interests || '', pd.subjects || '', pd.goals || '', computeScore(m.id)
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=eccp-scholar-profiles.csv');
  res.send(csv.join('\n'));
});

export { computeScore };
export default router;
