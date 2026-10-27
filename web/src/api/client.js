/**
 * Lớp gọi API.
 * - Có VITE_API_URL: gọi Backend thật (POST /api/auth/register, /api/auth/login, /api/contact).
 * - Không có: lưu tạm trong localStorage của trình duyệt (để demo khi chưa có Backend).
 */
import { SUPA, rpc } from './supabase.js';

const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';
export const HAS_API = Boolean(BASE);
/** true = tài khoản và tin nhắn liên hệ lưu dùng chung (Backend hoặc Supabase), không chỉ trong trình duyệt này. */
export const SHARED = Boolean(BASE || SUPA);

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
  if (c === 'locked') return 'e_locked';
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

/** Gọi hàm SQL ở Supabase; hàm trả { code } khi lỗi nghiệp vụ (exists / invalid / locked). */
async function supa(fn, args) {
  let data;
  try {
    data = await rpc(fn, args);
  } catch (e) {
    throw new ApiError('net');
  }
  if (data && data.code) throw new ApiError(data.code);
  return data;
}

const norm = (s) => s.trim().toLowerCase();

/** Email của quản trị viên. Đăng ký tài khoản bằng email này để vào trang /admin. */
export const ADMIN_EMAIL = (import.meta.env && import.meta.env.VITE_ADMIN_EMAIL) || 'admin@dubchef.vn';
/** Mật khẩu của tài khoản quản trị có sẵn (chỉ dùng khi chưa có Backend, để demo). */
export const ADMIN_PASSWORD = (import.meta.env && import.meta.env.VITE_ADMIN_PASSWORD) || 'admin12345';
export const isAdmin = (user) => Boolean(user) && (user.role === 'admin' || norm(user.email || '') === norm(ADMIN_EMAIL));

export const api = {
  async register({ name, email, password }) {
    if (BASE) return remote('/api/auth/register', { name, email, password });
    if (SUPA) return supa('app_register', { p_name: name, p_email: email, p_password: password });
    const users = read(K_USERS, []);
    if (norm(email) === norm(ADMIN_EMAIL) || users.some((u) => u.email === norm(email))) throw new ApiError('exists');
    const user = { name: name.trim(), email: norm(email) };
    users.push({ ...user, hash: await hash(password), at: new Date().toISOString(), status: 'active' });
    write(K_USERS, users);
    return { user };
  },

  async login({ email, password }) {
    if (BASE) return remote('/api/auth/login', { email, password });
    if (SUPA) return supa('app_login', { p_email: email, p_password: password });
    // Tài khoản quản trị có sẵn, không cần đăng ký.
    if (norm(email) === norm(ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      return { user: { name: 'Admin', email: norm(ADMIN_EMAIL), role: 'admin' } };
    }
    const found = read(K_USERS, []).find((u) => u.email === norm(email));
    if (!found || found.hash !== (await hash(password))) throw new ApiError('invalid');
    if (found.status === 'locked') throw new ApiError('locked');
    return { user: { name: found.name, email: found.email } };
  },

  async contact({ name, email, message }) {
    if (BASE) return remote('/api/contact', { name, email, message });
    if (SUPA) {
      await supa('app_contact', { p_name: name, p_email: email, p_message: message });
      return { ok: true };
    }
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
