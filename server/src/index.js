import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { validateServerEnvironment } from './securityConfig.js';
import { bootstrapAdmin } from './adminBootstrap.js';
import { openRepo } from './db.js';

const port = Number(process.env.PORT || 3000);
validateServerEnvironment();
const repo = await openRepo();

// Tài khoản quản trị: tạo một lần khi khởi động nếu chưa có. Đổi mật khẩu mặc định trước khi đưa lên mạng.
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dubchef.vn').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
// SQL cũ: giữ nguyên tài khoản/mật khẩu. SQL trắng: yêu cầu cấu hình rồi mới chạy.
const adminStatus = await bootstrapAdmin(repo, adminEmail, adminPassword);
if (adminStatus.created) console.log('Đã tạo tài khoản quản trị ' + adminEmail);
else console.log('Tài khoản Admin đã tồn tại trong SQL; không thay đổi mật khẩu.');

// Chỉ môi trường phát triển được dùng khóa phiên tạm; production đã bắt buộc khóa cố định.
const secret = process.env.TOKEN_SECRET || randomBytes(32).toString('hex');
createApp(repo, {
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
  secret,
  tz: Number(process.env.STATS_TZ_HOURS || 7),
  adminReady: adminStatus.ready,
}).listen(port, () => {
  console.log(`API chạy ở http://localhost:${port}`);
});
