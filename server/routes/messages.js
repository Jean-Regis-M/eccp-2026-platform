import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logActivity } from '../utils/audit.js';

const router = Router();

function enrichMessage(m, userId) {
  const sender = db.prepare('SELECT role, name FROM users WHERE id = ?').get(m.from_user_id);
  const read = db.prepare('SELECT id FROM message_reads WHERE message_id = ? AND user_id = ?').get(m.id, userId);
  const replies = db.prepare(`
    SELECT r.*, u.name, u.role FROM message_replies r JOIN users u ON r.user_id = u.id
    WHERE r.message_id = ? ORDER BY r.created_at
  `).all(m.id);

  let source = 'mentor';
  if (sender?.role === 'admin') source = 'admin';
  else if (m.target_type === 'all_mentors') source = 'admin';

  return {
    ...m,
    from_name: sender?.name || m.from_name,
    sender_role: sender?.role,
    message_source: source,
    is_read: !!read,
    replies,
  };
}

router.get('/', authenticate, (req, res) => {
  let messages;

  if (req.user.role === 'admin') {
    messages = db.prepare(`
      SELECT m.*, u.name as from_name FROM messages m JOIN users u ON m.from_user_id = u.id ORDER BY m.created_at DESC
    `).all();
  } else if (req.user.role === 'mentor') {
    messages = db.prepare(`
      SELECT m.*, u.name as from_name FROM messages m JOIN users u ON m.from_user_id = u.id
      WHERE m.target_type IN ('all_mentors', 'all_scholars', 'mentor_group')
      OR (m.target_type = 'individual' AND m.target_id = ?)
      ORDER BY m.created_at DESC
    `).all(req.user.id);
  } else {
    const mentee = db.prepare('SELECT mentor_id FROM users WHERE id = ?').get(req.user.id);
    messages = db.prepare(`
      SELECT m.*, u.name as from_name, u.role as sender_role FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.target_type = 'all_scholars'
      OR (m.target_type = 'mentor_group' AND m.target_id = ?)
      OR (m.target_type = 'individual' AND m.target_id = ?)
      ORDER BY m.created_at DESC
    `).all(mentee?.mentor_id, req.user.id);
  }

  res.json(messages.map(m => enrichMessage(m, req.user.id)));
});

router.post('/', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { target_type, target_id, subject, content } = req.body;
  if (!subject || !content) return res.status(400).json({ error: 'Subject and content required' });

  if (req.user.role === 'mentor' && !['mentor_group', 'individual'].includes(target_type)) {
    return res.status(403).json({ error: 'Mentors can only message their group or individuals' });
  }

  const tid = target_type === 'mentor_group' ? req.user.id : target_id;
  const result = db.prepare(`
    INSERT INTO messages (from_user_id, target_type, target_id, subject, content) VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, target_type, tid || null, subject, content);

  logActivity(req.user.id, 'message_send', `Sent: ${subject}`);
  res.json({ id: result.lastInsertRowid, message: 'Message sent' });
});

router.post('/:id/reply', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Reply content required' });

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const result = db.prepare('INSERT INTO message_replies (message_id, user_id, content) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, content.trim());

  logActivity(req.user.id, 'message_reply', `Replied to message ${req.params.id}`);
  res.json({ id: result.lastInsertRowid, message: 'Reply sent' });
});

router.post('/:id/read', authenticate, (req, res) => {
  db.prepare(`INSERT INTO message_reads (message_id, user_id) VALUES (?, ?) ON CONFLICT(message_id, user_id) DO NOTHING`)
    .run(req.params.id, req.user.id);
  res.json({ message: 'Marked as read' });
});

router.get('/unread-count', authenticate, (req, res) => {
  const all = db.prepare('SELECT id FROM messages').all();
  let count = 0;
  for (const m of all) {
    const read = db.prepare('SELECT id FROM message_reads WHERE message_id = ? AND user_id = ?').get(m.id, req.user.id);
    if (!read) count++;
  }
  res.json({ count });
});

export default router;
