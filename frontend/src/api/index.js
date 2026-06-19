import { api } from './client.js';

export const authApi = {
  register:       (payload) => api.user('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login:          (email, password) => api.user('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me:             () => api.user('/api/me'),
  updateProfile:  (patch) => api.user('/api/me', { method: 'PATCH', body: patch }),
  updatePassword: (current_password, new_password) =>
    api.user('/api/me/password', { method: 'PATCH', body: { current_password, new_password } }),
};

export const scheduleApi = {
  list:    () => api.user('/api/fixed-blocks'),
  create:  (block) => api.user('/api/fixed-blocks', { method: 'POST', body: block }),
  remove:  (id) => api.user(`/api/fixed-blocks/${id}`, { method: 'DELETE' }),
};

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

export const notificationApi = {
  list:        () => api.planning('/api/notifications'),
  markRead:    (id) => api.planning(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api.planning('/api/notifications/read-all', { method: 'POST' }),
  remove:      (id) => api.planning(`/api/notifications/${id}`, { method: 'DELETE' }),
};

export const gamificationApi = {
  achievements: () => api.gamification('/api/achievements'),
  stats:        () => api.gamification('/api/stats'),
};

export const analyticsApi = {
  overview:    () => api.analytics('/api/analytics/overview'),
  suggestions: () => api.analytics('/api/analytics/suggestions'),
};