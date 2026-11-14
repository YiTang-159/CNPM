// Self-hosted translation using Ollama. No third-party free translation quotas.
const LANG = { vi: 'Vietnamese', en: 'English', zh: 'Simplified Chinese' };
export class LocalTranslationError extends Error { constructor(code) { super(code); this.code = code; } }
export async function localTranslate(text, from, to, { endpoint = process.env.OLLAMA_URL || 'http://ollama:11434', model = process.env.OLLAMA_MODEL || 'qwen2.5:3b', fetchImpl = fetch } = {}) {
  if (!LANG[from] || !LANG[to]) throw new LocalTranslationError('invalid');
  if (from === to) return text;
  const input = String(text || '').trim();
  if (!input || input.length > 4000) throw new LocalTranslationError('invalid');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetchImpl(`${endpoint.replace(/\/$/, '')}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ model, stream: false, options: { temperature: 0 },
        prompt: `Translate the following cooking-video subtitle from ${LANG[from]} to ${LANG[to]}. Preserve ingredient quantities, units and culinary terms accurately. Return only the translated subtitle, no explanations or quotes.\n\nSUBTITLE:\n${input}` })
    });
    if (!response.ok) throw new LocalTranslationError(response.status === 404 ? 'model_missing' : 'server');
    const data = await response.json();
    const output = String(data.response || '').trim();
    if (!output) throw new LocalTranslationError('empty');
    return output;
  } catch (err) {
    if (err instanceof LocalTranslationError) throw err;
    throw new LocalTranslationError(err.name === 'AbortError' ? 'timeout' : 'unavailable');
  } finally { clearTimeout(timeout); }
}

// Status is best-effort; translation works only after the model was downloaded.
export async function getOllamaStatus({ endpoint = process.env.OLLAMA_URL || 'http://ollama:11434',
  model = process.env.OLLAMA_MODEL || 'qwen2.5:3b', fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(`${endpoint.replace(/\/$/, '')}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return { reachable: false, modelReady: false };
    const body = await response.json();
    const available = Array.isArray(body.models) && body.models.some(m => m.name === model || m.model === model);
    return { reachable: true, modelReady: Boolean(available) };
  } catch {
    return { reachable: false, modelReady: false };
  }
}
