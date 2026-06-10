import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { computeScore } from './users.js';
import { logAdminAction } from '../utils/audit.js';
import { sendBulkEmails } from '../utils/email.js';

const router = Router();

router.get('/dashboard', authenticate, requireRole('admin'), (req, res) => {
  const stats = {
    total_scholars: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'mentee' AND is_active = 1").get().c,
    total_mentors: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'mentor' AND is_active = 1").get().c,
    total_sessions: db.prepare('SELECT COUNT(*) as c FROM sessions').get().c,
    profiles_completed: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'mentee' AND profile_completed = 1").get().c,
    today_attendance: 0,
    active_quizzes: db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE is_active = 1').get().c,
  };

  const today = new Date().toISOString().split('T')[0];
  const todaySession = db.prepare('SELECT id FROM sessions WHERE date = ?').get(today);
  if (todaySession) {
    stats.today_attendance = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE session_id = ? AND attended = 1').get(todaySession.id).c;
  }

  const mentorPerformance = db.prepare(`
    SELECT m.id, m.name, m.email,
      (SELECT COUNT(*) FROM users WHERE mentor_id = m.id AND is_active = 1) as mentee_count
    FROM users m WHERE m.role = 'mentor' AND m.is_active = 1
  `).all().map(m => {
    const mentees = db.prepare('SELECT id FROM users WHERE mentor_id = ? AND is_active = 1').all(m.id);
    const avgScore = mentees.length ? Math.round(mentees.reduce((sum, me) => sum + computeScore(me.id), 0) / mentees.length) : 0;
    const sessionsCreated = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE mentor_id = ? OR created_by = ?').get(m.id, m.id).c;
    const messagesCount = db.prepare('SELECT COUNT(*) as c FROM messages WHERE from_user_id = ?').get(m.id).c;
    return { ...m, avg_mentee_score: avgScore, sessions_created: sessionsCreated, messages_sent: messagesCount };
  });

  const inactiveScholars = db.prepare(`
    SELECT u.id, u.name, u.pf_number, u.email, u.last_login, m.name as mentor_name
    FROM users u LEFT JOIN users m ON u.mentor_id = m.id
    WHERE u.role = 'mentee' AND u.is_active = 1
    AND (u.last_login IS NULL OR u.last_login < datetime('now', '-3 days'))
    AND u.profile_completed = 0
  `).all();

  res.json({ stats, mentor_performance: mentorPerformance, inactive_scholars: inactiveScholars });
});

router.get('/settings', authenticate, requireRole('admin'), (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  for (const s of settings) obj[s.key] = s.value;
  res.json(obj);
});

router.put('/settings', authenticate, requireRole('admin'), (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
  for (const [key, value] of Object.entries(req.body)) {
    upsert.run(key, value, value);
  }
  logAdminAction(req.user.id, 'update_settings', 'settings', null, Object.keys(req.body).join(', '));
  res.json({ message: 'Settings updated' });
});

router.post('/send-credentials/:id', authenticate, requireRole('admin'), async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const body = user.role === 'mentee'
    ? `Dear ${user.name},\n\nWelcome to the Equity College Counselling Program (ECCP) 2026 Platform!\n\nYour login credentials:\nPF Number: ${user.pf_number}\nPassword: Cohort@2026\n\nPlease log in and complete your profile immediately.\nChange your password after first login.\n\nContact: eccpmentor.regismukiza@gmail.com\n\nBest regards,\nECCP Team`
    : `Dear ${user.name},\n\nYour ECCP 2026 Platform credentials:\nEmail: ${user.email}\nPassword: Equity@2026\n\nPlease log in and update your profile.\n\nBest regards,\nECCP Team`;

  const emailResult = await sendBulkEmails([{ to: user.email, subject: 'ECCP 2026 Platform - Your Login Credentials', body }], req.user.id);
  logAdminAction(req.user.id, 'send_credentials', user.role, user.id, user.name);

  res.json({ to: user.email, subject: 'ECCP 2026 Platform - Your Login Credentials', body, emailResult: emailResult[0] });
});

router.post('/send-reminders', authenticate, requireRole('admin'), async (req, res) => {
  const inactive = db.prepare(`
    SELECT u.*, m.name as mentor_name FROM users u
    LEFT JOIN users m ON u.mentor_id = m.id
    WHERE u.role = 'mentee' AND u.is_active = 1
    AND (
      u.last_login IS NULL OR u.last_login < datetime('now', '-2 days')
      OR u.profile_completed = 0
      OR u.id NOT IN (SELECT DISTINCT user_id FROM feedback WHERE created_at > datetime('now', '-2 days'))
    )
  `).all();

  const emails = inactive.map(u => ({
    to: u.email,
    subject: 'ECCP 2026 - Action Required',
    body: `Dear ${u.name},\n\nThis is a reminder from the ECCP 2026 platform. Please log in today to:\n\n✓ Complete your scholar profile\n✓ Submit feedback for recent sessions\n✓ Take any pending quizzes\n✓ Review messages from your mentor\n\nYour PF Number: ${u.pf_number}\nYour Mentor: ${u.mentor_name || 'Assigned soon'}\n\nLogin at the ECCP platform scholar portal.\n\nContact: eccpmentor.regismukiza@gmail.com\n\nEquity College Counselling Program 2026`,
  }));

  const results = await sendBulkEmails(emails, req.user.id);
  const sent = results.filter(r => r.sent).length;
  const queued = results.filter(r => !r.sent).length;

  logAdminAction(req.user.id, 'send_reminders', 'scholars', null, `Sent ${sent}, queued ${queued} of ${emails.length}`);

  res.json({
    count: emails.length,
    sent,
    queued,
    reminders: emails,
    results,
    message: sent > 0 ? `Successfully sent ${sent} email(s)` : `Prepared ${emails.length} reminder(s). Configure SMTP in Settings for automatic delivery, or copy messages below.`,
  });
});

router.get('/activity', authenticate, requireRole('admin'), (req, res) => {
  const logs = db.prepare(`
    SELECT a.*, u.name, u.role FROM activity_log a
    JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 100
  `).all();
  res.json(logs);
});

router.get('/audit-log', authenticate, requireRole('admin'), (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, u.name as admin_name, u.email as admin_email
    FROM admin_audit_log l
    JOIN users u ON l.admin_id = u.id
    ORDER BY l.created_at DESC LIMIT 200
  `).all();
  res.json(logs);
});

router.get('/email-log', authenticate, requireRole('admin'), (req, res) => {
  const logs = db.prepare(`
    SELECT e.*, u.name as sent_by_name FROM email_log e
    LEFT JOIN users u ON e.sent_by = u.id ORDER BY e.created_at DESC LIMIT 100
  `).all();
  res.json(logs);
});

router.get('/career-insights/:id', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.user.role === 'mentee' && req.user.id !== user.id) return res.status(403).json({ error: 'Access denied' });

  const pd = JSON.parse(user.profile_data || '{}');
  const subjects = (pd.subjects || '').toLowerCase();
  const interests = (pd.career_interests || '').toLowerCase();
  const insights = [];
  if (subjects.includes('math') || subjects.includes('physics')) insights.push({ field: 'STEM', recommendation: 'Consider engineering, computer science, or data science programs.' });
  if (subjects.includes('biology') || subjects.includes('chemistry')) insights.push({ field: 'Health Sciences', recommendation: 'Pre-med, biomedical engineering, or public health programs.' });
  if (interests.includes('business') || interests.includes('entrepreneur')) insights.push({ field: 'Business', recommendation: 'Explore Wharton, Babson, and entrepreneurship programs.' });
  if (insights.length === 0) insights.push({ field: 'Liberal Arts', recommendation: 'Complete your profile for tailored recommendations.' });

  const pacing = computeScore(user.id) > 70 ? 'Excellent pace!' : computeScore(user.id) > 40 ? 'Good progress — stay consistent.' : 'Needs attention — complete profile and submit daily feedback.';
  res.json({ scholar: user.name, insights, pacing_advice: pacing, profile_completion: user.profile_completed ? 100 : 50 });
});

export default router;
