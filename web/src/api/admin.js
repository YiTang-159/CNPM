/**
 * Quản lý người dùng cho trang Admin.
 * - Có VITE_API_URL: GET /api/admin/users, PATCH /api/admin/users {email,status}, DELETE /api/admin/users?email=...
 * - Không có: đọc và sửa danh sách người dùng lưu trong localStorage.
 */
const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';
const K_USERS = 'dubchef-users';
export const SAMPLE_PREFIX = 'demo-'; // email người dùng mẫu bắt đầu bằng "demo-"

function read() {
  try { return JSON.parse(localStorage.getItem(K_USERS)) || []; } catch (e) { return []; }
}
function write(list) {
  try { localStorage.setItem(K_USERS, JSON.stringify(list)); } catch (e) { /* bỏ qua */ }
}

async function call(method, path, user, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-User-Email': user.email },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('server');
  return res.json().catch(() => ({}));
}

const NAMES = ['Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Thu Hà', 'Phạm Gia Huy', 'Võ Ngọc Lan', 'Đặng Khánh Linh',
  'Bùi Thanh Tùng', 'Hoàng Mai Phương', 'Ngô Đức Thịnh', 'Đỗ Hải Yến', 'Vũ Anh Khoa', 'Lý Bảo Châu'];

export const adminApi = {
  /** Trả về [{ name, email, at, status }]. */
  async users(user) {
    if (BASE) return (await call('GET', '/api/admin/users', user)).users || [];
    return read().map((u) => ({ name: u.name, email: u.email, at: u.at || null, status: u.status || 'active' }));
  },
  async setStatus(user, email, status) {
    if (BASE) return call('PATCH', '/api/admin/users', user, { email, status });
    write(read().map((u) => (u.email === email ? { ...u, status } : u)));
    return { ok: true };
  },
  async remove(user, email) {
    if (BASE) return call('DELETE', '/api/admin/users?email=' + encodeURIComponent(email), user);
    write(read().filter((u) => u.email !== email));
    return { ok: true };
  },
  /** Thêm người dùng mẫu (chỉ ở chế độ lưu tạm). Không đăng nhập được vì không có mật khẩu. */
  seed(now = new Date()) {
    if (BASE) return;
    const have = new Set(read().map((u) => u.email));
    const add = NAMES.map((name, n) => ({
      name,
      email: SAMPLE_PREFIX + (n + 1) + '@example.com',
      hash: '-',
      at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - n * 3, 9 + n, 0).toISOString(),
      status: n === 4 ? 'locked' : 'active',
    })).filter((u) => !have.has(u.email));
    write([...read(), ...add]);
  },
  /** Xóa người dùng mẫu (chỉ ở chế độ lưu tạm). */
  clearSamples() {
    if (!BASE) write(read().filter((u) => !u.email.startsWith(SAMPLE_PREFIX)));
  },
};
