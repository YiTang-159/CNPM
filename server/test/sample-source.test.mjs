import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('Quick sample never invokes network inference or video upload',async()=>{
 const s=await readFile(new URL('../../web/src/pages/Demo.jsx',import.meta.url),'utf8');
 const start=s.indexOf('const trySample = () =>');const end=s.indexOf('const jump = (n)',start);
 const sample=s.slice(start,end);
 assert.ok(start>0 && end>start);
 for(const disallowed of ['workApi.','translateLines(', 'transcribeVideoAudio(', 'fileToWhisperAudio(', 'orders.pay('])
   assert.equal(sample.includes(disallowed),false,disallowed);
 assert.equal(sample.includes('setSegments(['),true);
});
