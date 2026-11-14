import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { validateServerEnvironment } from './securityConfig.js';
import { openRepo } from './db.js';

const port = Number(process.env.PORT || 3000);
validateServerEnvironment();
const repo = await openRepo();

// Tài khoản quản trị: tạo một lần khi khởi động nếu chưa có. Đổi mật khẩu mặc định trước khi đưa lên mạng.
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dubchef.vn').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (adminPassword.length >= 12) {
  if (await repo.ensureAdmin(adminEmail, adminPassword)) console.log('Đã tạo tài khoản quản trị ' + adminEmail);
} else {
  console.warn('Bỏ qua tạo tài khoản quản trị: đặt ADMIN_PASSWORD (tối thiểu 12 ký tự) trong .env, hoặc chạy npm run setup:local.');
}

// Chỉ môi trường phát triển được dùng khóa phiên tạm; production đã bắt buộc khóa cố định.
const secret = process.env.TOKEN_SECRET || randomBytes(32).toString('hex');
createApp(repo, {
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
  secret,
  tz: Number(process.env.STATS_TZ_HOURS || 7),
}).listen(port, () => {
  console.log(`API chạy ở http://localhost:${port}`);
});
