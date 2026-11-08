// Tạo báo cáo HTML từ SQL Server:   npm run report   (ở thư mục gốc dự án)
// Kết quả: bao-cao/BaoCao-YYYY-MM-DD.html -> mở bằng trình duyệt, Ctrl+P để lưu PDF.
// Chỉ ĐỌC dữ liệu. Lần đầu tự tạo các view schema bc (db/08-bao-cao-chuyen-nghiep.sql) nếu chưa có.
import sql from 'mssql';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from './bao-cao-html.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function loadEnv() {
  try {
    for (const line of (await readFile(join(ROOT, '.env'), 'utf8')).split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* không có .env: dùng biến môi trường hiện tại */ }
}
await loadEnv();

const pool = await new sql.ConnectionPool({
  server: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'DubchefDB',
  options: { encrypt: true, trustServerCertificate: true },
}).connect().catch((e) => {
  console.error('Không kết nối được SQL Server:', e.message);
  console.error('Kiểm tra: docker compose ps, và DB_PASSWORD trong .env.');
  process.exit(1);
});

try {
  const ok = (await pool.request().query("SELECT OBJECT_ID(N'bc.BaoCaoTongHop', N'V') AS id")).recordset[0].id;
  if (!ok) {
    console.log('Chưa có view báo cáo, đang tạo từ db/08-bao-cao-chuyen-nghiep.sql ...');
    const script = (await readFile(join(ROOT, 'db', '08-bao-cao-chuyen-nghiep.sql'), 'utf8')).replace(/^﻿/, '');
    for (const batch of script.split(/^\s*GO\s*$/im)) {
      if (batch.includes('HIỂN THỊ BÁO CÁO')) break; // phần còn lại chỉ là các câu SELECT hiển thị
      const text = batch.replace(/^\s*USE\s+\w+;\s*$/im, '').trim();
      if (text && !/^\/\*[\s\S]*\*\/$/.test(text)) await pool.request().batch(text);
    }
  }
  const q = async (text) => (await pool.request().query(text)).recordset;
  const now = (await q("SELECT FORMAT(DATEADD(HOUR,7,SYSUTCDATETIME()),'dd/MM/yyyy HH:mm') AS t, DB_NAME() AS db"))[0];
  const html = renderReport({
    thoiDiem: now.t,
    csdl: now.db,
    tongHop: await q('SELECT [Nhóm],[Chỉ số],[Giá trị],[Ghi chú] FROM bc.BaoCaoTongHop ORDER BY STT'),
    toanVen: await q('SELECT * FROM bc.KiemTraToanVen'),
    nguoiDung: await q('SELECT TOP 20 * FROM bc.NguoiDungHoatDong ORDER BY [Mã] DESC'),
    video: await q('SELECT TOP 20 * FROM bc.VideoChiTiet ORDER BY [Mã video] DESC'),
    donHang: await q('SELECT TOP 20 * FROM bc.DonHangChiTiet ORDER BY [Mã đơn] DESC'),
    doanhThu: await q('SELECT * FROM bc.DoanhThuNgay ORDER BY [Ngày] DESC, [Tiền tệ]'),
    qr: (await q('SELECT TOP 14 * FROM bc.QuetQRNgay ORDER BY [Ngày] DESC')).reverse(),
    phanHoi: await q('SELECT * FROM bc.PhanHoiChuaXuLy ORDER BY [Số giờ chờ] DESC'),
  });
  await mkdir(join(ROOT, 'bao-cao'), { recursive: true });
  const file = join(ROOT, 'bao-cao', `BaoCao-${new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)}.html`);
  await writeFile(file, html, 'utf8');
  console.log('Đã tạo báo cáo:', file);
} finally {
  await pool.close();
}
