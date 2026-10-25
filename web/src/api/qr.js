/**
 * Mã QR "trải nghiệm với tư cách khách" và số liệu người quét cho trang Quản trị.
 * - Có VITE_API_URL: mỗi lượt quét gửi POST /api/qr-scan; trang Admin đọc GET /api/admin/qr?days=N.
 * - Không có: lưu trong localStorage (chỉ đếm được trên trình duyệt này, dùng để demo khi chưa có Backend).
 * Số liệu có cùng dạng với lượt truy cập: visitors = số người quét (không trùng), views = số lượt quét.
 */
import { addVisit, sampleData, summarize, visitorId } from './analytics.js';

const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';
const PUBLIC_URL = (import.meta.env && import.meta.env.VITE_PUBLIC_URL) || '';
const K_SCANS = 'dubchef-qr-scans';
const K_SEEN = 'dubchef-qr-seen'; // sessionStorage: phiên này đã tính một lượt quét rồi

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
    return { stats: summarize(read(), new Date(), span) };
  },
  /** Nạp dữ liệu mẫu (chỉ ở chế độ lưu tạm). */
  seed() {
    if (!BASE) write(sampleData());
  },
  /** Xóa số liệu quét đã lưu (chỉ ở chế độ lưu tạm). */
  reset() {
    if (!BASE) {
      try { localStorage.removeItem(K_SCANS); } catch (e) { /* bỏ qua */ }
    }
  },
};
