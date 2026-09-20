/**
 * Lớp gọi API.
 * - Có VITE_API_URL: gọi Backend thật (POST /api/auth/register, /api/auth/login, /api/contact).
 * - Không có: lưu tạm trong localStorage của trình duyệt (để demo khi chưa có Backend).
 */
const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';
export const HAS_API = Boolean(BASE);

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

/** Đổi mã lỗi thành khóa dịch để hiển thị. */
export function errorKey(err) {
  const c = err && err.code;
  if (c === 'exists') return 'e_exists';
  if (c === 'invalid') return 'e_login';
  return 'e_net';
}

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* bỏ qua */ }
}

async function hash(text) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 5381;
    for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }
}

async function remote(path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError('net');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.code || 'server');
  return data;
}

const norm = (s) => s.trim().toLowerCase();

export const api = {
  async register({ name, email, password }) {
    if (BASE) return remote('/api/auth/register', { name, email, password });
    const users = read(K_USERS, []);
    if (users.some((u) => u.email === norm(email))) throw new ApiError('exists');
    const user = { name: name.trim(), email: norm(email) };
    users.push({ ...user, hash: await hash(password) });
    write(K_USERS, users);
    return { user };
  },

  async login({ email, password }) {
    if (BASE) return remote('/api/auth/login', { email, password });
    const found = read(K_USERS, []).find((u) => u.email === norm(email));
    if (!found || found.hash !== (await hash(password))) throw new ApiError('invalid');
    return { user: { name: found.name, email: found.email } };
  },

  async contact({ name, email, message }) {
    if (BASE) return remote('/api/contact', { name, email, message });
    const list = read(K_MSGS, []);
    list.push({ name, email, message, at: new Date().toISOString() });
    write(K_MSGS, list);
    return { ok: true };
  },
};

export const session = {
  load: () => read(K_SESSION, null),
  save: (user) => write(K_SESSION, user),
  clear() {
    try { localStorage.removeItem(K_SESSION); } catch (e) { /* bỏ qua */ }
  },
};
