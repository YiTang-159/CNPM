/**
 * Mã QR "trải nghiệm với tư cách khách" và số liệu người quét cho trang Quản trị.
 * - Có VITE_API_URL: mỗi lượt quét gửi POST /api/qr-scan; trang Admin đọc GET /api/admin/qr?days=N.
 * - Có VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (không cần Backend riêng): lượt quét lưu ở Supabase (xem db/supabase-qr.sql),
 *   mọi điện thoại quét đều được đếm chung, trang Admin đọc từ đó.
 * - Không có: lưu trong localStorage (chỉ đếm được trên trình duyệt này, dùng để demo khi chưa có Backend).
 * Số liệu có cùng dạng với lượt truy cập: visitors = số người quét (không trùng), views = số lượt quét.
 */
import { addVisit, sampleData, summarize, visitorId } from './analytics.js';

const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';
const SUPA_URL = ((import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '').replace(/\/+$/, '');
const SUPA_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
const SUPA = Boolean(SUPA_URL && SUPA_KEY);
const TZ_HOURS = 7; // ngày thống kê theo giờ Việt Nam
const PUBLIC_URL = (import.meta.env && import.meta.env.VITE_PUBLIC_URL) || '';
const K_SCANS = 'dubchef-qr-scans';
const K_SEEN = 'dubchef-qr-seen'; // sessionStorage: phiên này đã tính một lượt quét rồi

/** true = số liệu quét được lưu dùng chung (Backend hoặc Supabase), không phải chỉ trong trình duyệt này. */
export const QR_SHARED = Boolean(BASE || SUPA);

async function rpc(name, body) {
  const res = await fetch(SUPA_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
    body: JSON.stringify(body),
    keepalive: true,
  });
  if (!res.ok) throw new Error('supabase');
  return res.status === 204 ? null : res.json();
}

const p2 = (n) => String(n).padStart(2, '0');
/** Ngày YYYY-MM-DD theo múi giờ lệch TZ_HOURS so với UTC. */
function tzDay(ms) {
  const d = new Date(ms + TZ_HOURS * 3600000);
  return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate());
}

/** Ghép số liệu thô từ Supabase thành cùng dạng với summarize(). */
export function buildStats({ days, period, prev, totals, activeNow }, now, span) {
  const byDate = new Map((days || []).map((d) => [d.date, d]));
  const at = (i) => {
    const key = tzDay(now - i * 86400000);
    const d = byDate.get(key);
    return { date: key, visitors: d ? d.visitors : 0, views: d ? d.views : 0 };
  };
  const series = [];
  for (let i = span - 1; i >= 0; i--) series.push(at(i));
  const today = series[series.length - 1];
  const yesterday = at(1);
  const peak = series.reduce((a, b) => (b.visitors > a.visitors ? b : a), series[0]);
  return {
    span,
    today: { visitors: today.visitors, views: today.views },
    yesterday: { visitors: yesterday.visitors, views: yesterday.views },
    period, prev, total: totals, activeNow,
    series, peak: { date: peak.date, visitors: peak.visitors },
  };
}

/** Đường dẫn trang đích của mã QR (trong HashRouter). */
export const GUEST_PATH = '/guest';

/**
 * Địa chỉ nằm trong mã QR. Mặc định là địa chỉ web đang mở; đặt VITE_PUBLIC_URL khi chạy trên máy
 * cá nhân để điện thoại (không truy cập được localhost) quét vào đúng địa chỉ đã đăng.
 */
export function guestUrl(href = window.location.href) {
  return (PUBLIC_URL || href).split(/[?#]/)[0] + '#' + GUEST_PATH;
}

/** Địa chỉ chỉ mở được trên chính máy này (điện thoại quét sẽ không vào được). */
export const isLocalAddress = (url) => /^(https?:\/\/)?(localhost|127\.|\[::1\]|0\.0\.0\.0)/i.test(url) || url.startsWith('file:');

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(K_SCANS));
    return v && v.visitors && v.days ? v : { visitors: {}, days: {} };
  } catch (e) {
    return { visitors: {}, days: {} };
  }
}
function write(data) {
  try { localStorage.setItem(K_SCANS, JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
}

/**
 * Ghi một lượt quét khi khách mở trang /guest. Mỗi phiên trình duyệt chỉ ghi một lần
 * (tải lại trang không làm tăng số liệu). Trả true nếu đã ghi.
 */
export function trackScan(lang) {
  try {
    if (sessionStorage.getItem(K_SEEN)) return false;
    sessionStorage.setItem(K_SEEN, '1');
  } catch (e) { /* không có sessionStorage thì vẫn ghi */ }
  const id = visitorId();
  if (BASE) {
    fetch(BASE + '/api/qr-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: id, lang }),
      keepalive: true,
    }).catch(() => {});
    return true;
  }
  if (SUPA) {
    rpc('qr_track', { p_visitor: id, p_lang: lang }).catch(() => {});
    return true;
  }
  write(addVisit(read(), { id, path: GUEST_PATH, lang, at: new Date() }));
  return true;
}

export const qrStats = {
  /** Số liệu người quét trong `span` ngày gần nhất -> { stats } (cùng dạng với analytics.stats.load). */
  async load(user, span = 7) {
    if (BASE) {
      const res = await fetch(BASE + '/api/admin/qr?days=' + span, { headers: { 'X-User-Email': user.email, ...(user.token ? { Authorization: 'Bearer ' + user.token } : {}) } });
      if (!res.ok) throw new Error('server');
      return res.json();
    }
    if (SUPA) {
      const raw = await rpc('qr_stats', { p_days: span, p_tz: TZ_HOURS });
      return { stats: buildStats(raw, Date.now(), span) };
    }
    return { stats: summarize(read(), new Date(), span) };
  },
  /** Nạp dữ liệu mẫu (chỉ ở chế độ lưu tạm). */
  seed() {
    if (!QR_SHARED) write(sampleData());
  },
  /** Xóa số liệu quét đã lưu (chỉ ở chế độ lưu tạm). */
  reset() {
    if (!QR_SHARED) {
      try { localStorage.removeItem(K_SCANS); } catch (e) { /* bỏ qua */ }
    }
  },
};
