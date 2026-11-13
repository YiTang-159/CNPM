// Các đường dẫn API. `repo` là lớp truy cập CSDL (db.js), tách ra để dễ thay khi kiểm thử.
import express from 'express';
import { mkdir, rename, unlink, stat, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import { METHODS, newTransactionRef, priceOrder, validateOrder } from './orders.js';
import { hashPassword, isLegacyHash, makeToken, readToken, verifyPassword } from './auth.js';
import { buildStats } from './stats.js';
import { validMediaLines, validateFeedback, MEDIA_STATES } from './adminPolicy.js';
import { produceVoiceover } from './audioExport.js';

const MAX_VIDEO = 150 * 1024 * 1024;
const DEFAULT_UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const VALID_LANG = /^[a-z]{2,8}$/;
const PROCESSING_LANGUAGES = new Set(['vi','en','zh']);
const STATUS = ['uploaded','processing','completed','failed','hidden'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Giới hạn đăng nhập sai: tối đa 10 lần / 15 phút/IP (chưa thay thế rate limit phân tán).
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const publicUser = (u, secret) => ({ id: u.id, name: u.name, email: u.email, role: u.role, token: makeToken(u, secret) });

export function createApp(repo, { corsOrigin = '*', secret = 'dev-secret', tz = 7, uploadDir = DEFAULT_UPLOAD_DIR, maxUploadBytes = MAX_VIDEO,
  paymentDemo = process.env.PAYMENT_DEMO === 'true' } = {}) {
  const UPLOAD_DIR = resolve(uploadDir);
  const app = express();
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '1mb' }));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Frame-Options', 'DENY');
    if (/^\/api\/(admin|me|auth|orders)(\/|$)/.test(req.path)) res.set('Cache-Control', 'no-store');
    next();
  });

  // Xác thực lại với SQL ở mỗi request: khóa/xóa tài khoản sẽ vô hiệu hóa token cũ.
  const auth = wrap(async (req, res, next) => {
    const token = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
    const who = token && readToken(token[1], secret);
    if (!who) return res.status(401).json({ code: 'auth' });
    const current = await repo.findUser(who.email);
    if (!current || current.status !== 'active' || current.role !== who.role || (current.id != null && current.id !== who.id))
      return res.status(401).json({ code: 'auth' });
    req.currentUser = current;
    next();
  });
  const adminOnly = [auth, (req, res, next) => req.currentUser.role === 'admin'
    ? next() : res.status(403).json({ code: 'forbidden' })];
  // Admin chỉ quản lý/đối soát; không thể tạo đơn hoặc tự xác nhận mua gói như khách hàng.
  const customerOnly = [auth, (req, res, next) => req.currentUser.role === 'user'
    ? next() : res.status(403).json({ code: 'forbidden' })];
  const videoFor = async (req, res, admin = false) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ code: 'invalid' }); return null; }
    const video = await repo.getVideo(id);
    if (!video) { res.status(404).json({ code: 'not_found' }); return null; }
    if (!admin && req.currentUser.role !== 'admin' && video.userEmail !== req.currentUser.email) {
      res.status(403).json({ code: 'forbidden' }); return null;
    }
    return video;
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
  app.post('/api/orders', customerOnly, wrap(async (req, res) => {
    const v = validateOrder(req.body);
    if (v.error) return res.status(400).json({ code: v.error });
    if (v.value.email !== req.currentUser.email) return res.status(403).json({ code: 'forbidden' });
    // Chủ sở hữu lấy từ token đã đối chiếu SQL, tuyệt đối không lấy MaNguoiDung từ form.
    const order = await repo.createOrder({ ...v.value, userId: req.currentUser.id,
      name: req.currentUser.name, ...priceOrder(v.value) });
    if (!order) return res.status(409).json({ code: 'account_unavailable' });
    res.status(201).json({ order });
  }));

  // Thanh toán giả lập: không nhận số thẻ, chỉ ghi phương thức và mã giao dịch
  app.post('/api/orders/:id/pay', customerOnly, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const method = req.body && req.body.method;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ code: 'invalid' });
    if (!METHODS.includes(method)) return res.status(400).json({ code: 'method' });
    if (!await repo.orderOwner(id, req.currentUser.id)) return res.status(404).json({ code: 'not_found' });
    if (!paymentDemo) return res.status(503).json({ code: 'payment_unavailable' });
    const result = await repo.payOrder(id, { method, ref: newTransactionRef(method) });
    if (!result) return res.status(409).json({ code: 'not_payable' });
    res.json(result);
  }));

  // Đơn hàng chỉ được xem bởi chính tài khoản đã tạo.
  app.get('/api/orders', customerOnly, wrap(async (req, res) => {
    res.json({ orders: await repo.listOrders(req.currentUser.email, 20, req.currentUser.id) });
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

  const loginFails = new Map();
  const failsOf = (ip) => {
    const now = Date.now();
    const f = loginFails.get(ip);
    if (!f || f.until < now) { loginFails.delete(ip); return 0; }
    return f.count;
  };
  const addFail = (ip) => {
    const now = Date.now();
    const f = loginFails.get(ip);
    loginFails.set(ip, f && f.until >= now ? { count: f.count + 1, until: f.until } : { count: 1, until: now + LOGIN_WINDOW_MS });
    if (loginFails.size > 10000) for (const [k, v] of loginFails) if (v.until < now) loginFails.delete(k);
  };

  app.post('/api/auth/login', wrap(async (req, res) => {
    const b = req.body || {};
    if (failsOf(req.ip) >= LOGIN_MAX_FAILS) return res.status(429).json({ code: 'too_many' });
    const user = await repo.findUser(String(b.email || '').trim().toLowerCase());
    const password = String(b.password || '');
    if (!user || !verifyPassword(password, user.hash)) { addFail(req.ip); return res.status(401).json({ code: 'invalid' }); }
    if (user.status !== 'active') return res.status(403).json({ code: 'locked' });
    // Băm SHA-256 cũ được nâng lên scrypt ngay sau lần đăng nhập đúng.
    if (isLegacyHash(user.hash) && typeof repo.updatePasswordHash === 'function') {
      const upgraded = hashPassword(password);
      if (await repo.updatePasswordHash(user.email, upgraded, user.hash).catch(() => false)) user.hash = upgraded;
    }
    loginFails.delete(req.ip); // Một lần đăng nhập hợp lệ đặt lại bộ đếm của IP này.
    if (typeof repo.recordLogin === 'function') {
      await repo.recordLogin(user.id, req.ip).catch(e => console.warn('Lỗi lưu lịch sử đăng nhập:', e.message));
    }
    res.json({ user: publicUser(user, secret) });
  }));

  // ---- Hồ sơ người dùng ----
  app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.currentUser, secret) }));
  app.patch('/api/me', auth, wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 100) return res.status(400).json({ code: 'invalid' });
    const updated = await repo.updateProfile(req.currentUser.email, name);
    if (!updated) return res.status(404).json({ code: 'not_found' });
    res.json({ user: publicUser(updated, secret) });
  }));
  app.patch('/api/me/password', auth, wrap(async (req, res) => {
    const oldPass = String(req.body?.currentPassword || '');
    const password = String(req.body?.newPassword || '');
    if (password.length < 8 || password.length > 200 || !verifyPassword(oldPass, req.currentUser.hash))
      return res.status(400).json({ code: 'invalid' });
    await repo.updatePassword(req.currentUser.email, hashPassword(password));
    res.json({ ok: true });
  }));

  // ---- Video do khách tải lên; lưu file ở volume, metadata và kết quả ở SQL ----
  app.get('/api/videos', auth, wrap(async (req, res) => {
    res.json({ videos: await repo.userVideos(req.currentUser.email) });
  }));
  app.post('/api/videos', auth, wrap(async (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    const fileName = String(b.fileName || '').trim();
    const size = Number(b.size);
    const mimeType = String(b.mimeType || '').trim().toLowerCase();
    const originalLanguage = String(b.originalLanguage || '').trim();
    if (!title || title.length > 200 || !fileName || fileName.length > 255 ||
        !Number.isSafeInteger(size) || size <= 0 || size > maxUploadBytes ||
        !['video/mp4','video/webm','video/quicktime'].includes(mimeType) || !VALID_LANG.test(originalLanguage))
      return res.status(400).json({ code: 'invalid' });
    const record = await repo.createVideo(req.currentUser.email, { title, fileName, size, mimeType, originalLanguage });
    if (!record) return res.status(404).json({ code: 'not_found' });
    res.status(201).json({ video: record });
  }));
  app.put('/api/videos/:id/file', auth, wrap(async (req, res) => {
    const video = await videoFor(req, res);
    if (!video) return;
    if (video.videoUrl) return res.status(409).json({ code: 'exists' });
    if (req.get('content-type')?.split(';')[0] !== 'application/octet-stream')
      return res.status(415).json({ code: 'invalid' });
    if (Number(req.get('content-length')) > maxUploadBytes) return res.status(413).json({ code: 'too_large' });
    await mkdir(UPLOAD_DIR, { recursive: true });
    const key = `${video.id}-${randomUUID()}.bin`;
    const tempPath = join(UPLOAD_DIR, key + '.part');
    const finalPath = join(UPLOAD_DIR, key);
    let length = 0;
    const counter = new Transform({ transform(chunk, enc, cb) {
      length += chunk.length;
      cb(length > maxUploadBytes ? new Error('too_large') : null, chunk);
    }});
    try {
      await pipeline(req, counter, createWriteStream(tempPath, { flags: 'wx' }));
      if (length !== Number(video.size)) throw new Error('size_mismatch');
      await rename(tempPath, finalPath);
      await repo.setVideoFile(video.id, finalPath);
      res.status(201).json({ ok: true, id: video.id });
    } catch (err) {
      await unlink(tempPath).catch(() => {});
      await unlink(finalPath).catch(() => {});
      if (err.message === 'too_large' || err.message === 'size_mismatch')
        return res.status(err.message === 'too_large' ? 413 : 400).json({ code: err.message });
      throw err;
    }
  }));
  app.get('/api/videos/:id/file', auth, wrap(async (req, res) => {
    const video = await videoFor(req, res);
    if (!video) return;
    if (!video.videoUrl) return res.status(404).json({ code: 'not_found' });
    // Chỉ mở đường dẫn đã sinh bên trong volume.
    if (!video.videoUrl.startsWith(UPLOAD_DIR + sep)) return res.status(403).json({ code: 'forbidden' });
    const size = await stat(video.videoUrl).catch(() => null);
    if (!size) return res.status(404).json({ code: 'not_found' });
    res.type(video.mimeType).sendFile(video.videoUrl);
  }));
  app.post('/api/videos/:id/results', auth, wrap(async (req, res) => {
    const video = await videoFor(req, res);
    if (!video) return;
    const originalLanguage = req.body?.originalLanguage;
    if (originalLanguage != null && !PROCESSING_LANGUAGES.has(originalLanguage)) return res.status(400).json({code:'invalid'});
    const segments = req.body?.segments;
    if (!Array.isArray(segments) || !segments.length || segments.length > 2000 ||
        segments.some(s => !s || typeof s !== 'object' || !Object.keys(s).some(k => VALID_LANG.test(k)) ||
          [...PROCESSING_LANGUAGES].some(k => s[k] != null && (typeof s[k] !== 'string' || s[k].length > 4000)) ||
          ((s.start != null || s.end != null) && (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start))))
      return res.status(400).json({ code: 'invalid' });
    if (segments.some((s,i) => i > 0 && s.start != null && segments[i-1].end != null && s.start < segments[i-1].end))
      return res.status(400).json({ code:'invalid' });
    const langs = [...new Set(segments.flatMap(s => Object.keys(s).filter(k => PROCESSING_LANGUAGES.has(k) && typeof s[k] === 'string')))];
    if (!langs.length) return res.status(400).json({ code: 'invalid' });
    const result = { narrations: {}, subtitles: {} };
    for (const lang of langs) {
      const content = JSON.stringify(segments.filter(s => s[lang] != null).map(s => ({ text: s[lang], start: s.start ?? null, end: s.end ?? null })));
      result.narrations[lang] = content;
      result.subtitles[lang] = content;
    }
    await repo.saveVideoResult(video.id, 'completed', result, req.currentUser.email, originalLanguage);
    res.json({ ok: true, languages: langs });
  }));
  app.get('/api/videos/:id/results', auth, wrap(async (req, res) => {
    const video = await videoFor(req, res);
    if (!video) return;
    res.json(await repo.videoResults(video.id));
  }));
  app.get('/api/languages', wrap(async (req, res) => res.json({ languages: (await repo.languages()).filter(x => x.status === 'active' && PROCESSING_LANGUAGES.has(x.code)) })));

  // Xuất MP3/MP4 thật từ KỊCH BẢN ĐÃ XUẤT BẢN, không dùng speechSynthesis trên trình duyệt.
  // Có giới hạn 1 công việc tại một thời điểm để tránh tăng tải CPU/RAM của máy demo.
  const activeVoiceExports = new Set();
  async function downloadVoiceover(req, res) {
    const video = await videoFor(req, res);
    if (!video) return;
    const language = String(req.params.language || '');
    const format = String(req.params.format || '');
    if (!PROCESSING_LANGUAGES.has(language) || !['mp3','mp4'].includes(format))
      return res.status(400).json({code:'invalid'});
    if (activeVoiceExports.size) return res.status(429).json({code:'export_busy'});
    const media = await repo.mediaDetail('narrations', video.id, language);
    if (!media) return res.status(404).json({code:'narration_not_found'});
    if (media.status !== 'published') return res.status(409).json({code:'narration_not_published'});
    const videoPath = typeof video.videoUrl === 'string' && video.videoUrl.startsWith(UPLOAD_DIR + sep)
      && await stat(video.videoUrl).catch(() => null) ? video.videoUrl : null;
    if (format === 'mp4' && !videoPath) return res.status(409).json({code:'video_file_missing'});
    const key = `${video.id}-${language}`;
    activeVoiceExports.add(key);
    let generated;
    try {
      generated = await produceVoiceover({content:media.content, language, format, sourceVideo:videoPath});
      const fileName = `dubchef-video-${video.id}-${language}-v${media.version}.${format}`;
      res.set('Cache-Control', 'no-store');
      return res.download(generated.output, fileName, async (err) => {
        await rm(generated.directory, {recursive:true, force:true}).catch(() => {});
        if (err && !res.headersSent) res.status(500).json({code:'download_failed'});
      });
    } catch (error) {
      if (generated) await rm(generated.directory, {recursive:true, force:true}).catch(() => {});
      if (error.status) return res.status(error.status).json({code:error.code, ...(error.segment ? {segment:error.segment} : {})});
      throw error;
    } finally { activeVoiceExports.delete(key); }
  }
  app.get('/api/videos/:id/exports', auth, wrap(async (req, res) => {
    const video = await videoFor(req, res);
    if (!video) return;
    const details = await Promise.all([...PROCESSING_LANGUAGES].map(language => repo.mediaDetail('narrations', video.id, language)));
    const available = [...PROCESSING_LANGUAGES].filter((language, index) => details[index]?.status === 'published');
    res.json({languages: available, hasVideo: Boolean(video.videoUrl)});
  }));
  app.get('/api/videos/:id/export/:language/:format', auth, wrap(downloadVoiceover));
  // Admin được xuất bản đã duyệt của mọi video; videoFor cũng xác thực tài khoản SQL.

  // ---- Phản hồi có tài khoản ----
  app.get('/api/feedback', auth, wrap(async (req, res) => {
    res.json({ feedback: await repo.userFeedback(req.currentUser.email) });
  }));
  app.post('/api/feedback', auth, wrap(async (req, res) => {
    const message = String(req.body?.message || '').trim();
    const videoId = req.body?.videoId == null || req.body?.videoId === '' ? null : Number(req.body.videoId);
    if (!message || message.length > 2000 || (videoId !== null && (!Number.isSafeInteger(videoId) || videoId <= 0)))
      return res.status(400).json({ code: 'invalid' });
    if (videoId !== null) {
      const video = await repo.getVideo(videoId);
      if (!video || video.userEmail !== req.currentUser.email) return res.status(404).json({ code: 'not_found' });
    }
    const feedback = await repo.addFeedback(req.currentUser.email, message, videoId);
    res.status(201).json({ feedback });
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

  // Trang tổng hợp: nhiều module, một API duy nhất; luôn xác thực quyền Admin.
  app.get('/api/admin/dashboard', adminOnly, wrap(async (req, res) => {
    res.json(await repo.dashboardSummary());
  }));

  // API thống kê tổng quan Admin từ SQL Server
  app.get('/api/admin/statistics', adminOnly, wrap(async (req, res) => {
    const statistics = await repo.adminStatistics();

    res.json({
      success: true,
      statistics
    });
  }));

  app.get('/api/admin/videos', adminOnly, wrap(async (req, res) => {
    const videos = await repo.listVideos();
    res.json({
      videos
    });
  }));

  // Quản lý nội dung theo quy trình kiểm duyệt; có phiên bản và audit SQL.
  const mediaKind = value => ['narrations', 'subtitles'].includes(value);
  const mediaId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const mediaLanguage = value => VALID_LANG.test(value || '');

  app.get('/api/admin/media/:kind', adminOnly, wrap(async (req, res) => {
    if (!mediaKind(req.params.kind)) return res.status(400).json({code:'invalid'});
    res.json({ items: await repo.mediaIndex(req.params.kind) });
  }));
  app.get('/api/admin/media/:kind/:id/:language/history', adminOnly, wrap(async (req, res) => {
    if (!mediaKind(req.params.kind) || !mediaId(req.params.id) || !mediaLanguage(req.params.language))
      return res.status(400).json({code:'invalid'});
    res.json({history: await repo.mediaHistory(req.params.kind, Number(req.params.id), req.params.language)});
  }));
  app.get('/api/admin/media/:kind/:id/:language', adminOnly, wrap(async (req, res) => {
    if (!mediaKind(req.params.kind) || !mediaId(req.params.id) || !mediaLanguage(req.params.language))
      return res.status(400).json({code:'invalid'});
    const item = await repo.mediaDetail(req.params.kind, Number(req.params.id), req.params.language);
    if (!item) return res.status(404).json({code:'not_found'});
    res.json({ item });
  }));
  app.put('/api/admin/media/:kind/:id/:language', adminOnly, wrap(async (req, res) => {
    const {kind,id,language} = req.params;
    const {lines,status,version} = req.body || {};
    if (!mediaKind(kind) || !mediaId(id) || !mediaLanguage(language) ||
        !MEDIA_STATES.includes(status) ||
        !Number.isSafeInteger(version) || version < 0 || !validMediaLines(lines))
      return res.status(400).json({code:'invalid'});
    const video = await repo.getVideo(Number(id));
    if (!video) return res.status(404).json({code:'not_found'});
    try {
      const result = await repo.saveManagedMedia({kind,videoId:Number(id),language,
        lines,status,version,editor:req.currentUser.email});
      res.json({ok:true, ...result});
    } catch (e) {
      if (e.code === 'conflict' || e.code === 'review_required' || e.code === 'reopen_required')
        return res.status(409).json({code:e.code});
      throw e;
    }
  }));
  app.get('/api/admin/languages', adminOnly, wrap(async (req, res) => res.json({ languages: (await repo.languages()).map(x => ({ ...x, processingSupported: PROCESSING_LANGUAGES.has(x.code) })) })));
  app.post('/api/admin/languages', adminOnly, wrap(async (req, res) => {
    const code = String(req.body?.code || '').toLowerCase().trim();
    const name = String(req.body?.name || '').trim();
    const englishName = String(req.body?.englishName || '').trim();
    if (!VALID_LANG.test(code) || !name || name.length > 80 || !englishName || englishName.length > 80)
      return res.status(400).json({ code: 'invalid' });
    if (!await repo.createLanguage({ code, name, englishName, status: PROCESSING_LANGUAGES.has(code) ? 'active' : 'inactive' })) return res.status(409).json({ code: 'exists' });
    res.status(201).json({ ok: true });
  }));
  app.patch('/api/admin/languages/:code', adminOnly, wrap(async (req, res) => {
    const code = String(req.params.code || '');
    const name = String(req.body?.name || '').trim();
    const englishName = String(req.body?.englishName || '').trim();
    const status = req.body?.status;
    if (!VALID_LANG.test(code) || !name || name.length > 80 || !englishName || englishName.length > 80 || !['active','inactive'].includes(status))
      return res.status(400).json({ code: 'invalid' });
    if (status === 'active' && !PROCESSING_LANGUAGES.has(code)) return res.status(409).json({code:'language_not_supported'});
    if (!await repo.updateLanguage(code, { name, englishName, status })) return res.status(404).json({ code: 'not_found' });
    res.json({ ok: true });
  }));
  app.patch('/api/admin/videos/:id/results/:kind/:language', adminOnly, wrap(async (req, res) => {
    const video = await videoFor(req, res, true);
    if (!video) return;
    const { kind, language } = req.params;
    if (!['narrations','subtitles'].includes(kind) || !VALID_LANG.test(language))
      return res.status(400).json({ code: 'invalid' });
    const lines = req.body?.lines;
    if (!Array.isArray(lines) || !lines.length || lines.length > 2000 ||
        lines.some(x => !x || typeof x.text !== 'string' || x.text.length > 4000 ||
          (x.start != null && (!Number.isFinite(x.start) || x.start < 0)) ||
          (x.end != null && (!Number.isFinite(x.end) || x.end < 0))))
      return res.status(400).json({ code: 'invalid' });
    // API cũ chuyển về cơ chế quản trị có lịch sử, không cho cập nhật âm thầm ngoài kiểm duyệt.
    return res.status(410).json({ code: 'use_media_management' });
  }));
  app.get('/api/admin/videos/:id/translations', adminOnly, wrap(async (req, res) => {
    const video = await videoFor(req, res, true);
    if (!video) return;
    res.json(await repo.videoResults(video.id));
  }));
  app.patch('/api/admin/videos/:id', adminOnly, wrap(async (req, res) => {
    const video = await videoFor(req, res, true);
    if (!video) return;
    const status = String(req.body?.status || '');
    if (!STATUS.includes(status)) return res.status(400).json({ code: 'invalid' });
    await repo.setVideoStatus(video.id, status, req.currentUser.email);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/videos/:id', adminOnly, wrap(async (req, res) => {
    const video = await videoFor(req, res, true);
    if (!video) return;
    await repo.deleteVideo(video.id);
    if (video.videoUrl && video.videoUrl.startsWith(UPLOAD_DIR + sep)) await unlink(video.videoUrl).catch(() => {});
    res.json({ ok: true });
  }));
  app.get('/api/admin/feedback', adminOnly, wrap(async (req, res) => {
    res.json({ feedback: await repo.allFeedback() });
  }));
  app.get('/api/admin/feedback/:id/history', adminOnly, wrap(async (req, res) => {
    if (!/^[fc]-[1-9]\d*$/.test(req.params.id)) return res.status(400).json({code:'invalid'});
    res.json({history: await repo.feedbackHistory(req.params.id)});
  }));
  app.patch('/api/admin/feedback/:id', adminOnly, wrap(async (req, res) => {
    const id = req.params.id;
    const status = String(req.body?.status || '');
    const reply = String(req.body?.reply || '').trim();
    const priority = String(req.body?.priority || 'normal');
    if (!/^[fc]-[1-9]\d*$/.test(id) || !validateFeedback({status, priority, reply}))
      return res.status(400).json({ code: 'invalid' });
    if (!await repo.handleFeedback(id, {status,reply:reply||null,priority,editor:req.currentUser.email}))
      return res.status(404).json({ code: 'not_found' });
    res.json({ ok: true });
  }));
  app.get('/api/admin/orders', adminOnly, wrap(async (req, res) => {
    res.json({ orders: await repo.adminOrders() });
  }));
  app.get('/api/admin/audit', adminOnly, wrap(async (req, res) => {
    const count = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    res.json({ activities: await repo.adminAudit(count) });
  }));

  app.patch('/api/admin/users', adminOnly, wrap(async (req, res) => {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const status = req.body && req.body.status;
    if (!['active', 'locked'].includes(status)) return res.status(400).json({ code: 'invalid' });
    if (!(await repo.setUserStatus(email, status, req.currentUser.email))) return res.status(404).json({ code: 'not_found' });
    res.json({ ok: true });
  }));

  app.delete('/api/admin/users', adminOnly, wrap(async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    try {
      if (!(await repo.deleteUser(email))) return res.status(404).json({ code: 'not_found' });
      res.json({ ok: true });
    } catch (err) {
      if (err.number === 547) return res.status(409).json({ code: 'has_data' });
      throw err;
    }
  }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ code: 'invalid_json' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ code: 'too_large' });
    console.error(err);
    res.status(500).json({ code: 'server' });
  });
  return app;
}
