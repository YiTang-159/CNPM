import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { openRepo } from './db.js';

const port = Number(process.env.PORT || 3000);
const repo = await openRepo();

// Tài khoản quản trị: tạo một lần khi khởi động nếu chưa có. Đổi mật khẩu mặc định trước khi đưa lên mạng.
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dubchef.vn').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
if (await repo.ensureAdmin(adminEmail, adminPassword)) console.log('Đã tạo tài khoản quản trị ' + adminEmail);

// Không đặt TOKEN_SECRET thì mỗi lần khởi động tạo khóa mới (mọi người phải đăng nhập lại).
const secret = process.env.TOKEN_SECRET || randomBytes(32).toString('hex');
createApp(repo, {
  corsOrigin: process.env.CORS_ORIGIN || '*',
  secret,
  tz: Number(process.env.STATS_TZ_HOURS || 7),
}).listen(port, () => {
  console.log(`API chạy ở http://localhost:${port}`);
});
