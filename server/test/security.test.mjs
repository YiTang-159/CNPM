import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, isLegacyHash } from '../src/auth.js';
import { createApp } from '../src/app.js';

const LEGACY = 'sha256$00112233445566778899AABBCCDDEEFF$932491FFDA2442710160111D14336F73872960894BD05D50EA6EF6C8CB0A28B9';

async function start(users) {
  const repo = {
    findUser: async (e) => users.find((u) => u.email === e) || null,
    updatePasswordHash: async (email, next, old) => {
      const u = users.find((x) => x.email === email);
      if (!u || u.hash !== old) return false;
      u.hash = next; return true;
    },
  };
  const server = createApp(repo, { secret: 'test' }).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (path, body, raw) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ?? JSON.stringify(body) });
  return { post, close: () => new Promise((r) => server.close(r)) };
}

test('mật khẩu hỏng hoặc sai định dạng bị từ chối, không ném lỗi', () => {
  for (const v of ['', 'xx:yy', '0:123', 'abc', hashPassword('secret') + ':junk', null, undefined]) {
    assert.equal(verifyPassword('secret', v), false);
  }
  assert.equal(verifyPassword('secret', hashPassword('secret')), true);
});

test('băm SHA-256 cũ (UTF-16LE) được nhận dạng và kiểm tra đúng', () => {
  assert.equal(isLegacyHash(LEGACY), true);
  assert.equal(verifyPassword('mậtKhẩu123!', LEGACY), true);
  assert.equal(verifyPassword('sai', LEGACY), false);
});

test('đăng nhập bằng băm cũ nâng cấp lên scrypt', async () => {
  const users = [{ id: 1, email: 'a@x.vn', name: 'A', role: 'user', status: 'active', hash: LEGACY }];
  const s = await start(users);
  try {
    assert.equal((await s.post('/api/auth/login', { email: 'a@x.vn', password: 'mậtKhẩu123!' })).status, 200);
    assert.equal(isLegacyHash(users[0].hash), false);
    assert.equal(verifyPassword('mậtKhẩu123!', users[0].hash), true);
    assert.equal((await s.post('/api/auth/login', { email: 'a@x.vn', password: 'mậtKhẩu123!' })).status, 200);
  } finally { await s.close(); }
});

test('JSON hỏng trả 400 invalid_json; thân quá lớn trả 413 too_large', async () => {
  const s = await start([]);
  try {
    const bad = await s.post('/api/auth/login', null, '{');
    assert.equal(bad.status, 400); assert.equal((await bad.json()).code, 'invalid_json');
    const big = await s.post('/api/auth/login', { email: 'a'.repeat(1024 * 1024 + 1) });
    assert.equal(big.status, 413); assert.equal((await big.json()).code, 'too_large');
  } finally { await s.close(); }
});

test('đăng nhập sai 10 lần bị chặn bằng 429', async () => {
  const s = await start([]);
  try {
    for (let i = 0; i < 10; i++) assert.equal((await s.post('/api/auth/login', { email: 'x@x.vn', password: 'wrong' })).status, 401);
    assert.equal((await s.post('/api/auth/login', { email: 'x@x.vn', password: 'wrong' })).status, 429);
  } finally { await s.close(); }
});
