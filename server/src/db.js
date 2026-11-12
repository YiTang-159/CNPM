// Kết nối SQL Server, tạo CSDL và bảng khi khởi động, và các câu lệnh cho đơn hàng / thanh toán.
import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVE_MINUTES, dayKey } from './stats.js';
import { hashPassword } from './auth.js';
import { attachWorkflows } from './workflows.js';
import { attachAdminOperations } from './adminOperations.js';

const DB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db');

function config(database) {
  return {
    server: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Dubchef@12345',
    database,
    options: { encrypt: true, trustServerCertificate: true }, // chứng chỉ tự ký của container
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** SQL Server cần vài chục giây để khởi động, nên thử lại cho đến khi kết nối được. */
async function connect(database, tries = 60) {
  for (let n = 1; ; n++) {
    try {
      return await new sql.ConnectionPool(config(database)).connect();
    } catch (e) {
      if (n >= tries) throw e;
      console.log(`Chờ SQL Server (${n}/${tries}): ${e.message}`);
      await sleep(2000);
    }
  }
}

/** Chạy một file .sql, tách các lô bằng dòng GO. */
async function runScript(pool, file) {
  const text = (await readFile(join(DB_DIR, file), 'utf8')).replace(/^\s*USE\s+\[?DubchefDB\]?\s*;?\s*$/gim, '');
  for (const batch of text.split(/^\s*GO\s*$/im)) {
    if (batch.trim()) await pool.request().batch(batch);
  }
}

const mapOrder = (r) => ({
  id: r.MaDonHang,
  userId: r.MaNguoiDung ?? null,
  ownershipVerified: r.MaNguoiDung != null,
  name: r.TenKhachHang,
  email: r.EmailKhachHang,
  uploads: r.SoVideoDang,
  outs: r.SoVideoDich,
  currency: r.LoaiTien.trim(),
  amountMinor: Number(r.SoTien), // BIGINT trả về dạng chuỗi
  status: r.TrangThai,
  createdAt: new Date(r.NgayTao).toISOString(),
  ref: r.MaThamChieu || null,
});

const mapUser = (r) => ({
  id: r.MaNguoiDung,
  name: r.HoTen,
  email: r.Email,
  role: r.VaiTro,
  status: r.TrangThai,
  at: new Date(r.NgayTao).toISOString(),
  hash: r.MatKhauBam,
});

/**
 * Gộp số liệu theo ngày cho một bảng có cột MaKhach và một cột thời gian (`table`, `col` là hằng số trong mã, không lấy từ người dùng).
 * Dùng chung cho lượt truy cập (LuotTruyCap) và lượt quét QR (LuotQuetQR).
 */
async function aggregate(pool, table, col, span, tz, now = Date.now()) {
  const DAY = 86400000;
  const key = (i) => dayKey(now - i * DAY, tz);
  const from = new Date(now - (span * 2 + 1) * DAY);
  const k = `CONVERT(char(10), DATEADD(HOUR, @tz, ${col}), 23)`;
  const days = await pool.request()
    .input('tz', sql.Int, tz).input('from', sql.DateTime2, from)
    .query(`SELECT ${k} AS d, COUNT(DISTINCT MaKhach) AS visitors, COUNT(*) AS views
            FROM ${table} WHERE ${col} >= @from GROUP BY ${k}`);
  const win = await pool.request()
    .input('tz', sql.Int, tz).input('from', sql.DateTime2, from)
    .input('c0', sql.Char(10), key(span - 1)).input('c1', sql.Char(10), key(0))
    .input('p0', sql.Char(10), key(span * 2 - 1)).input('p1', sql.Char(10), key(span))
    .query(`SELECT
              COUNT(DISTINCT CASE WHEN d BETWEEN @c0 AND @c1 THEN MaKhach END) AS cv,
              SUM(CASE WHEN d BETWEEN @c0 AND @c1 THEN 1 ELSE 0 END) AS cw,
              COUNT(DISTINCT CASE WHEN d BETWEEN @p0 AND @p1 THEN MaKhach END) AS pv,
              SUM(CASE WHEN d BETWEEN @p0 AND @p1 THEN 1 ELSE 0 END) AS pw
            FROM (SELECT MaKhach, ${k} AS d FROM ${table} WHERE ${col} >= @from) x`);
  const tot = await pool.request().query(`SELECT COUNT(DISTINCT MaKhach) AS visitors, COUNT(*) AS views FROM ${table}`);
  const act = await pool.request().input('m', sql.Int, ACTIVE_MINUTES)
    .query(`SELECT COUNT(DISTINCT MaKhach) AS n FROM ${table} WHERE ${col} >= DATEADD(MINUTE, -@m, SYSUTCDATETIME())`);
  const w = win.recordset[0];
  return {
    days: days.recordset.map((r) => ({ date: r.d, visitors: r.visitors, views: r.views })),
    period: { visitors: w.cv || 0, views: w.cw || 0 },
    prev: { visitors: w.pv || 0, views: w.pw || 0 },
    totals: { visitors: tot.recordset[0].visitors, views: tot.recordset[0].views },
    activeNow: act.recordset[0].n,
  };
}

/** Tạo CSDL + bảng (nếu chưa có) rồi trả về các hàm thao tác dữ liệu. */
export async function openRepo() {
  const database = process.env.DB_NAME || 'DubchefDB';
  if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(database)) throw new Error('DB_NAME không hợp lệ');
  if (process.env.DB_SKIP_CREATE !== 'true') {
    const master = await connect('master');
    try { await master.request().query(`IF DB_ID(N'${database}') IS NULL CREATE DATABASE [${database}]`); }
    finally { await master.close(); }
  }

  const pool = await connect(process.env.DB_NAME || 'DubchefDB');
  await runScript(pool, '00-PREFLIGHT.sql');
  await runScript(pool, '02-schema.sql');
  await runScript(pool, '04-workflows.sql');
  await runScript(pool, '07-quan-tri-nghiep-vu.sql');
  await runScript(pool, '10-an-toan-don-hang-va-nhat-ky.sql');
  console.log('SQL Server sẵn sàng.');

  const repo = {
    close: () => pool.close(),
    async ping() {
      await pool.request().query('SELECT 1 AS ok');
    },

    async createOrder(o) {
      // Không để client tự chỉ định chủ đơn hàng. Kiểm tra MaNguoiDung/email/trạng thái
      // ngay trong cùng câu INSERT: không có tài khoản hợp lệ thì không tạo đơn.
      const r = await pool.request()
        .input('uid', sql.Int, o.userId)
        .input('name', sql.NVarChar(100), o.name)
        .input('email', sql.NVarChar(254), o.email)
        .input('up', sql.Int, o.uploads)
        .input('out', sql.Int, o.outs)
        .input('cur', sql.Char(3), o.currency)
        .input('amt', sql.BigInt, o.amountMinor)
        .query(`INSERT INTO dbo.DonHang (MaNguoiDung, TenKhachHang, EmailKhachHang,
                  SoVideoDang, SoVideoDich, LoaiTien, SoTien)
                OUTPUT inserted.*
                SELECT u.MaNguoiDung, @name, @email, @up, @out, @cur, @amt
                FROM dbo.NguoiDung u
                WHERE u.MaNguoiDung=@uid AND u.Email=@email AND u.TrangThai='active'`);
      return r.recordset[0] ? mapOrder(r.recordset[0]) : null;
    },

    /** Đánh dấu đơn đã trả và ghi giao dịch trong cùng một transaction. Trả null nếu đơn không tồn tại hoặc đã trả. */
    async payOrder(id, { method, ref }) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const upd = await new sql.Request(tx)
          .input('id', sql.Int, id)
          .query(`UPDATE dbo.DonHang SET TrangThai = 'paid' OUTPUT inserted.* WHERE MaDonHang = @id AND TrangThai = 'pending'`);
        if (!upd.recordset.length) {
          await tx.rollback();
          return null;
        }
        const order = upd.recordset[0];
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .input('method', sql.VarChar(10), method)
          .input('amt', sql.BigInt, order.SoTien)
          .input('cur', sql.Char(3), order.LoaiTien)
          .input('ref', sql.VarChar(40), ref)
          .query(`INSERT INTO dbo.GiaoDich (MaDonHang, PhuongThuc, SoTien, LoaiTien, TrangThai, MaThamChieu)
                  VALUES (@id, @method, @amt, @cur, 'success', @ref)`);
        await tx.commit();
        return { order: mapOrder({ ...order, MaThamChieu: ref }), payment: { method, ref } };
      } catch (e) {
        await tx.rollback().catch(() => {});
        throw e;
      }
    },

    // Chỉ chủ sở hữu xác thực bằng ID mới được thanh toán. Đơn cũ chưa liên kết
    // được giữ trong báo cáo Admin, không cho user nhận bằng cách đoán email.
    async orderOwner(id, userId) {
      if (!Number.isSafeInteger(userId) || userId < 1) return false;
      const r = await pool.request().input('id', sql.Int, id).input('uid', sql.Int, userId)
        .query('SELECT TOP(1) MaDonHang FROM dbo.DonHang WHERE MaDonHang=@id AND MaNguoiDung=@uid');
      return r.recordset.length > 0;
    },

    async listOrders(email, limit = 20, userId) {
      const r = await pool.request()
        .input('email', sql.NVarChar(254), email)
        .input('uid', sql.Int, userId)
        .input('n', sql.Int, limit)
        .query(`SELECT TOP (@n) o.*, p.MaThamChieu
                FROM dbo.DonHang o
                OUTER APPLY (SELECT TOP (1) MaThamChieu FROM dbo.GiaoDich p
                  WHERE p.MaDonHang=o.MaDonHang AND p.TrangThai='success'
                  ORDER BY p.MaGiaoDich DESC) p
                WHERE o.MaNguoiDung=@uid
                ORDER BY o.NgayTao DESC, o.MaDonHang DESC`);
      return r.recordset.map(mapOrder);
    },

    // ---- Tài khoản ----
    async findUser(email) {
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .query('SELECT * FROM dbo.NguoiDung WHERE Email = @email');
      return r.recordset[0] ? mapUser(r.recordset[0]) : null;
    },

    async recordLogin(userId, ipAddress) {
      await pool.request().input('id', sql.Int, userId)
        .input('ip', sql.NVarChar(64), String(ipAddress || '').slice(0,64))
        .query('INSERT dbo.LichSuDangNhap(MaNguoiDung,DiaChiIP) VALUES (@id,@ip)');
    },

    /** Trả null nếu email đã có. */
    async createUser({ name, email, passwordHash, role = 'user' }) {
      try {
        const r = await pool.request()
          .input('name', sql.NVarChar(100), name)
          .input('email', sql.NVarChar(254), email)
          .input('hash', sql.VarChar(200), passwordHash)
          .input('role', sql.VarChar(10), role)
          .query(`INSERT INTO dbo.NguoiDung (HoTen, Email, MatKhauBam, VaiTro) OUTPUT inserted.*
                  VALUES (@name, @email, @hash, @role)`);
        return mapUser(r.recordset[0]);
      } catch (e) {
        if (e.number === 2627 || e.number === 2601) return null; // trùng UNIQUE
        throw e;
      }
    },

    async listUsers() {
      const r = await pool.request().query('SELECT * FROM dbo.NguoiDung ORDER BY NgayTao DESC, MaNguoiDung DESC');
      return r.recordset.map(mapUser);
    },

    async adminAudit(limit = 50) {
      const r = await pool.request().input('n', sql.Int, limit)
        .query(`SELECT TOP (@n) MaNhatKy AS id, Loai AS type, DoiTuong AS target,
          NguoiThucHien AS actor, GiaTriCu AS previous, GiaTriMoi AS current,
          ThoiGian AS at FROM dbo.NhatKyQuanTri ORDER BY MaNhatKy DESC`);
      return r.recordset;
    },

    // Quản lý danh sách video
    async listVideos() {
      const r = await pool.request().query(`
        SELECT
          v.MaVideo AS id,
          v.MaNguoiDung AS userId,
          v.TenTep AS fileName,
          v.DungLuong AS size,
          v.TieuDe AS title,
          v.TrangThai AS status,
          v.NgonNguGoc AS originalLanguage,
          v.DuongDan AS videoUrl,
          v.NgayTaiLen AS createdAt,
          u.HoTen AS userName,
          u.Email AS userEmail
        FROM dbo.Video v
        INNER JOIN dbo.NguoiDung u
          ON v.MaNguoiDung = u.MaNguoiDung
        ORDER BY v.NgayTaiLen DESC
      `);

      return r.recordset;
    },

    /** Trang tổng hợp một chỗ: chỉ đọc dữ liệu thật, không có hàng mẫu. */
    async dashboardSummary() {
      const [statistics, users, videos, feedback, orders, currencies] = await Promise.all([
        this.adminStatistics(),
        pool.request().query(`SELECT TOP (6) MaNguoiDung AS id,HoTen AS name,Email AS email,
          VaiTro AS role,TrangThai AS status,NgayTao AS createdAt
          FROM dbo.NguoiDung ORDER BY NgayTao DESC,MaNguoiDung DESC`),
        pool.request().query(`SELECT TOP (6) v.MaVideo AS id,v.TieuDe AS title,
          v.TrangThai AS status,v.NgayTaiLen AS createdAt,n.Email AS email,
          (SELECT COUNT(*) FROM dbo.ThuyetMinh tm WHERE tm.MaVideo=v.MaVideo) AS narrations,
          (SELECT COUNT(*) FROM dbo.PhuDe pd WHERE pd.MaVideo=v.MaVideo) AS subtitles
          FROM dbo.Video v JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung
          ORDER BY v.NgayTaiLen DESC,v.MaVideo DESC`),
        pool.request().query(`SELECT TOP (6) p.MaPhanHoi AS id,u.Email AS email,
          p.NoiDung AS message,p.TrangThai AS status,p.NgayTao AS createdAt
          FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung
          ORDER BY p.NgayTao DESC,p.MaPhanHoi DESC`),
        pool.request().query(`SELECT TOP (6) MaDonHang AS id,EmailKhachHang AS email,
          SoTien AS amount,LoaiTien AS currency,TrangThai AS status,NgayTao AS createdAt
          FROM dbo.DonHang ORDER BY NgayTao DESC,MaDonHang DESC`),
        pool.request().query(`SELECT LoaiTien AS currency, COUNT(*) AS orders,
          SUM(SoTien) AS amount FROM dbo.DonHang WHERE TrangThai='paid'
          GROUP BY LoaiTien ORDER BY LoaiTien`),
      ]);
      const counts = await pool.request().query(`SELECT
        (SELECT COUNT(*) FROM dbo.DonHang) AS totalOrders,
        (SELECT COUNT(*) FROM dbo.DonHang WHERE TrangThai='pending') AS pendingOrders,
        (SELECT COUNT(*) FROM dbo.PhanHoi WHERE TrangThai<>'resolved')
          + (SELECT COUNT(*) FROM dbo.LienHe WHERE TrangThai<>'resolved') AS openFeedback,
        (SELECT COUNT(*) FROM dbo.Video WHERE TrangThai='processing') AS processingVideos,
        (SELECT COUNT(*) FROM dbo.ThuyetMinh WHERE TrangThaiDuyet='reviewing')
          + (SELECT COUNT(*) FROM dbo.PhuDe WHERE TrangThaiDuyet='reviewing') AS pendingMediaReview,
        (SELECT COUNT(*) FROM dbo.PhanHoi WHERE UuTien='high' AND TrangThai<>'resolved')
          + (SELECT COUNT(*) FROM dbo.LienHe WHERE UuTien='high' AND TrangThai<>'resolved') AS urgentFeedback`);
      return {
        statistics: {...statistics,...counts.recordset[0]},
        latest: {users:users.recordset,videos:videos.recordset,
          feedback:feedback.recordset,orders:orders.recordset},
        paidOrdersByCurrency:currencies.recordset,
        generatedAt:new Date().toISOString(),
        paymentNote:'Trạng thái paid trong dự án hiện là thanh toán mô phỏng, không xác minh tiền thật.'
      };
    },

    // Thống kê tổng quan Admin từ SQL Server
    async adminStatistics() {
      const result = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.NguoiDung)
            AS totalUsers,

          (SELECT COUNT(*) FROM dbo.Video)
            AS totalVideos,

          (SELECT COUNT(*) FROM dbo.NgonNgu) AS totalLanguages,
          (SELECT COUNT(*) FROM dbo.ThuyetMinh) AS totalNarrations,
          (SELECT COUNT(*) FROM dbo.PhuDe) AS totalSubtitles,
          (SELECT COUNT(*) FROM dbo.PhanHoi) + (SELECT COUNT(*) FROM dbo.LienHe) AS totalFeedback,

          (SELECT COUNT(*) FROM dbo.LuotQuetQR)
            AS totalQrScans,

          (SELECT COUNT(*) FROM dbo.LuotTruyCap)
            AS totalVisits
      `);

      return result.recordset[0];
    },

    /** Chỉ đổi người dùng thường (không đụng tới quản trị viên). Trả true nếu có dòng được đổi. */
    async setUserStatus(email, status, actor = 'system') {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const r = await new sql.Request(tx).input('email', sql.NVarChar(254), email)
          .input('st', sql.VarChar(10), status)
          .query(`UPDATE dbo.NguoiDung SET TrangThai=@st
            OUTPUT deleted.TrangThai AS beforeStatus, inserted.TrangThai AS afterStatus
            WHERE Email=@email AND VaiTro='user'`);
        if (!r.recordset.length) { await tx.rollback(); return false; }
        if (r.recordset[0].beforeStatus === status) { await tx.rollback(); return true; }
        await new sql.Request(tx).input('actor', sql.NVarChar(254), actor)
          .input('target', sql.NVarChar(254), email)
          .input('before', sql.NVarChar(40), r.recordset[0].beforeStatus)
          .input('after', sql.NVarChar(40), status)
          .query(`INSERT dbo.NhatKyQuanTri(Loai, DoiTuong, NguoiThucHien, GiaTriCu, GiaTriMoi)
            VALUES('user_status', @target, @actor, @before, @after)`);
        await tx.commit();
        return true;
      } catch(e) { await tx.rollback().catch(()=>{}); throw e; }
    },

    async deleteUser(email) {
      const orders = await pool.request().input('email', sql.NVarChar(254), email)
        .query('SELECT TOP(1) MaDonHang FROM dbo.DonHang WHERE EmailKhachHang=@email');
      if (orders.recordset.length) throw Object.assign(new Error('has_data'), {number:547});
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .query(`DELETE FROM dbo.NguoiDung WHERE Email = @email AND VaiTro = 'user'`);
      return r.rowsAffected[0] > 0;
    },

    /** Tạo tài khoản quản trị nếu chưa có (đọc từ biến môi trường khi khởi động). */
    async ensureAdmin(email, password) {
      if (await repo.findUser(email)) return false;
      await repo.createUser({ name: 'Admin', email, passwordHash: hashPassword(password), role: 'admin' });
      return true;
    },

    async addMessage({ name, email, body }) {
      await pool.request()
        .input('name', sql.NVarChar(100), name)
        .input('email', sql.NVarChar(254), email)
        .input('body', sql.NVarChar(2000), body)
        .query('INSERT INTO dbo.LienHe (HoTen, Email, NoiDung) VALUES (@name, @email, @body)');
    },

    // ---- Lượt truy cập ----
    async addVisit({ visitorId, path, lang }) {
      await pool.request()
        .input('vid', sql.VarChar(64), visitorId)
        .input('path', sql.NVarChar(200), path)
        .input('lang', sql.VarChar(8), lang)
        .query('INSERT INTO dbo.LuotTruyCap (MaKhach, DuongDan, NgonNgu) VALUES (@vid, @path, @lang)');
    },

    /** Số liệu thô cho trang Admin: theo ngày, kỳ này / kỳ trước, tổng, đang online. Ngày tính theo múi giờ `tz`. */
    visitStats: (span, tz, now) => aggregate(pool, 'dbo.LuotTruyCap', 'NgayTruyCap', span, tz, now),

    // ---- Lượt quét mã QR của khách ----
    async addQrScan({ visitorId, lang }) {
      await pool.request()
        .input('vid', sql.VarChar(64), visitorId)
        .input('lang', sql.VarChar(8), lang)
        .query('INSERT INTO dbo.LuotQuetQR (MaKhach, NgonNgu) VALUES (@vid, @lang)');
    },

    /** Cùng dạng với visitStats: visitors = số người quét (không trùng), views = số lượt quét. */
    qrStats: (span, tz, now) => aggregate(pool, 'dbo.LuotQuetQR', 'NgayQuet', span, tz, now),
  };
  attachWorkflows(pool, repo);
  attachAdminOperations(pool, repo);
  return repo;
}
