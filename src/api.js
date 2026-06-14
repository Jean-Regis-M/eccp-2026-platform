const API = import.meta.env.VITE_API_URL || '';

function getHeaders() {
  const token = localStorage.getItem('eccp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function checkApiHealth(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 800));
    }
  }
  return false;
}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${url}`, {
      ...options,
      headers: { ...getHeaders(), ...(options.headers || {}) },
    });
  } catch {
    throw new Error(
      'Cannot reach the server. Run "npm run dev" in the project folder and wait until you see "Open: http://localhost:5173". Do not open the HTML file directly.'
    );
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && localStorage.getItem('eccp_token') && !url.includes('/auth/me')) {
    localStorage.removeItem('eccp_token');
    const returnPath = window.location.pathname + window.location.search;
    if (!returnPath.startsWith('/login') && returnPath !== '/') {
      sessionStorage.setItem('eccp_last_path', returnPath);
    }
    if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
      window.location.replace('/login/' + (sessionStorage.getItem('eccp_last_role') || 'mentee'));
    }
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function downloadFetch(url, filename) {
  const token = localStorage.getItem('eccp_token');
  let res;
  try {
    res = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error('Cannot reach the server. Run "npm run dev" and try again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Download failed');
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export const api = {
  login: (identifier, password, role) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, role }) }),
  me: () => request('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  resetPasswordRequest: (identifier, role) =>
    request('/api/auth/reset-password-request', { method: 'POST', body: JSON.stringify({ identifier, role }) }),
  resetPassword: (token, newPassword) =>
    request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  getSessions: (search) => request(`/api/sessions${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getTodaySession: () => request('/api/sessions/today'),
  createSession: (data) => request('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id, data) => request(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markAttendance: (id, attendance) => request(`/api/sessions/${id}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance }) }),
  getAttendance: (id) => request(`/api/sessions/${id}/attendance`),
  submitFeedback: (id, data) => request(`/api/sessions/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  getSessionFeedback: (id) => request(`/api/sessions/${id}/feedback`),
  getWeeklyReport: (params) => request(`/api/sessions/reports/weekly?${new URLSearchParams(params)}`),
  downloadWeeklyReport: (params) => downloadFetch(`/api/sessions/reports/weekly?${new URLSearchParams({ ...params, format: 'csv' })}`, `eccp-weekly-${params.week_start}.csv`),

  getMentees: () => request('/api/users/mentees'),
  getMentors: () => request('/api/users/mentors'),
  getUser: (id) => request(`/api/users/${id}`),
  updateProfile: (data) => request('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getRankings: () => request('/api/users/rankings'),
  getMyProgress: () => request('/api/users/my-progress'),
  exportProfiles: () => downloadFetch('/api/users/export/profiles', 'eccp-scholar-profiles.csv'),
  downloadScholarPdf: (id, pf) => downloadFetch(`/api/users/export/scholar-pdf/${id}`, `ECCP-Scholar-${pf || id}.pdf`),
  exportRankings: () => downloadFetch('/api/users/export/rankings', 'eccp-scholar-rankings.csv'),
  getAllUsers: () => request('/api/users/admin/all'),
  createUser: (data) => request('/api/users/admin/create', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/api/users/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id) => request(`/api/users/admin/reset-password/${id}`, { method: 'POST', body: JSON.stringify({}) }),

  getQuizzes: () => request('/api/quizzes'),
  getQuiz: (id) => request(`/api/quizzes/${id}`),
  createQuiz: (data) => request('/api/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  submitQuiz: (id, answers) => request(`/api/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  closeQuiz: (id) => request(`/api/quizzes/${id}/close`, { method: 'PUT' }),

  getMessages: () => request('/api/messages'),
  sendMessage: (data) => request('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
  replyMessage: (id, content) => request(`/api/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
  markRead: (id) => request(`/api/messages/${id}/read`, { method: 'POST' }),

  getSatExams: () => request('/api/sat'),
  createSatExam: (data) => request('/api/sat', { method: 'POST', body: JSON.stringify(data) }),
  closeSatExam: (id) => request(`/api/sat/${id}/close`, { method: 'PUT' }),
  submitSat: (id, data) => request(`/api/sat/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getSatSubmissions: (id) => request(`/api/sat/${id}/submissions`),

  getAdminDashboard: () => request('/api/admin/dashboard'),
  getSettings: () => request('/api/admin/settings'),
  updateSettings: (data) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  sendCredentials: (id) => request(`/api/admin/send-credentials/${id}`, { method: 'POST' }),
  sendReminders: () => request('/api/admin/send-reminders', { method: 'POST' }),
  getActivity: () => request('/api/admin/activity'),
  getAuditLog: () => request('/api/admin/audit-log'),
  getEmailLog: () => request('/api/admin/email-log'),
  getCareerInsights: (id) => request(`/api/admin/career-insights/${id}`),

  getMentorReportPreview: (params) => request(`/api/reports/mentor/preview?${new URLSearchParams(params)}`),
  saveMentorReport: (data) => request('/api/reports/mentor/save', { method: 'POST', body: JSON.stringify(data) }),
  downloadMentorReportPdf: (params) => downloadFetch(`/api/reports/mentor/pdf?${new URLSearchParams(params)}`, `ECCP-Weekly-Report.pdf`),

  deleteSession: (id) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
  uploadSessionFile: async (id, file) => {
    const token = localStorage.getItem('eccp_token');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/sessions/${id}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  mentorResetMenteePassword: (id, password) => request(`/api/auth/mentor-reset-mentee/${id}`, { method: 'POST', body: JSON.stringify({ password }) }),
  downloadResourceFile: (filename, title) => downloadFetch(`/api/resources/file/${filename}`, `${title || filename}`),

  getPublicTimeline: () => request('/api/platform/timeline/public'),
  getTimeline: () => request('/api/platform/timeline'),
  createTimelineItem: (data) => request('/api/platform/timeline', { method: 'POST', body: JSON.stringify(data) }),
  updateTimelineItem: (id, data) => request(`/api/platform/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimelineItem: (id) => request(`/api/platform/timeline/${id}`, { method: 'DELETE' }),
  getPlatformContent: () => request('/api/platform/content'),
  updatePlatformContent: (data) => request('/api/platform/content', { method: 'PUT', body: JSON.stringify(data) }),
  getPlatformHistory: () => request('/api/platform/history'),
  downloadPlatformHistory: () => downloadFetch('/api/platform/history/export', `eccp-platform-history-${new Date().toISOString().split('T')[0]}.csv`),
  submitWellness: (stress_level) => request('/api/platform/wellness', { method: 'POST', body: JSON.stringify({ stress_level }) }),

  getResources: (category) => request(`/api/resources${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getResourceCategories: () => request('/api/resources/categories'),
  createResource: (data) => request('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
  deleteResource: (id) => request(`/api/resources/${id}`, { method: 'DELETE' }),
  uploadResource: async (formData) => {
    const token = localStorage.getItem('eccp_token');
    const res = await fetch(`${API}/resources/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};