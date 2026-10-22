/**
 * Đếm lượt truy cập cho trang Quản trị.
 * - Có VITE_API_URL: gửi từng lượt xem lên Backend (POST /api/track), trang Admin đọc GET /api/admin/overview.
 * - Không có: lưu trong localStorage (chỉ đếm được trên trình duyệt này, dùng để demo khi chưa có Backend).
 */
const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';

const K_VISITS = 'dubchef-visits';
const K_VID = 'dubchef-vid';
export const ACTIVE_MINUTES = 5; // "đang online" = có hoạt động trong 5 phút gần nhất
export const KEEP_DAYS = 90; // chỉ giữ số liệu 90 ngày gần nhất cho nhẹ

const EMPTY = () => ({ visitors: {}, days: {} });

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(K_VISITS));
    return v && v.visitors && v.days ? v : EMPTY();
  } catch (e) {
    return EMPTY();
  }
}
function write(data) {
  try { localStorage.setItem(K_VISITS, JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
}

/** Ngày dạng YYYY-MM-DD theo giờ máy. */
export function dayKey(date) {
  const p = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
}

function visitorId() {
  try {
    let id = localStorage.getItem(K_VID);
    if (!id) {
      id = 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(K_VID, id);
    }
    return id;
  } catch (e) {
    return 'v-anon';
  }
}

/** Ghi một lượt xem trang vào dữ liệu `data` (hàm thuần, dễ kiểm thử). */
export function addVisit(data, { id, path, lang, at }) {
  const key = dayKey(at);
  const day = data.days[key] || (data.days[key] = { views: 0, ids: [], pages: {}, langs: {} });
  day.views += 1;
  if (!day.ids.includes(id)) day.ids.push(id);
  day.pages[path] = (day.pages[path] || 0) + 1;
  day.langs[lang] = (day.langs[lang] || 0) + 1;
  const v = data.visitors[id] || (data.visitors[id] = { first: at.getTime(), last: 0 });
  v.last = at.getTime();
  // Bỏ ngày quá cũ.
  const keys = Object.keys(data.days).sort();
  keys.slice(0, Math.max(0, keys.length - KEEP_DAYS)).forEach((k) => delete data.days[k]);
  return data;
}

/** Tổng hợp số liệu cho trang Admin (hàm thuần). */
export function summarize(data, now = new Date(), span = 7) {
  const series = [];
  const weekIds = new Set();
  let weekViews = 0;
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const day = data.days[dayKey(d)];
    series.push({ date: dayKey(d), visitors: day ? day.ids.length : 0, views: day ? day.views : 0 });
    if (day) {
      day.ids.forEach((x) => weekIds.add(x));
      weekViews += day.views;
    }
  }
  const pages = {};
  const langs = {};
  let totalViews = 0;
  for (const day of Object.values(data.days)) {
    totalViews += day.views;
    for (const [p, n] of Object.entries(day.pages)) pages[p] = (pages[p] || 0) + n;
    for (const [l, n] of Object.entries(day.langs)) langs[l] = (langs[l] || 0) + n;
  }
  const since = now.getTime() - ACTIVE_MINUTES * 60000;
  const today = series[series.length - 1];
  return {
    today: { visitors: today.visitors, views: today.views },
    week: { visitors: weekIds.size, views: weekViews },
    total: { visitors: Object.keys(data.visitors).length, views: totalViews },
    activeNow: Object.values(data.visitors).filter((v) => v.last >= since).length,
    series,
    topPages: Object.entries(pages).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 6),
    langs: { vi: langs.vi || 0, en: langs.en || 0, zh: langs.zh || 0 },
  };
}

/** Dữ liệu mẫu 14 ngày để thử giao diện (id bắt đầu bằng "demo-"). Cùng một kết quả mỗi lần. */
export function sampleData(now = new Date()) {
  const data = EMPTY();
  const paths = ['/', '/features', '/demo', '/pricing', '/about', '/contact', '/faq'];
  const langs = ['vi', 'vi', 'vi', 'en', 'en', 'zh'];
  let seed = 7;
  const rnd = (n) => {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * n);
  };
  for (let back = 13; back >= 0; back--) {
    const visitors = 12 + rnd(30) + (13 - back) * 2; // tăng dần theo thời gian
    for (let n = 0; n < visitors; n++) {
      const id = 'demo-' + rnd(260);
      const views = 1 + rnd(4);
      for (let k = 0; k < views; k++) {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back, 8 + rnd(14), rnd(60));
        addVisit(data, { id, path: paths[rnd(paths.length)], lang: langs[rnd(langs.length)], at });
      }
    }
  }
  return data;
}

/** Gọi mỗi lần mở một trang. Trang Admin không tự tính vào số liệu. */
export function trackVisit(path, lang) {
  if (path.startsWith('/admin')) return;
  const id = visitorId();
  if (BASE) {
    fetch(BASE + '/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: id, path, lang }),
    }).catch(() => {});
    return;
  }
  write(addVisit(read(), { id, path, lang, at: new Date() }));
}

export const stats = {
  /** Số liệu tổng hợp. Có Backend: GET /api/admin/overview -> { stats, users, messages }. */
  async load(user) {
    if (BASE) {
      const res = await fetch(BASE + '/api/admin/overview', { headers: { 'X-User-Email': user.email } });
      if (!res.ok) throw new Error('server');
      return res.json();
    }
    const list = (key) => {
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
    };
    return {
      stats: summarize(read()),
      users: list('dubchef-users').map(({ name, email }) => ({ name, email })),
      messages: list('dubchef-messages'),
    };
  },
  /** Nạp dữ liệu mẫu (chỉ ở chế độ lưu tạm). */
  seed() {
    if (!BASE) write(sampleData());
  },
  /** Xóa toàn bộ số liệu truy cập đã lưu (chỉ ở chế độ lưu tạm). */
  reset() {
    if (!BASE) {
      try { localStorage.removeItem(K_VISITS); } catch (e) { /* bỏ qua */ }
    }
  },
};
