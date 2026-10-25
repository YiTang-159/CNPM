/**
 * Đơn hàng và thanh toán ở trang Bảng giá (thẻ, MoMo, chuyển khoản, quét mã QR).
 * - Có VITE_PAYMENT_API_URL (API Node.js + SQL Server trong Docker): gọi POST /api/orders, POST /api/orders/:id/pay, GET /api/orders.
 * - Không có: lưu tạm trong localStorage của trình duyệt (để demo khi chưa chạy Docker).
 * Biến này tách riêng với VITE_API_URL (Backend đăng nhập) để bật thanh toán thật mà không ảnh hưởng đăng nhập.
 */
import { calcPrice } from '../shared/pricing.js';

const BASE = (import.meta.env && import.meta.env.VITE_PAYMENT_API_URL) || '';
export const HAS_PAYMENT_API = Boolean(BASE);
const K_ORDERS = 'dubchef-orders';

/** Thứ tự khớp với L của giao diện: 0 Việt, 1 Anh, 2 Trung. */
export const CURRENCIES = ['VND', 'USD', 'CNY'];
export const METHODS = ['card', 'momo', 'bank', 'qr'];
const MINOR_PER_UNIT = [1, 100, 100];

/** Số tiền của đơn theo đơn vị chính (đồng, đô la, nhân dân tệ) để đưa vào formatMoney. */
export const orderAmount = (order) => order.amountMinor / MINOR_PER_UNIT[CURRENCIES.indexOf(order.currency)];

/** Nội dung mã QR thanh toán (giả lập): mã đơn, số tiền, loại tiền và nội dung chuyển khoản. */
export function paymentPayload(order) {
  return ['DUBCHEF-PAY', 'order=' + order.id, 'amount=' + orderAmount(order), 'cur=' + order.currency, 'memo=DUBCHEF' + order.id].join('|');
}

function read() {
  try { return JSON.parse(localStorage.getItem(K_ORDERS)) || []; } catch (e) { return []; }
}
function write(list) {
  try { localStorage.setItem(K_ORDERS, JSON.stringify(list)); } catch (e) { /* bỏ qua */ }
}

async function remote(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('net');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.code || 'server');
  return data;
}

const ref = (method) => method.toUpperCase() + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(16).slice(2, 10).toUpperCase();

export const orders = {
  /** Tạo đơn chờ thanh toán. Giá do máy chủ tính; ở chế độ lưu tạm thì tính bằng cùng công thức. */
  async create({ name, email, uploads, outs, L }) {
    if (BASE) return (await remote('POST', '/api/orders', { name, email, uploads, outs, L })).order;
    const total = calcPrice(L, uploads, outs).total;
    const list = read();
    const order = {
      id: (list.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1,
      name, email: email.trim().toLowerCase(), uploads, outs,
      currency: CURRENCIES[L],
      amountMinor: Math.round(total * MINOR_PER_UNIT[L]),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ref: null,
    };
    write([...list, order]);
    return order;
  },

  /** Thanh toán giả lập một đơn. Trả { order, payment }. */
  async pay(id, method) {
    if (BASE) return remote('POST', '/api/orders/' + id + '/pay', { method });
    const list = read();
    const found = list.find((o) => o.id === id);
    if (!found || found.status !== 'pending' || !METHODS.includes(method)) throw new Error('not_payable');
    const paid = { ...found, status: 'paid', ref: ref(method) };
    write(list.map((o) => (o.id === id ? paid : o)));
    return { order: paid, payment: { method, ref: paid.ref } };
  },

  /** Đơn gần đây của một email, mới nhất trước. */
  async list(email) {
    if (BASE) return (await remote('GET', '/api/orders?email=' + encodeURIComponent(email))).orders;
    return read()
      .filter((o) => o.email === email.trim().toLowerCase())
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  },
};
