import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyVerifiedBackup } from '../../scripts/backup-offsite.mjs';
import { probe } from '../../scripts/monitor-system.mjs';
import { loadProbe } from '../../scripts/perf-smoke.mjs';
import { createApp } from '../src/app.js';

test('offsite copy requires verified manifest and preserves both SHA-256 values',async()=>{
 const tmp=await mkdtemp(join(tmpdir(),'dubchef-offsite-test-'));
 try{
  const src=join(tmp,'dubchef_test0001'),out=join(tmp,'usb');await mkdir(src);await mkdir(out);
  const db=Buffer.from('backupdata'),video=Buffer.from('videodata');
  const spec=b=>({size:b.length,sha256:createHash('sha256').update(b).digest('hex')});
  const manifest={version:1,database:'DubchefDB',databaseBak:spec(db),uploadsTar:spec(video)};
  await Promise.all([writeFile(join(src,'database.bak'),db),writeFile(join(src,'uploads.tar.gz'),video),
    writeFile(join(src,'manifest.json'),JSON.stringify(manifest)),
    writeFile(join(src,'verification.json'),JSON.stringify({databaseRestore:'PASS',integrityCheck:'PASS',uploadsArchive:'PASS',sha256:'PASS'}))]);
  const moved=await copyVerifiedBackup(src,out,{requireDifferentDrive:false});
  assert.deepEqual(await readFile(join(moved,'database.bak')),db);
  await assert.rejects(copyVerifiedBackup(src,out,{requireDifferentDrive:false}));
  await writeFile(join(src,'database.bak'),'changed');
  const dir2=join(tmp,'nas');await mkdir(dir2);
  await assert.rejects(copyVerifiedBackup(src,dir2,{requireDifferentDrive:false}),/checksum/);
 }finally{await rm(tmp,{recursive:true,force:true});}
});
test('monitor reports OK/DEGRADED/DOWN without private info',async()=>{
 const response=async url=>({json:async()=>String(url).includes('translation')?{reachable:true,modelReady:true}:
 String(url).includes('payments/config')?{mode:'demo'}:{ok:true,db:true}});
 const ok=await probe('http://localhost:3000',response);assert.equal(ok.status,'OK');assert.equal(ok.paymentMode,'demo');
 const down=await probe('http://localhost:3000',async()=>{throw Error('offline')});assert.equal(down.status,'DOWN');
});
test('bounded perf GET-only probe summarizes failures',async()=>{
 const out=await loadProbe({count:6,concurrency:2,fetchImpl:async()=>({ok:true})});
 assert.equal(out.requests,6);assert.equal(out.failed,0);assert.ok(out.p95Ms>=0);
 await assert.rejects(loadProbe({count:1000}),/requests/);
});

test('metrics endpoint is locked without explicit token, and counts requests safely',async()=>{
  const original=process.env.METRICS_TOKEN;
  const app=createApp({ping:async()=>{}},{corsOrigin:'http://localhost:5173'});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    delete process.env.METRICS_TOKEN;
    assert.equal((await fetch(base+'/api/metrics')).status,404);
    process.env.METRICS_TOKEN='MetricsToken32CharactersLongOnlyLocal';
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await fetch(base+'/api/metrics')).status,401);
    const valid=await fetch(base+'/api/metrics',{headers:{Authorization:'Bearer '+process.env.METRICS_TOKEN}});
    assert.equal(valid.status,200);
    assert.match(await valid.text(),/dubchef_http_requests_total [1-9]/);
  }finally{
    if(original===undefined)delete process.env.METRICS_TOKEN;else process.env.METRICS_TOKEN=original;
    await new Promise(resolve=>server.close(resolve));
  }
});
