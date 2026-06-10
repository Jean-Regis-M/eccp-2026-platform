export function safeJsonParse(value, fallback = {}) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}
