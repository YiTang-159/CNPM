// Băm mật khẩu và token đăng nhập, chỉ dùng node:crypto (không thêm thư viện).
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16);
  return salt.toString('hex') + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored || '').split(':');
  if (!saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, 'hex');
  const got = scryptSync(password, Buffer.from(saltHex, 'hex'), want.length);
  return want.length === got.length && timingSafeEqual(want, got);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (body, secret) => createHmac('sha256', secret).update(body).digest('base64url');

/** Token ký HMAC: `payload.chữ_ký`. Hết hạn sau `days` ngày. */
export function makeToken(user, secret, now = Date.now(), days = 7) {
  const body = b64(JSON.stringify({ email: user.email, role: user.role, exp: now + days * 86400000 }));
  return body + '.' + sign(body, secret);
}

/** Trả { email, role } nếu token đúng và còn hạn, ngược lại null. */
export function readToken(token, secret, now = Date.now()) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > now ? { email: p.email, role: p.role } : null;
  } catch (e) {
    return null;
  }
}
