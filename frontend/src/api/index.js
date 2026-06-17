import { api } from './client.js';

// ─── auth (user-service) ───
export const authApi = {
  register: (payload) => api.user('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login:    (email, password) => api.user('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me:       () => api.user('/api/me'),
};

// ─── horários fixos (user-service) ───
export const scheduleApi = {
  list:    () => api.user('/api/fixed-blocks'),
  create:  (block) => api.user('/api/fixed-blocks', { method: 'POST', body: block }),
  remove:  (id) => api.user(`/api/fixed-blocks/${id}`, { method: 'DELETE' }),
};

// ─── tarefas (planning-service) ───
export const taskApi = {
  list:     (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return api.planning(`/api/tasks${q ? '?' + q : ''}`);
  },
  create:   (task) => api.planning('/api/tasks', { method: 'POST', body: task }),
  update:   (id, patch) => api.planning(`/api/tasks/${id}`, { method: 'PATCH', body: patch }),
  complete: (id, actual_min) => api.planning(`/api/tasks/${id}/complete`, { method: 'POST', body: { actual_min } }),
  remove:   (id) => api.planning(`/api/tasks/${id}`, { method: 'DELETE' }),
  overload: (date) => api.planning(`/api/planning/overload${date ? '?date=' + date : ''}`),
};

// ─── notificações (planning-service) ───
export const notificationApi = {
  list:        () => api.planning('/api/notifications'),
  markRead:    (id) => api.planning(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api.planning('/api/notifications/read-all', { method: 'POST' }),
  remove:      (id) => api.planning(`/api/notifications/${id}`, { method: 'DELETE' }),
};

// ─── conquistas (gamification-service) ───
export const gamificationApi = {
  achievements: () => api.gamification('/api/achievements'),
  stats:        () => api.gamification('/api/stats'),
};

// ─── analytics (analytics-service) ───
export const analyticsApi = {
  overview:    () => api.analytics('/api/analytics/overview'),
  suggestions: () => api.analytics('/api/analytics/suggestions'),
};