// API 客户端：所有后端通信统一入口
// VITE_API_BASE 在开发时指向 http://localhost:4000/api，生产时使用同域 /api

const BASE = import.meta.env.VITE_API_BASE || '/api';

function getToken() {
  try {
    const auth = JSON.parse(localStorage.getItem('sl_auth') || '{}');
    return auth.token || '';
  } catch {
    return '';
  }
}

function setAuth(data) {
  localStorage.setItem('sl_auth', JSON.stringify(data));
}

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload instanceof FormData ? payload : payload });
  if (res.status === 401) {
    setAuth({});
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new Error('登录已过期，请重新登录');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.error) || `请求失败(${res.status})`);
  return data;
}

export default {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
  upload: (p, formData) => request('POST', p, formData), // FormData
  login: async (username, password) => {
    const data = await request('POST', '/auth/login', { username, password });
    setAuth({ token: data.token, username: data.username, loginAt: Date.now() });
    return { ok: true };
  },
  getToken,
  setAuth,
};
