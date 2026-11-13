// Điểm gọi dịch thống nhất cho Web và Mobile.
// Chỉ gửi tới API Dubchef (/api/translate), KHÔNG gọi dịch vụ công cộng.
// baseUrl và token được ứng dụng Web/Mobile truyền vào để không phụ thuộc Vite hay Expo.
const LANGUAGES = new Set(['vi', 'en', 'zh']);

export class TranslateError extends Error {
  constructor(code) {
    super(code);
    this.name = 'TranslateError';
    this.code = code;
  }
}

/** Dịch một đoạn văn bản qua backend Dubchef. */
export async function translateText(text, from, to, fetchImpl = fetch, options = {}) {
  const input = String(text ?? '').trim();
  if (!input) return '';
  if (!LANGUAGES.has(from) || !LANGUAGES.has(to)) throw new TranslateError('invalid');
  if (from === to) return input;

  const baseUrl = String(options?.baseUrl || '').trim().replace(/\/+$/, '');
  if (!baseUrl) throw new TranslateError('net');
  const token = String(options?.token || '').trim();
  if (!token) throw new TranslateError('auth');

  let response;
  try {
    response = await fetchImpl(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: input, from, to }),
    });
  } catch {
    throw new TranslateError('net');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new TranslateError('server');
  }
  if (!response.ok) {
    const code = String(data?.code || '');
    if (response.status === 401 || code === 'auth') throw new TranslateError('auth');
    if (response.status === 403 || code === 'forbidden') throw new TranslateError('forbidden');
    if (response.status === 429 || code === 'busy') throw new TranslateError('limit');
    if (['model_missing', 'unavailable', 'timeout'].includes(code)) throw new TranslateError(code);
    throw new TranslateError('server');
  }

  const output = data?.translatedText;
  if (typeof output !== 'string' || !output.trim()) throw new TranslateError('empty');
  return output.trim();
}

/** Dịch một câu sang các ngôn ngữ đang bật. */
export async function translateToAll(text, from, fetchImpl = fetch, enabled = ['vi', 'en', 'zh'], options = {}) {
  const input = String(text ?? '').trim();
  if (!LANGUAGES.has(from)) throw new TranslateError('invalid');
  const result = { [from]: input };
  if (!input) return result;
  for (const to of [...new Set(enabled)].filter((lang) => lang !== from && LANGUAGES.has(lang))) {
    result[to] = await translateText(input, from, to, fetchImpl, options);
  }
  return result;
}

/** Giữ thứ tự câu và mốc thời gian để bộ xử lý video đồng bộ lời đọc. */
export async function translateLines(lines, from, fetchImpl = fetch, enabled = ['vi', 'en', 'zh'], options = {}) {
  const clean = lines.map((line) => String(line ?? '').trim()).filter(Boolean);
  const translated = [];
  for (const line of clean) {
    translated.push(await translateToAll(line, from, fetchImpl, enabled, options));
  }
  return translated;
}
