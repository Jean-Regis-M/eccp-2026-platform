import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { logHistory } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = Router();

function logLoginAttempt(identifier, role, ip, success) {
  db.prepare('INSERT INTO login_attempts (identifier, role, ip, success) VALUES (?, ?, ?, ?)').run(identifier, role, ip, success ? 1 : 0);
}

function recentFailedAttempts(identifier, role) {
  return db.prepare(`
    SELECT COUNT(*) as c FROM login_attempts
    WHERE identifier = ? AND role = ? AND success = 0 AND created_at > datetime('now', '-30 minutes')
  `).get(identifier, role).c;
}

router.post('/login', (req, res) => {
  const { identifier, password, role } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  if (!identifier || !password || !role) {
    return res.status(400).json({ error: 'Identifier, password, and role are required' });
  }

  const idKey = role === 'mentee' ? identifier.trim() : identifier.toLowerCase().trim();
  if (recentFailedAttempts(idKey, role) >= 8) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in 30 minutes or contact admin.' });
  }

  let user;
  if (role === 'mentee') {
    user = db.prepare('SELECT * FROM users WHERE pf_number = ? AND role = ? AND is_active = 1').get(idKey, 'mentee');
  } else {
    user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? AND role = ? AND is_active = 1').get(idKey, role);
  }

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logLoginAttempt(idKey, role, ip, false);
    return res.status(401).json({ error: 'Invalid credentials. Access denied.' });
  }

  logLoginAttempt(idKey, role, ip, true);
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  db.prepare('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)').run(user.id, 'login', `Logged in as ${role}`);
  logHistory(user.id, user.name, role, 'login', 'user', user.id, ip);

  const { password_hash, ...safeUser } = user;
  const stillDefaultPass = user.role === 'mentee' && bcrypt.compareSync('Cohort@2026', user.password_hash);
  safeUser.must_change_password = !!user.must_change_password || stillDefaultPass;
  if (stillDefaultPass && !user.must_change_password) {
    db.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(user.id);
  }
  res.json({ token: generateToken(user), user: safeUser });
});

router.post('/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Current password and new password (min 8 chars) required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, req.user.id);
  logHistory(req.user.id, user.name, user.role, 'password_change', 'user', user.id, '');
  res.json({ message: 'Password updated successfully' });
});

router.post('/reset-password-request', async (req, res) => {
  const { identifier, role } = req.body;
  if (role === 'mentee') {
    return res.status(403).json({
      error: 'Scholars cannot reset passwords themselves. Please contact your mentor to reset your password.',
    });
  }
  let user;
  if (role === 'mentee') {
    user = db.prepare('SELECT * FROM users WHERE pf_number = ? AND role = ?').get(identifier, 'mentee');
  } else {
    user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? AND role = ?').get(identifier?.toLowerCase(), role);
  }
  if (!user) return res.json({ message: 'If the account exists, reset instructions will be sent to your email.' });

  const token = uuidv4();
  const expires = new Date(Date.now() + 3600000).toISOString();
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires);

  const resetLink = `${req.headers.origin || 'http://localhost:5173'}/login/${role}?reset=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'ECCP 2026 - Password Reset Request',
    body: `Dear ${user.name},\n\nA password reset was requested.\n\nReset token: ${token}\nOr use this link: ${resetLink}\n\nExpires in 1 hour.\n\nIf you did not request this, contact eccpmentor.regismukiza@gmail.com`,
  });

  res.json({ message: 'Reset link sent to your registered email if SMTP is configured.', token, expires });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Token and new password (min 8 chars) required' });
  }
  const resetToken = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')").get(token);
  if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, resetToken.user_id);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);
  res.json({ message: 'Password reset successfully' });
});

router.post('/mentor-reset-mentee/:id', authenticate, (req, res) => {
  if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const mentee = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'mentee');
  if (!mentee) return res.status(404).json({ error: 'Scholar not found' });
  if (req.user.role === 'mentor' && mentee.mentor_id !== req.user.id) {
    return res.status(403).json({ error: 'Can only reset your own scholars' });
  }

  const newPass = req.body.password || 'Cohort@2026';
  const hash = bcrypt.hashSync(newPass, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, mentee.id);
  logHistory(req.user.id, '', req.user.role, 'mentor_reset_password', 'mentee', mentee.id, mentee.name);

  res.json({
    message: 'Password reset',
    temporary_password: newPass,
    scholar: { name: mentee.name, pf_number: mentee.pf_number, email: mentee.email },
  });
});

router.get('/me', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  const stillDefaultPass = row.role === 'mentee' && bcrypt.compareSync('Cohort@2026', row.password_hash);
  const { password_hash, ...user } = row;
  user.must_change_password = !!row.must_change_password || stillDefaultPass;
  if (user.mentor_id) {
    user.mentor = db.prepare('SELECT id, name, email, mentor_bio, mentor_linkedin, mentor_instagram, mentor_photo FROM users WHERE id = ?').get(user.mentor_id);
  }
  res.json(user);
});

export default router;
