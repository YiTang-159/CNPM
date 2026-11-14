/**
 * Lớp gọi API cho ứng dụng di động.
 * - Có EXPO_PUBLIC_API_URL: gọi Backend thật (/api/auth/*, /api/contact, và các API có đăng nhập: /api/videos, /api/orders, /api/feedback).
 * - Không có: lưu tạm trong AsyncStorage của điện thoại (chỉ để demo khi chưa có Backend).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL || '';
export const HAS_API = Boolean(BASE);
const LOCAL_DEMO = process.env.NODE_ENV === 'test' || (__DEV__ && process.env.EXPO_PUBLIC_ALLOW_LOCAL_DEMO === 'true');

const K_USERS = 'dubchef-users';
const K_SESSION = 'dubchef-session';
const K_MSGS = 'dubchef-messages';

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function errorKey(err) {
  const c = err && err.code;
  if (c === 'exists') return 'e_exists';
  if (c === 'invalid') return 'e_login';
  if (c === 'locked') return 'e_locked';
  return 'e_net';
}

async function read(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function write(key, val) {
  try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* bỏ qua */ }
}

// Băm đơn giản chỉ dùng cho chế độ demo (Backend thật sẽ băm bằng bcrypt/argon2)
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return 'x' + (h >>> 0).toString(16);
}

async function remote(path, body, { method = body === undefined ? 'GET' : 'POST', token } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError('net');
  }
  let data = {};
  try { data = await res.json(); } catch (e) { /* không có nội dung */ }
  if (!res.ok) throw new ApiError(data.code || 'server');
  return data;
}

const norm = (s) => s.trim().toLowerCase();

export const api = {
  languages: () => remote('/api/languages'),
  pricing: () => { if(!BASE) throw new ApiError('net'); return remote('/api/pricing'); },
  createVideo: (token,body) => remote('/api/videos',body,{token}),
  saveResults: (token,id,segments) => remote(`/api/videos/${id}/results`,{segments},{token}),
  videoResults: (token,id) => remote(`/api/videos/${id}/results`,undefined,{token}),
  async register({ name, email, password }) {
    if (BASE) return remote('/api/auth/register', { name, email, password });
    if (!LOCAL_DEMO) throw new ApiError('net');
    const users = await read(K_USERS, []);
    if (users.some((u) => u.email === norm(email))) throw new ApiError('exists');
    const user = { name: name.trim(), email: norm(email) };
    users.push({ ...user, hash: hash(password) });
    await write(K_USERS, users);
    return { user };
  },

  async login({ email, password }) {
    if (BASE) return remote('/api/auth/login', { email, password });
    if (!LOCAL_DEMO) throw new ApiError('net');
    const users = await read(K_USERS, []);
    const found = users.find((u) => u.email === norm(email));
    if (!found || found.hash !== hash(password)) throw new ApiError('invalid');
    return { user: { name: found.name, email: found.email } };
  },

  async contact({ name, email, message }) {
    if (BASE) return remote('/api/contact', { name, email, message });
    if (!LOCAL_DEMO) throw new ApiError('net');
    const list = await read(K_MSGS, []);
    list.push({ name, email, message, at: new Date().toISOString() });
    await write(K_MSGS, list);
    return { ok: true };
  },

  // Các API dưới đây cần Backend và token đăng nhập; không có Backend thì báo lỗi mạng, không giả lập dữ liệu.
  async videos(token) {
    if (!BASE || !token) throw new ApiError('net');
    return (await remote('/api/videos', undefined, { token })).videos || [];
  },
  async orders(token) {
    if (!BASE || !token) throw new ApiError('net');
    return (await remote('/api/orders', undefined, { token })).orders || [];
  },
  async feedback(token) {
    if (!BASE || !token) throw new ApiError('net');
    return (await remote('/api/feedback', undefined, { token })).feedback || [];
  },
  async sendFeedback(token, { message, videoId = null }) {
    if (!BASE || !token) throw new ApiError('net');
    return remote('/api/feedback', { message, videoId }, { token });
  },
};

export const session = {
  load: () => read(K_SESSION, null),
  save: (user) => write(K_SESSION, user),
  clear: async () => {
    try { await AsyncStorage.removeItem(K_SESSION); } catch (e) { /* bỏ qua */ }
  },
};
