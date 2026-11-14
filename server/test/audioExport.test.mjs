import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNarration, produceVoiceover } from '../src/audioExport.js';
import { stat, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const line = [{text:'Welcome to Dubchef.',start:0.2,end:3}];
test('narration timeline accepts approved timestamped language content', () => {
  assert.deepEqual(parseNarration(JSON.stringify(line),'en'),line);
});
test('narration export rejects overlapping or missing timestamp text', () => {
  for (const content of [
    [{text:'A', start:null, end:null}],
    [{text:'A',start:1,end:2},{text:'B',start:1.8,end:3}],
    [{text:'',start:0,end:1}],
    [{text:'x',start:-1,end:1}],
  ]) assert.throws(() => parseNarration(JSON.stringify(content),'vi'), {code:'invalid_timeline'});
  assert.throws(() => parseNarration(JSON.stringify(line),'fr'), {code:'language_not_supported'});
});
test('narration export rejects unreasonable durations and text sizes', () => {
  assert.throws(() => parseNarration(JSON.stringify([{text:'x',start:0,end:700}]),'en'), {code:'invalid_timeline'});
  assert.throws(() => parseNarration(JSON.stringify([{text:'a'.repeat(1501),start:0,end:500}]),'en'), {code:'invalid_timeline'});
});

// Mandatory real-media integration test: FAILS if FFmpeg/eSpeak are unavailable.
test('eSpeak + FFmpeg create a playable MP3 with an audio stream', async () => {
  const result = await produceVoiceover({content:JSON.stringify(line),language:'en',format:'mp3'});
  try {
    assert.ok((await stat(result.output)).size > 1000);
    const probe = spawnSync(process.env.FFPROBE_BIN || 'ffprobe',
      ['-v','error','-select_streams','a:0','-show_entries','stream=codec_name','-of','default=nw=1:nk=1',result.output]);
    assert.equal(probe.status,0);
    assert.match(probe.stdout.toString(),/mp3/);
  } finally {await rm(result.directory,{recursive:true,force:true});}
});

test('published voiceover export listing enforces video ownership and hides drafts', async () => {
  const { createApp } = await import('../src/app.js');
  const { makeToken } = await import('../src/auth.js');
  const people = [
    {id:1,email:'one@example.com',role:'user',status:'active'},
    {id:2,email:'two@example.com',role:'user',status:'active'},
    {id:3,email:'admin@example.com',role:'admin',status:'active'},
  ];
  const repo = {
    findUser: async email => people.find(person => person.email === email),
    getVideo: async id => id === 5 ? {id:5,userEmail:'one@example.com',videoUrl:null} : null,
    mediaDetail: async (_kind, id, language) => id === 5 && language === 'en'
      ? {status:'published',version:3,content:JSON.stringify(line)}
      : {status:'draft',version:1,content:JSON.stringify(line)},
  };
  const server = createApp(repo,{secret:'voice-secret'}).listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const get = (path, i) => fetch(url+path, {headers:i==null?{}:{Authorization:'Bearer '+makeToken(people[i],'voice-secret')}});
  try {
    assert.equal((await get('/api/videos/5/exports', null)).status,401);
    assert.equal((await get('/api/videos/5/exports', 1)).status,403);
    assert.deepEqual(await (await get('/api/videos/5/exports',0)).json(),{languages:['en'],hasVideo:false});
    assert.deepEqual(await (await get('/api/videos/5/exports',2)).json(),{languages:['en'],hasVideo:false});
    assert.equal((await get('/api/videos/5/export/vi/mp3',0)).status,409);
    assert.equal((await get('/api/videos/5/export/en/mp4',0)).status,409);
    assert.equal((await get('/api/videos/5/export/en/mp3',1)).status,403);
  } finally {await new Promise(resolve => server.close(resolve));}
});
