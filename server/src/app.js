// Các đường dẫn API. `repo` là lớp truy cập CSDL (db.js), tách ra để dễ thay khi kiểm thử.
import express from 'express';
import cors from 'cors';
import { METHODS, newTransactionRef, priceOrder, validateOrder } from './orders.js';
import { hashPassword, makeToken, readToken, verifyPassword } from './auth.js';
import { buildStats } from './stats.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

const publicUser = (u, secret) => ({ name: u.name, email: u.email, role: u.role, token: makeToken(u, secret) });

export function createApp(repo, { corsOrigin = '*', secret = 'dev-secret', tz = 7 } = {}) {
  const app = express();
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '10kb' }));

  // Chỉ quản trị viên (token hợp lệ, role admin) được qua. Không tin header X-User-Email vì ai cũng giả được.
  const adminOnly = (req, res, next) => {
    const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    const who = m && readToken(m[1], secret);
    if (!who) return res.status(401).json({ code: 'auth' });
    if (who.role !== 'admin') return res.status(403).json({ code: 'forbidden' });
    next();
  };

  app.get('/api/health', wrap(async (req, res) => {
    try {
      await repo.ping();
      res.json({ ok: true, db: true });
    } catch (e) {
      res.status(503).json({ ok: false, db: false });
    }
  }));

  // Tạo đơn: giá do máy chủ tính, trạng thái "pending"
  app.post('/api/orders', wrap(async (req, res) => {
    const v = validateOrder(req.body);
    if (v.error) return res.status(400).json({ code: v.error });
    const order = await repo.createOrder({ ...v.value, ...priceOrder(v.value) });
    res.status(201).json({ order });
  }));

  // Thanh toán giả lập: không nhận số thẻ, chỉ ghi phương thức và mã giao dịch
  app.post('/api/orders/:id/pay', wrap(async (req, res) => {
    const id = Number(req.params.id);
    const method = req.body && req.body.method;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ code: 'invalid' });
    if (!METHODS.includes(method)) return res.status(400).json({ code: 'method' });
    const result = await repo.payOrder(id, { method, ref: newTransactionRef(method) });
    if (!result) return res.status(409).json({ code: 'not_payable' });
    res.json(result);
  }));

  // Đơn của một email (bản demo: chưa có xác thực, bản thật cần kiểm tra đăng nhập)
  app.get('/api/orders', wrap(async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return res.status(400).json({ code: 'email' });
    res.json({ orders: await repo.listOrders(email) });
  }));

  // ---- Tài khoản ----
  app.post('/api/auth/register', wrap(async (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    if (!name || name.length > 100 || !EMAIL.test(email) || email.length > 254 || password.length < 8 || password.length > 200) {
      return res.status(400).json({ code: 'invalid' });
    }
    const user = await repo.createUser({ name, email, passwordHash: hashPassword(password) });
    if (!user) return res.status(409).json({ code: 'exists' });
    res.status(201).json({ user: publicUser(user, secret) });
  }));

  app.post('/api/auth/login', wrap(async (req, res) => {
    const b = req.body || {};
    const user = await repo.findUser(String(b.email || '').trim().toLowerCase());
    if (!user || !verifyPassword(String(b.password || ''), user.hash)) return res.status(401).json({ code: 'invalid' });
    if (user.status === 'locked') return res.status(403).json({ code: 'locked' });
    res.json({ user: publicUser(user, secret) });
  }));

  app.post('/api/contact', wrap(async (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const body = String(b.message || '').trim();
    if (!name || name.length > 100 || !EMAIL.test(email) || !body || body.length > 2000) return res.status(400).json({ code: 'invalid' });
    await repo.addMessage({ name, email, body });
    res.status(201).json({ ok: true });
  }));

  // ---- Đếm truy cập ----
  app.post('/api/track', wrap(async (req, res) => {
    const b = req.body || {};
    const visitorId = String(b.visitorId || '');
    const path = String(b.path || '');
    const lang = String(b.lang || '');
    if (!/^[\w-]{1,64}$/.test(visitorId) || !path.startsWith('/') || path.length > 200 || !/^[a-z]{2,8}$/.test(lang)) {
      return res.status(400).json({ code: 'invalid' });
    }
    if (path.startsWith('/admin')) return res.status(204).end();
    await repo.addVisit({ visitorId, path, lang });
    res.status(204).end();
  }));

  // ---- Đếm lượt quét mã QR của khách (trang /guest) ----
  app.post('/api/qr-scan', wrap(async (req, res) => {
    const b = req.body || {};
    const visitorId = String(b.visitorId || '');
    const lang = String(b.lang || '');
    if (!/^[\w-]{1,64}$/.test(visitorId) || !/^[a-z]{2,8}$/.test(lang)) return res.status(400).json({ code: 'invalid' });
    await repo.addQrScan({ visitorId, lang });
    res.status(204).end();
  }));

  // ---- Trang quản trị ----
  app.get('/api/admin/overview', adminOnly, wrap(async (req, res) => {
    const span = [7, 14, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
    const raw = await repo.visitStats(span, tz);
    res.json({ stats: buildStats(raw, Date.now(), span, tz) });
  }));

  // Số người quét mã QR của khách: cùng dạng với /overview (visitors = người quét, views = lượt quét)
  app.get('/api/admin/qr', adminOnly, wrap(async (req, res) => {
    const span = [7, 14, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
    const raw = await repo.qrStats(span, tz);
    res.json({ stats: buildStats(raw, Date.now(), span, tz) });
  }));

  app.get('/api/admin/users', adminOnly, wrap(async (req, res) => {
    const users = (await repo.listUsers()).filter((u) => u.role === 'user');
    res.json({ users: users.map(({ name, email, at, status }) => ({ name, email, at, status })) });
  }));

  app.get('/api/admin/videos', adminOnly, wrap(async (req, res) => {
    const videos = await repo.listVideos();
    res.json({
      videos
    });
  }));

  app.patch('/api/admin/users', adminOnly, wrap(async (req, res) => {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const status = req.body && req.body.status;
    if (!['active', 'locked'].includes(status)) return res.status(400).json({ code: 'invalid' });
    if (!(await repo.setUserStatus(email, status))) return res.status(404).json({ code: 'not_found' });
    res.json({ ok: true });
  }));

  app.delete('/api/admin/users', adminOnly, wrap(async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!(await repo.deleteUser(email))) return res.status(404).json({ code: 'not_found' });
    res.json({ ok: true });
  }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ code: 'server' });
  });
  return app;
}
