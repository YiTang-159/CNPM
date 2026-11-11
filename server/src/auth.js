// Băm mật khẩu và token đăng nhập, chỉ dùng node:crypto (không thêm thư viện).
import { randomBytes, scryptSync, timingSafeEqual, createHmac, createHash } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16);
  return salt.toString('hex') + ':' + scryptSync(password, salt, 64).toString('hex');
}

const HEX = /^[0-9a-f]+$/i;

/** Dạng băm cũ của SQL Server: `sha256$SALT_HEX$HASH_HEX`, với HASH = SHA-256(salt + mật khẩu UTF-16LE). */
export const isLegacyHash = (stored) => /^sha256\$[0-9a-f]{2,}\$[0-9a-f]{64}$/i.test(String(stored || ''));

function verifyLegacy(password, stored) {
  const [, saltHex, hashHex] = stored.split('$');
  if (saltHex.length % 2) return false;
  const got = createHash('sha256').update(Buffer.concat([Buffer.from(saltHex, 'hex'), Buffer.from(password, 'utf16le')])).digest();
  return timingSafeEqual(got, Buffer.from(hashHex, 'hex'));
}

export function verifyPassword(password, stored) {
  stored = String(stored || '');
  if (isLegacyHash(stored)) return verifyLegacy(String(password), stored);
  const parts = stored.split(':');
  // Chỉ nhận đúng dạng `salt:hash` hợp lệ; chuỗi hỏng luôn bị từ chối, không ném lỗi.
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  if (saltHex.length !== 32 || hashHex.length !== 128 || !saltHex || !hashHex || saltHex.length % 2 || hashHex.length % 2 || !HEX.test(saltHex) || !HEX.test(hashHex)) return false;
  const want = Buffer.from(hashHex, 'hex');
  const got = scryptSync(password, Buffer.from(saltHex, 'hex'), want.length);
  return want.length === got.length && timingSafeEqual(want, got);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (body, secret) => createHmac('sha256', secret).update(body).digest('base64url');

/** Token ký HMAC: `payload.chữ_ký`. Hết hạn sau `days` ngày. */
export function makeToken(user, secret, now = Date.now(), days = 7) {
  const body = b64(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: now + days * 86400000 }));
  return body + '.' + sign(body, secret);
}

/** Trả { email, role } nếu token đúng và còn hạn, ngược lại null. */
export function readToken(token, secret, now = Date.now()) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return Number.isFinite(p.exp) && p.exp > now && typeof p.email === 'string' && ['admin', 'user'].includes(p.role)
      ? { ...(p.id == null ? {} : { id: p.id }), email: p.email, role: p.role } : null;
  } catch (e) {
    return null;
  }
}
