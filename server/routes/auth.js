import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db.js';
import { generateToken, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = await db.query(
    'SELECT * FROM users WHERE (email = $1 OR pf_number = $1) AND role = $2 AND is_active = 1',
    [identifier, identifier, role]
  ).then(r => r.rows[0]);

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ token: generateToken(user), user: { id: user.id, name: user.name, role: user.role } });
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await db.query('INSERT INTO token_blacklist (token) VALUES ($1)', [req.token]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]).then(r => r.rows[0]);

  if (!await bcrypt.compare(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [hash, req.user.id]);
  res.json({ message: 'Password updated' });
});

// Example of new standardized role protection
// router.delete('/admin/user/:id', authenticate, requireRole(['admin']), async (req, res) => { ... });

export default router;
