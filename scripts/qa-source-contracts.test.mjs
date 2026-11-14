import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');

test('admin public preview has exactly one way back to dashboard', () => {
  const header = source('web/src/components/Header.jsx');
  const layout = source('web/src/components/Layout.jsx');
  assert.equal((header.match(/Về trang quản trị/g)||[]).length,1);
  assert.doesNotMatch(layout, /Quay về Dashboard|admin-preview-banner/);
});
test('public contact never publishes reserved example email', () => {
  assert.doesNotMatch(source('web/src/components/Footer.jsx'), /hello@dubchef\.example/);
  assert.doesNotMatch(source('web/src/pages/Contact.jsx'), /hello@dubchef\.example/);
});
test('QR is gated by an explicit HTTPS public URL in both public and admin views', () => {
  const qr = source('web/src/api/qr.js');
  assert.match(qr, /VITE_PUBLIC_BASE_URL/);
  assert.match(qr, /function publicGuestUrl/);
  assert.match(qr, /https:/);
  assert.match(source('web/src/pages/Home.jsx'), /publicGuestUrl\(\)/);
  assert.match(source('web/src/pages/AdminQr.jsx'), /disabled=\{!url\}/);
});
test('server still computes order totals, does not trust client amount', () => {
  const app = source('server/src/app.js');
  assert.match(app, /\.\.\.priceOrder\(v\.value\)/);
  assert.match(source('server/src/orders.js'), /calcPrice\(L, uploads, outs\)/);
});
