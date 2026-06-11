import { Router } from 'express';
import db, { logHistory } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/timeline/public', (req, res) => {
  res.json(db.prepare('SELECT id, period, event, description FROM program_timeline WHERE is_active = 1 ORDER BY sort_order').all());
});

router.get('/timeline', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM program_timeline WHERE is_active = 1 ORDER BY sort_order').all());
});

router.post('/timeline', authenticate, requireRole('admin'), (req, res) => {
  const { period, event, description, sort_order } = req.body;
  const r = db.prepare('INSERT INTO program_timeline (period, event, description, sort_order, updated_by) VALUES (?, ?, ?, ?, ?)')
    .run(period, event, description || '', sort_order || 99, req.user.id);
  logHistory(req.user.id, req.user.name || 'Admin', 'admin', 'timeline_add', 'timeline', r.lastInsertRowid, event);
  res.json({ id: r.lastInsertRowid });
});

router.put('/timeline/:id', authenticate, requireRole('admin'), (req, res) => {
  const { period, event, description, sort_order, is_active } = req.body;
  db.prepare(`UPDATE program_timeline SET period=COALESCE(?,period), event=COALESCE(?,event), description=COALESCE(?,description),
    sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active), updated_by=?, updated_at=datetime('now') WHERE id=?`)
    .run(period, event, description, sort_order, is_active, req.user.id, req.params.id);
  logHistory(req.user.id, '', 'admin', 'timeline_edit', 'timeline', req.params.id, event);
  res.json({ message: 'Updated' });
});

router.delete('/timeline/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('UPDATE program_timeline SET is_active = 0 WHERE id = ?').run(req.params.id);
  logHistory(req.user.id, '', 'admin', 'timeline_delete', 'timeline', req.params.id, '');
  res.json({ message: 'Removed' });
});

router.get('/content', authenticate, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('mission','vision','quotes')").all();
  const obj = {};
  for (const r of rows) {
    obj[r.key] = r.key === 'quotes' ? JSON.parse(r.value || '[]') : r.value;
  }
  const quoteIndex = Math.floor(Date.now() / 86400000) % (obj.quotes?.length || 1);
  obj.quote_of_day = obj.quotes?.[quoteIndex] || '';
  res.json(obj);
});

router.put('/content', authenticate, requireRole('admin'), (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
  if (req.body.mission) upsert.run('mission', req.body.mission, req.body.mission);
  if (req.body.vision) upsert.run('vision', req.body.vision, req.body.vision);
  if (req.body.quotes) upsert.run('quotes', JSON.stringify(req.body.quotes), JSON.stringify(req.body.quotes));
  res.json({ message: 'Updated' });
});

router.get('/history', authenticate, requireRole('admin'), (req, res) => {
  const limit = parseInt(req.query.limit) || 300;
  const logs = db.prepare('SELECT * FROM platform_history ORDER BY created_at DESC LIMIT ?').all(limit);
  const activity = db.prepare(`SELECT a.*, u.name, u.role FROM activity_log a JOIN users u ON a.user_id=u.id ORDER BY a.created_at DESC LIMIT ?`).all(100);
  const audit = db.prepare(`SELECT l.*, u.name as admin_name FROM admin_audit_log l JOIN users u ON l.admin_id=u.id ORDER BY l.created_at DESC LIMIT ?`).all(100);
  const logins = db.prepare('SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 100').all();
  res.json({ platform_history: logs, activity_log: activity, admin_audit: audit, login_attempts: logins });
});

router.get('/history/export', authenticate, requireRole('admin'), (req, res) => {
  const logs = db.prepare('SELECT * FROM platform_history ORDER BY created_at ASC').all();
  const activity = db.prepare(`SELECT a.created_at, u.name, u.role, a.action, a.details FROM activity_log a JOIN users u ON a.user_id=u.id ORDER BY a.created_at ASC`).all();
  const audit = db.prepare(`SELECT l.created_at, u.name as admin_name, l.action, l.target_type, l.target_id, l.details FROM admin_audit_log l JOIN users u ON l.admin_id=u.id ORDER BY l.created_at ASC`).all();
  const logins = db.prepare('SELECT * FROM login_attempts ORDER BY created_at ASC').all();

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    'Type,Timestamp,User,Role,Action,Target,Details',
    ...logs.map(l => ['platform_history', l.created_at, l.user_name, l.user_role, l.action, l.target_type, l.details].map(esc).join(',')),
    ...activity.map(l => ['activity', l.created_at, l.name, l.role, l.action, '', l.details].map(esc).join(',')),
    ...audit.map(l => ['audit', l.created_at, l.admin_name, 'admin', l.action, l.target_type, l.details].map(esc).join(',')),
    ...logins.map(l => ['login', l.created_at, l.identifier, l.role, l.success ? 'success' : 'failed', l.ip, ''].map(esc).join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=eccp-platform-history-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(rows.join('\n'));
});

router.post('/wellness', authenticate, requireRole('mentee'), (req, res) => {
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const ws = weekStart.toISOString().split('T')[0];
  db.prepare(`INSERT INTO wellness_checkins (user_id, stress_level, week_start) VALUES (?, ?, ?)
    ON CONFLICT(user_id, week_start) DO UPDATE SET stress_level = ?`).run(req.user.id, req.body.stress_level, ws, req.body.stress_level);
  res.json({ message: 'Recorded' });
});

export default router;
