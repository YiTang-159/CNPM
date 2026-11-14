import test from 'node:test';
import assert from 'node:assert/strict';
import { localTranslate, getOllamaStatus } from '../src/localTranslate.js';

const fake = async (_url, options) => {
  const sent = JSON.parse(options.body);
  return { ok: true, json: async () => ({ response: `${sent.model}: ${sent.prompt.includes('Simplified Chinese') ? '中文' : 'Done'}` }) };
};
test('Ollama formats all VI/EN/ZH translation directions without external services', async () => {
  for (const from of ['vi', 'en', 'zh']) for (const to of ['vi', 'en', 'zh']) {
    if (from === to) { assert.equal(await localTranslate('abc', from, to, {fetchImpl: fake}), 'abc'); continue; }
    const result = await localTranslate('Nấu ăn', from, to, {fetchImpl: fake, endpoint: 'http://ollama:11434'});
    assert.ok(result.includes('qwen2.5:3b'));
  }
});
test('model readiness checks reachability and actual model availability', async () => {
  assert.deepEqual(await getOllamaStatus({fetchImpl: async () => ({ok:true,json:async()=>({models:[{name:'qwen2.5:3b'}]})})}),{reachable:true,modelReady:true});
  assert.deepEqual(await getOllamaStatus({fetchImpl: async () => ({ok:true,json:async()=>({models:[]})})}),{reachable:true,modelReady:false});
  assert.deepEqual(await getOllamaStatus({fetchImpl: async () => {throw Error('offline');}}),{reachable:false,modelReady:false});
});
test('model rejects unsupported language and empty text without contacting Ollama', async () => {
  await assert.rejects(localTranslate('', 'vi', 'en', {fetchImpl:fake}), {code:'invalid'});
  await assert.rejects(localTranslate('abc', 'vi', 'fr', {fetchImpl:fake}), {code:'invalid'});
});
