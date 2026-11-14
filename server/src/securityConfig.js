/** Startup checks for Docker/production. No secret is logged. */
import { createPayosGateway } from './payos.js';

export function isConfiguredAdminPassword(password) {
  return typeof password === 'string' && password.length >= 12 &&
    !/^(?:CHANGE_TO_|GENERATE_USING_|REPLACE_WITH_)/.test(password);
}

const UNSAFE_DB_PASSWORDS = new Set([
  'Dubchef@12345',
  'CHANGE_TO_A_STRONG_UNIQUE_PASSWORD',
  'GENERATE_USING_NPM_RUN_SETUP_LOCAL',
]);

export function parseAllowedOrigins(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Thiếu CORS_ORIGIN');
  const origins = value.split(',').map(s => s.trim());
  if (origins.length > 30 || origins.some(s => !s || s === '*' || s === 'null'))
    throw new Error('CORS_ORIGIN phải là danh sách URL cụ thể, không dùng dấu *');
  for (const origin of origins) {
    let url;
    try { url = new URL(origin); } catch { throw new Error('CORS_ORIGIN chứa URL không hợp lệ'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password)
      throw new Error('CORS_ORIGIN phải chỉ gồm origin http(s), không có path/credentials');
  }
  return [...new Set(origins)];
}

export function validateServerEnvironment(env = process.env) {
  const paymentMode = env.PAYMENT_MODE || 'disabled';
  if (!['disabled', 'demo', 'payos'].includes(paymentMode)) throw new Error('PAYMENT_MODE không hợp lệ');
  if (paymentMode === 'payos') createPayosGateway(env);
  const loopbackDocker = env.LOCAL_DOCKER_INSTALL === 'true' &&
    ['127.0.0.1','::1'].includes(env.DB_BIND_ADDRESS) &&
    ['127.0.0.1','::1'].includes(env.API_BIND_ADDRESS);
  if (paymentMode === 'demo' && env.NODE_ENV === 'production' && !loopbackDocker)
    throw new Error('PAYMENT_MODE=demo chỉ dùng Docker local bind loopback, không nhận thanh toán thật');
  if (env.ADMIN_PASSWORD && !isConfiguredAdminPassword(env.ADMIN_PASSWORD))
    throw new Error('ADMIN_PASSWORD phải là khóa duy nhất >= 12 ký tự, không dùng placeholder');
  const dbPassword = String(env.DB_PASSWORD || '');
  if (!dbPassword) throw new Error('Thiếu DB_PASSWORD. Chạy npm run setup:local và giữ .env riêng.');
  // Existing installations MUST rotate SA password first; changing .env alone does not rotate SQL credentials.
  if (env.NODE_ENV === 'production') {
    // ONLY the existing local Docker installation may keep its original SA password.
    // An internet-facing deployment must rotate it separately (SQL + .env together).
    const localDockerOnly = loopbackDocker;
    if ((dbPassword.length < 12 || UNSAFE_DB_PASSWORDS.has(dbPassword)) && !localDockerOnly)
      throw new Error('DB_PASSWORD là mật khẩu yếu/mẫu; cần đổi mật khẩu SQL Server và cập nhật .env.');
    if (typeof env.TOKEN_SECRET !== 'string' || env.TOKEN_SECRET.length < 32 ||
        /^CHANGE_TO_|^GENERATE_USING_/.test(env.TOKEN_SECRET))
      throw new Error('Thiếu TOKEN_SECRET cố định, ngẫu nhiên, tối thiểu 32 ký tự.');
    parseAllowedOrigins(env.CORS_ORIGIN);
  } else if (env.CORS_ORIGIN) {
    parseAllowedOrigins(env.CORS_ORIGIN);
  }
}
