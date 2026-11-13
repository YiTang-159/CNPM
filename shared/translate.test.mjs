import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TranslateError, translateLines, translateText, translateToAll } from './translate.js';

const cfg = { baseUrl: 'http://localhost:3000', token: 'signed-test-token' };
function fakeFetch(translations = {}) {
  const calls = [];
  const impl = async (url, request) => {
    calls.push({ url, request });
    const { text, from, to } = JSON.parse(request.body);
    assert.equal(url, 'http://localhost:3000/api/translate');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Authorization, `Bearer ${cfg.token}`);
    return { ok: true, status: 200, json: async () => ({ translatedText: translations[`${text}|${from}|${to}`] || 'Đã dịch' }) };
  };
  return { impl, calls };
}

test('dịch Việt sang Anh qua API nội bộ, dùng POST và token', async () => {
  const fx = fakeFetch({ 'Xin chào|vi|en': 'Hello' });
  assert.equal(await translateText('Xin chào', 'vi', 'en', fx.impl, cfg), 'Hello');
  assert.equal(fx.calls.length, 1);
});

test('cùng ngôn ngữ trả nguyên văn, không gọi API', async () => {
  assert.equal(await translateText(' Xin chào ', 'vi', 'vi', () => { throw Error('Called unexpectedly'); }), 'Xin chào');
});

test('dịch tới cả ba ngôn ngữ, giữ nguyên tiếng nguồn', async () => {
  const fx = fakeFetch({ 'Xin chào|vi|en': 'Hello', 'Xin chào|vi|zh': '你好' });
  const actual = await translateToAll('Xin chào', 'vi', fx.impl, ['vi','en','zh'], cfg);
  assert.deepEqual(actual, { vi: 'Xin chào', en: 'Hello', zh: '你好' });
});

test('dịch từng dòng theo thứ tự, bỏ dòng trống', async () => {
  const fx = fakeFetch();
  const rows = await translateLines(['Chào', ' ', 'Tạm biệt'], 'vi', fx.impl, ['en'], cfg);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.vi), ['Chào','Tạm biệt']);
  assert.equal(fx.calls.length, 2);
});

test('không có token không được gọi dịch vụ', async () => {
  const fx = fakeFetch();
  await assert.rejects(translateText('Hi','en','vi',fx.impl,{baseUrl:cfg.baseUrl}), (e) => e instanceof TranslateError && e.code === 'auth');
  assert.equal(fx.calls.length, 0);
});

test('không có API URL không tự động gọi một dịch vụ miễn phí', async () => {
  const fx = fakeFetch();
  await assert.rejects(translateText('Hi','en','vi',fx.impl,{token:cfg.token}), (e) => e.code === 'net');
  assert.equal(fx.calls.length, 0);
});

test('lỗi mạng và HTTP 500 phản ánh đúng tình trạng', async () => {
  await assert.rejects(translateText('Hi','en','vi', async () => { throw Error('offline'); },cfg), (e) => e.code === 'net');
  await assert.rejects(translateText('Hi','en','vi', async () => ({ok:false,status:500,json: async()=>({code:'server'})}),cfg), (e) => e.code === 'server');
});

test('HTTP 429 và model_missing được nhận diện', async () => {
  await assert.rejects(translateText('Hi','en','vi', async () => ({ok:false,status:429,json: async()=>({code:'busy'})}),cfg), (e) => e.code === 'limit');
  await assert.rejects(translateText('Hi','en','vi', async () => ({ok:false,status:503,json: async()=>({code:'model_missing'})}),cfg), (e) => e.code === 'model_missing');
});

test('chỉ dịch ngôn ngữ đang bật và không dịch trùng', async () => {
  const fx = fakeFetch();
  const rows = await translateLines(['Xin chào'], 'vi', fx.impl, ['vi', 'en', 'en', 'unknown'], cfg);
  assert.deepEqual(Object.keys(rows[0]), ['vi','en']);
  assert.equal(fx.calls.length, 1);
});

test('bản Web và Mobile luôn đồng bộ với shared, không có URL dịch miễn phí', () => {
  const canonical = readFileSync(new URL('./translate.js', import.meta.url), 'utf8');
  const web = readFileSync(new URL('../web/src/shared/translate.js', import.meta.url), 'utf8');
  const mobile = readFileSync(new URL('../mobile/src/shared/translate.js', import.meta.url), 'utf8');
  assert.equal(web, canonical);
  assert.equal(mobile, canonical);
  for (const value of [canonical, web, mobile]) assert.doesNotMatch(value, /api\.mymemory\.translated\.net/i);
});
