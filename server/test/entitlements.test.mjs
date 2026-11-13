import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { makeToken } from '../src/auth.js';
import { QuotaError } from '../src/entitlements.js';

// API integration with a quota-enforcing memory stub. SQL transaction correctness is
// covered separately by sql.integration.test.mjs (DB_INTEGRATION=true).
test('package credits: pending buys nothing, pay grants, account isolation, one charge per translation and retry', async () => {
  const users=[{id:11,email:'a@example.com',role:'user',status:'active',name:'A'},
    {id:12,email:'b@example.com',role:'user',status:'active',name:'B'},
    {id:13,email:'admin@example.com',role:'admin',status:'active',name:'Admin'}];
  const grants=new Map(),orders=[],videos=[],uses=new Set();
  const summary=uid=>{ const g=grants.get(uid)||[];return {
    grants:g.map(x=>({...x})), uploadsRemaining:g.reduce((n,x)=>n+x.uploads-x.usedUploads,0),
    translationsRemaining:g.reduce((n,x)=>n+x.translations-x.usedTranslations,0) }; };
  const consume=(uid,k,id,language='')=>{ const key=`${id}:${k}:${language}`;if(uses.has(key))return;
    const g=(grants.get(uid)||[]).find(x=>x[k==='upload'?'usedUploads':'usedTranslations']<x[k==='upload'?'uploads':'translations']);
    if(!g)throw new QuotaError(k);g[k==='upload'?'usedUploads':'usedTranslations']++;uses.add(key);
  };
  const repo={
    findUser:async email=>users.find(x=>x.email===email),
    entitlements:async uid=>summary(uid),
    entitlementsForEmail:async email=>{const u=users.find(x=>x.email===email&&x.role==='user');return u?summary(u.id):null;},
    createOrder:async b=>{const o={...b,id:orders.length+1,status:'pending'};orders.push(o);return o;},
    orderOwner:async(id,uid)=>orders.some(x=>x.id===id&&x.userId===uid),
    payOrder:async(id,{source='demo'})=>{const o=orders.find(x=>x.id===id&&x.status==='pending');if(!o)return null;
      o.status='paid';if(o.userId){const g=grants.get(o.userId)||[];g.push({id:o.id,orderId:o.id,uploads:o.uploads,translations:o.outs,usedUploads:0,usedTranslations:0,source});grants.set(o.userId,g);}return {order:o};},
    createVideo:async(email,b)=>{const u=users.find(x=>x.email===email);const id=videos.length+1;consume(u.id,'upload',id);
      const v={...b,id,userId:u.id,userEmail:email,status:'uploaded'};videos.push(v);return {id};},
    getVideo:async id=>videos.find(x=>x.id===id),
    userVideos:async email=>videos.filter(x=>x.userEmail===email),
    cancelUnfinishedVideo:async(id,uid)=>{const i=videos.findIndex(x=>x.id===id&&x.userId===uid&&!x.videoUrl);
      if(i<0)return false;const g=grants.get(uid)?.[0];if(g)g.usedUploads--;videos.splice(i,1);uses.delete(`${id}:upload:`);return true;},
    saveVideoResult:async(id,_status,result)=>{const v=videos.find(x=>x.id===id);
      const langs=Object.keys(result.subtitles).filter(x=>x!==v.originalLanguage);
      // Simulate atomic check: avoid partial deductions on exhausted balance.
      const newLangs=langs.filter(x=>!uses.has(`${id}:translation:${x}`));
      if(newLangs.length>summary(v.userId).translationsRemaining)throw new QuotaError('translation');
      for(const lang of newLangs)consume(v.userId,'translation',id,lang);
      v.results=result;},
    videoResults:async id=>videos.find(x=>x.id===id)?.results||{},
  };
  const app=createApp(repo,{secret:'quota-test',paymentMode:'demo'});
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function call(method,path,body,n=0){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${makeToken(users[n],'quota-test')}`},
    body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>({}))};}
  const meta={title:'Phở',fileName:'pho.mp4',size:5,mimeType:'video/mp4',originalLanguage:'vi'};
  try {
    assert.equal((await call('GET','/api/me/entitlements',undefined,2)).status,403);
    assert.equal((await call('POST','/api/videos',meta)).data.code,'quota_upload_exceeded');
    const o=await call('POST','/api/orders',{name:'A',email:'a@example.com',uploads:1,outs:1,L:0});
    assert.equal(o.status,201);
    assert.equal((await call('POST','/api/videos',meta)).status,409,'pending must not grant');
    assert.equal((await call('POST',`/api/orders/${o.data.order.id}/pay`,{method:'qr'})).status,200);
    assert.equal((await call('POST',`/api/orders/${o.data.order.id}/pay`,{method:'qr'})).status,409);
    assert.equal((await call('GET','/api/me/entitlements')).data.uploadsRemaining,1);
    assert.equal((await call('GET','/api/me/entitlements',undefined,1)).data.uploadsRemaining,0);
    assert.equal((await call('GET','/api/admin/entitlements?email=a@example.com',undefined,1)).status,403);
    assert.equal((await call('GET','/api/admin/entitlements?email=a@example.com',undefined,2)).data.uploadsRemaining,1);
    assert.equal((await call('POST','/api/videos',meta,2)).status,403);
    const created=await call('POST','/api/videos',meta);assert.equal(created.status,201);
    const id=created.data.video.id;
    assert.equal((await call('POST','/api/videos',meta)).data.code,'quota_upload_exceeded');
    const segments=[{vi:'Đun',en:'Boil',start:0,end:1}];
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments,originalLanguage:'en'})).status,400);
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments})).status,200);
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments})).status,200);
    const b=(await call('GET','/api/me/entitlements')).data;
    assert.deepEqual([b.uploadsRemaining,b.translationsRemaining],[0,0]);
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments:[{vi:'Đun',zh:'煮',start:0,end:1}]})).data.code,'quota_translation_exceeded');
    assert.equal((await call('POST',`/api/videos/${id}/cancel`,undefined,1)).status,409);
    assert.equal((await call('POST',`/api/videos/${id}/cancel`)).status,200);
    assert.equal((await call('GET','/api/me/entitlements')).data.uploadsRemaining,1);
  } finally { await new Promise(r=>server.close(r)); }
});
