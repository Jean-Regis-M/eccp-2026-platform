const API = import.meta.env.VITE_API_URL || '/api';

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
      const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) });
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
    request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, role }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  resetPasswordRequest: (identifier, role) =>
    request('/auth/reset-password-request', { method: 'POST', body: JSON.stringify({ identifier, role }) }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  getSessions: (search) => request(`/sessions${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getTodaySession: () => request('/sessions/today'),
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markAttendance: (id, attendance) => request(`/sessions/${id}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance }) }),
  getAttendance: (id) => request(`/sessions/${id}/attendance`),
  submitFeedback: (id, data) => request(`/sessions/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  getSessionFeedback: (id) => request(`/sessions/${id}/feedback`),
  getWeeklyReport: (params) => request(`/sessions/reports/weekly?${new URLSearchParams(params)}`),
  downloadWeeklyReport: (params) => downloadFetch(`/sessions/reports/weekly?${new URLSearchParams({ ...params, format: 'csv' })}`, `eccp-weekly-${params.week_start}.csv`),

  getMentees: () => request('/users/mentees'),
  getMentors: () => request('/users/mentors'),
  getUser: (id) => request(`/users/${id}`),
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getRankings: () => request('/users/rankings'),
  getMyProgress: () => request('/users/my-progress'),
  exportProfiles: () => downloadFetch('/users/export/profiles', 'eccp-scholar-profiles.csv'),
  downloadScholarPdf: (id, pf) => downloadFetch(`/users/export/scholar-pdf/${id}`, `ECCP-Scholar-${pf || id}.pdf`),
  exportRankings: () => downloadFetch('/users/export/rankings', 'eccp-scholar-rankings.csv'),
  getAllUsers: () => request('/users/admin/all'),
  createUser: (data) => request('/users/admin/create', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id, password) => request(`/users/admin/reset-password/${id}`, { method: 'POST', body: JSON.stringify({ password }) }),

  getQuizzes: () => request('/quizzes'),
  getQuiz: (id) => request(`/quizzes/${id}`),
  createQuiz: (data) => request('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  submitQuiz: (id, answers) => request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  closeQuiz: (id) => request(`/quizzes/${id}/close`, { method: 'PUT' }),

  getMessages: () => request('/messages'),
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  replyMessage: (id, content) => request(`/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
  markRead: (id) => request(`/messages/${id}/read`, { method: 'POST' }),

  getSatExams: () => request('/sat'),
  createSatExam: (data) => request('/sat', { method: 'POST', body: JSON.stringify(data) }),
  closeSatExam: (id) => request(`/sat/${id}/close`, { method: 'PUT' }),
  submitSat: (id, data) => request(`/sat/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getSatSubmissions: (id) => request(`/sat/${id}/submissions`),

  getAdminDashboard: () => request('/admin/dashboard'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  sendCredentials: (id) => request(`/admin/send-credentials/${id}`, { method: 'POST' }),
  sendReminders: () => request('/admin/send-reminders', { method: 'POST' }),
  getActivity: () => request('/admin/activity'),
  getAuditLog: () => request('/admin/audit-log'),
  getEmailLog: () => request('/admin/email-log'),
  getCareerInsights: (id) => request(`/admin/career-insights/${id}`),

  getMentorReportPreview: (params) => request(`/reports/mentor/preview?${new URLSearchParams(params)}`),
  saveMentorReport: (data) => request('/reports/mentor/save', { method: 'POST', body: JSON.stringify(data) }),
  downloadMentorReportPdf: (params) => downloadFetch(`/reports/mentor/pdf?${new URLSearchParams(params)}`, `ECCP-Weekly-Report.pdf`),

  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  uploadSessionFile: async (id, file) => {
    const token = localStorage.getItem('eccp_token');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/sessions/${id}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  mentorResetMenteePassword: (id, password) => request(`/auth/mentor-reset-mentee/${id}`, { method: 'POST', body: JSON.stringify({ password }) }),
  downloadResourceFile: (filename, title) => downloadFetch(`/resources/file/${filename}`, `${title || filename}`),

  getPublicTimeline: () => request('/platform/timeline/public'),
  getTimeline: () => request('/platform/timeline'),
  createTimelineItem: (data) => request('/platform/timeline', { method: 'POST', body: JSON.stringify(data) }),
  updateTimelineItem: (id, data) => request(`/platform/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimelineItem: (id) => request(`/platform/timeline/${id}`, { method: 'DELETE' }),
  getPlatformContent: () => request('/platform/content'),
  updatePlatformContent: (data) => request('/platform/content', { method: 'PUT', body: JSON.stringify(data) }),
  getPlatformHistory: () => request('/platform/history'),
  downloadPlatformHistory: () => downloadFetch('/platform/history/export', `eccp-platform-history-${new Date().toISOString().split('T')[0]}.csv`),
  submitWellness: (stress_level) => request('/platform/wellness', { method: 'POST', body: JSON.stringify({ stress_level }) }),

  getResources: (category) => request(`/resources${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getResourceCategories: () => request('/resources/categories'),
  createResource: (data) => request('/resources', { method: 'POST', body: JSON.stringify(data) }),
  deleteResource: (id) => request(`/resources/${id}`, { method: 'DELETE' }),
  uploadResource: async (formData) => {
    const token = localStorage.getItem('eccp_token');
    const res = await fetch(`${API}/resources/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
