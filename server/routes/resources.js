import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { logHistory } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const CATEGORIES = ['SAT Prep', 'Essay Writing', 'Recommendation Letters', 'Financial Aid', 'University Research', 'Personal Statement', 'General Resources'];

const router = Router();

router.get('/categories', authenticate, (req, res) => res.json(CATEGORIES));

router.get('/', authenticate, (req, res) => {
  let query = 'SELECT r.*, u.name as created_by_name FROM resources r JOIN users u ON r.created_by = u.id WHERE 1=1';
  const params = [];
  if (req.user.role === 'mentor') {
    query += ' AND (r.is_global = 1 OR r.mentor_id = ? OR r.created_by = ?)';
    params.push(req.user.id, req.user.id);
  }
  if (req.user.role === 'mentee') {
    const mentee = db.prepare('SELECT mentor_id FROM users WHERE id = ?').get(req.user.id);
    query += ' AND (r.is_global = 1 OR r.mentor_id = ?)';
    params.push(mentee?.mentor_id || 0);
  }
  if (req.query.category) { query += ' AND r.category = ?'; params.push(req.query.category); }
  query += ' ORDER BY r.category, r.created_at DESC';
  res.json({ categories: CATEGORIES, resources: db.prepare(query).all(...params) });
});

router.post('/', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { category, title, description, resource_type, url, is_global } = req.body;
  const mentorId = req.user.role === 'mentor' ? req.user.id : null;
  const r = db.prepare(`INSERT INTO resources (category, title, description, resource_type, url, mentor_id, created_by, is_global)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(category, title, description || '', resource_type || 'link', url || '', mentorId, req.user.id, is_global !== false ? 1 : 0);
  logHistory(req.user.id, '', req.user.role, 'resource_add', 'resource', r.lastInsertRowid, title);
  res.json({ id: r.lastInsertRowid });
});

router.post('/upload', authenticate, requireRole('admin', 'mentor'), upload.single('file'), (req, res) => {
  const { category, title, description, resource_type } = req.body;
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const mentorId = req.user.role === 'mentor' ? req.user.id : null;
  const r = db.prepare(`INSERT INTO resources (category, title, description, resource_type, file_path, mentor_id, created_by, is_global)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)`).run(category, title, description || '', resource_type || 'pdf', `/api/resources/file/${req.file.filename}`, mentorId, req.user.id);
  res.json({ id: r.lastInsertRowid, file: req.file.filename });
});

router.get('/file/:filename', authenticate, (req, res) => {
  const fp = path.join(uploadDir, path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  res.download(fp);
});

router.delete('/:id', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'mentor' && r.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  logHistory(req.user.id, '', req.user.role, 'resource_delete', 'resource', req.params.id, r.title);
  res.json({ message: 'Deleted' });
});

export default router;
