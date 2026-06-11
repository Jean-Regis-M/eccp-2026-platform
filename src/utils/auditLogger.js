const AUDIT_LOG_KEY = 'eccp_audit_logs';

export function logAuditEvent({ category, action, details, user }) {
  const timestamp = new Date().toISOString();
  const auditObject = {
    id: Date.now() + Math.random(),
    timestamp,
    category,
    action,
    details: typeof details === 'object' ? JSON.stringify(details) : String(details),
    userId: user ? user.id : null,
    userName: user ? user.name : null,
    userRole: user ? user.role : null
  };

  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY)) || [];
    logs.unshift(auditObject);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save audit log', e);
  }
}

export function getAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY)) || [];
  } catch (e) {
    console.warn('Failed to load audit logs', e);
    return [];
  }
}