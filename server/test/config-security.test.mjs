import test from 'node:test';
import assert from 'node:assert/strict';
import { validateServerEnvironment, parseAllowedOrigins } from '../src/securityConfig.js';
import { createApp } from '../src/app.js';

const strong = { NODE_ENV: 'production', DB_PASSWORD: 'VeryStrong!RandomDbPassword2026',
  TOKEN_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890!ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  CORS_ORIGIN: 'http://localhost:5173,https://example.org' };

test('production requires strong separate SQL and token secrets, and explicit CORS origins', () => {
  assert.doesNotThrow(() => validateServerEnvironment(strong));
  for (const missing of ['DB_PASSWORD', 'TOKEN_SECRET', 'CORS_ORIGIN']) {
    const bad = { ...strong }; delete bad[missing];
    assert.throws(() => validateServerEnvironment(bad));
  }
  assert.throws(() => validateServerEnvironment({ ...strong, DB_PASSWORD: 'Dubchef@12345' }));
  assert.throws(() => validateServerEnvironment({ ...strong, TOKEN_SECRET: 'dev-secret' }));
  assert.throws(() => validateServerEnvironment({ ...strong, CORS_ORIGIN: '*' }));
});

test('CORS exact allowlist rejects wildcard, embedded credentials, paths and non-HTTP schemes', () => {
  assert.deepEqual(parseAllowedOrigins('https://example.org,http://localhost:5173,https://example.org'),
    ['https://example.org', 'http://localhost:5173']);
  for (const bad of ['*', 'null', 'https://example.org/path', 'https://name:secret@example.org',
    'file:///local', 'javascript:alert(1)', 'https://example.org,', ''])
    assert.throws(() => parseAllowedOrigins(bad));
});

async function serve() {
  const app = createApp({ ping: async () => {} }, { corsOrigin: 'https://allowed.example', secret: 'test' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise(resolve => server.close(resolve)) };
}

test('API sends security headers and only CORS-whitelists configured origin', async () => {
  const app = await serve();
  try {
    const allowed = await fetch(app.base + '/api/health', { headers: { Origin: 'https://allowed.example' } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://allowed.example');
    assert.equal(allowed.headers.get('cache-control'), 'no-store');
    assert.equal(allowed.headers.get('x-frame-options'), 'DENY');
    assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff');
    const denied = await fetch(app.base + '/api/health', { headers: { Origin: 'https://other.example' } });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    const missing = await fetch(app.base + '/api/does-not-exist');
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { code: 'not_found' });
  } finally { await app.close(); }
});

test('public registration is capped by IP and reports retry-after', async () => {
  const app = await serve();
  try {
    const requests = [];
    for (let n = 0; n < 21; n++) {
      requests.push(fetch(app.base + '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email: '', password: '' }),
      }));
    }
    const results = await Promise.all(requests);
    assert.equal(results.filter(r => r.status === 400).length, 20);
    const blocked = results.filter(r => r.status === 429);
    assert.equal(blocked.length, 1);
    assert.ok(Number(blocked[0].headers.get('retry-after')) > 0);
  } finally { await app.close(); }
});
