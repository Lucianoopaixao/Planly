// Cada microsserviço tem sua própria URL base, configurável via Vite env vars.
const ENV = import.meta.env;

export const SERVICES = {
  user:         ENV.VITE_USER_SERVICE_URL          || 'http://localhost:4001',
  planning:     ENV.VITE_PLANNING_SERVICE_URL      || 'http://localhost:4002',
  gamification: ENV.VITE_GAMIFICATION_SERVICE_URL  || 'http://localhost:4003',
  analytics:    ENV.VITE_ANALYTICS_SERVICE_URL     || 'http://localhost:4004',
};

const TOKEN_KEY = 'planly_token';

export const tokenStore = {
  get:    () => localStorage.getItem(TOKEN_KEY),
  set:    (t) => localStorage.setItem(TOKEN_KEY, t),
  clear:  () => localStorage.removeItem(TOKEN_KEY),
};

async function request(baseUrl, path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const api = {
  user:         (path, opts) => request(SERVICES.user, path, opts),
  planning:     (path, opts) => request(SERVICES.planning, path, opts),
  gamification: (path, opts) => request(SERVICES.gamification, path, opts),
  analytics:    (path, opts) => request(SERVICES.analytics, path, opts),
};
