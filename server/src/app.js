// Các đường dẫn API. `repo` là lớp truy cập CSDL (db.js), tách ra để dễ thay khi kiểm thử.
import express from 'express';
import cors from 'cors';
import { METHODS, newTransactionRef, priceOrder, validateOrder } from './orders.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

export function createApp(repo, { corsOrigin = '*' } = {}) {
  const app = express();
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '10kb' }));

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

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ code: 'server' });
  });
  return app;
}
