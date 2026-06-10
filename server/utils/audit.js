import db from '../db.js';

export function logAdminAction(adminId, action, targetType = '', targetId = null, details = '') {
  db.prepare(`
    INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, action, targetType, targetId, details);
}

export function logActivity(userId, action, details = '') {
  db.prepare('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)').run(userId, action, details);
}
