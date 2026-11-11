import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { makeToken, hashPassword, readToken, verifyPassword } from '../src/auth.js';
import { mediaTransitionError } from '../src/adminPolicy.js';

async function fixture(options={}) {
  const users=[{id:1,email:'one@example.com',name:'One',role:'user',status:'active'},
    {id:2,email:'two@example.com',name:'Two',role:'user',status:'active'},
    {id:3,email:'admin@example.com',name:'Admin',role:'admin',status:'active'}];
  const videos=[],orders=[],feedback=[],contacts=[],history=[],media=new Map();
  const languages=[{code:'vi',status:'active'},{code:'en',status:'active'},{code:'zh',status:'inactive'},{code:'fr',status:'active'}];
  const repo={
    findUser:async email=>users.find(u=>u.email===email),
    ping:async()=>{},languages:async()=>languages,
    createVideo:async(email,b)=>{const v={...b,id:videos.length+1,userEmail:email,status:'uploaded'};videos.push(v);return v;},
    getVideo:async id=>videos.find(v=>v.id===id),userVideos:async email=>videos.filter(v=>v.userEmail===email),
    listVideos:async()=>videos,
    setVideoFile:async(id,path)=>{videos.find(v=>v.id===id).videoUrl=path;return true;},
    setVideoStatus:async(id,status)=>{videos.find(v=>v.id===id).status=status;},
    deleteVideo:async id=>{videos.splice(videos.findIndex(v=>v.id===id),1);},
    saveVideoResult:async(id,status,results)=>{videos.find(v=>v.id===id).results=results;},
    videoResults:async id=>videos.find(v=>v.id===id)?.results || {},
    createOrder:async b=>{const o={...b,id:orders.length+1,status:'pending'};orders.push(o);return o;},
    orderEmail:async id=>orders.find(o=>o.id===id)?.email,
    listOrders:async email=>orders.filter(o=>o.email===email),
    payOrder:async(id)=>{const o=orders.find(o=>o.id===id&&o.status==='pending');if(!o)return null;o.status='paid';return {order:o};},
    addFeedback:async(email,message,videoId)=>{const f={id:feedback.length+1,email,message,videoId,status:'new'};feedback.push(f);return f;},
    userFeedback:async email=>feedback.filter(f=>f.email===email),
    addMessage:async b=>{contacts.push(b);},allFeedback:async()=>feedback.map(f=>({...f,id:'f-'+f.id})),
    handleFeedback:async(id,b)=>{const f=feedback.find(f=>'f-'+f.id===id);if(!f)return false;Object.assign(f,b);history.push(b);return true;},
    feedbackHistory:async()=>history,
    mediaIndex:async()=>[...media.values()],
    mediaDetail:async(kind,id,lang)=>media.get(`${kind}:${id}:${lang}`),mediaHistory:async()=>history,
    saveManagedMedia:async b=>{const k=`${b.kind}:${b.videoId}:${b.language}`,old=media.get(k),content=JSON.stringify(b.lines);
      const err=Number(old?.version||0)!==b.version?'conflict':mediaTransitionError(old,b.status,content);
      if(err) throw Object.assign(new Error(err),{code:err});
      const row={...b,content,version:b.version+1};media.set(k,row);history.push(row);return row;},
    createLanguage:async b=>{if(languages.some(x=>x.code===b.code))return false;languages.push({...b,status:'active'});return true;},
    updateLanguage:async(code,b)=>{const l=languages.find(x=>x.code===code);if(!l)return false;Object.assign(l,b);return true;},
    adminOrders:async()=>orders,dashboardSummary:async()=>({statistics:{totalVideos:videos.length}}),adminStatistics:async()=>({totalVideos:videos.length}),
  };
  const uploadDir=await mkdtemp(join(tmpdir(),'dubchef-canonical-'));
  const server=createApp(repo,{secret:'test',uploadDir,...options}).listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));
  const base='http://127.0.0.1:'+server.address().port,tokens=users.map(u=>makeToken(u,'test'));
  const call=async(method,path,body,user=0,raw=false)=>{const r=await fetch(base+path,{method,
    headers:{'Content-Type':raw?'application/octet-stream':'application/json',...(user===null?{}:{Authorization:'Bearer '+tokens[user]})},
    body:body===undefined?undefined:raw?body:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>null)};};
  return {repo,users,videos,orders,feedback,contacts,history,call,base,uploadDir,tokens,
    close:async()=>{await new Promise(r=>server.close(r));await rm(uploadDir,{recursive:true,force:true});}};
}
const metadata={title:'Món ăn',fileName:'com.mp4',size:5,mimeType:'video/mp4',originalLanguage:'vi'};
const segments=[{vi:'Nấu cơm',en:'Cook rice',start:0,end:3}];

test('canonical videos: owner isolation, locked/deleted/recreated and demoted tokens',async()=>{
  const f=await fixture();try{
    assert.equal((await f.call('GET','/api/videos',undefined,null)).status,401);
    assert.equal((await f.call('POST','/api/videos',metadata)).status,201);
    assert.equal((await f.call('GET','/api/videos',undefined,1)).data.videos.length,0);
    assert.equal((await f.call('GET','/api/videos/1/results',undefined,1)).status,403);
    f.users[0].status='locked';assert.equal((await f.call('GET','/api/videos')).status,401);
    f.users[0].status='active';f.users[0].id=99;assert.equal((await f.call('GET','/api/videos')).status,401);
    f.users[2].role='user';assert.equal((await f.call('GET','/api/admin/videos',undefined,2)).status,401);
  }finally{await f.close();}
});
test('binary upload: exact size, private access, cleanup, reload and admin preview',async()=>{
  const f=await fixture();try{
    await f.call('POST','/api/videos',metadata);
    assert.equal((await f.call('PUT','/api/videos/1/file',Buffer.from('bad'),0,true)).status,400);
    assert.deepEqual(await readdir(f.uploadDir),[]);
    assert.equal((await f.call('PUT','/api/videos/1/file',Buffer.from('video'),1,true)).status,403);
    assert.equal((await f.call('PUT','/api/videos/1/file',Buffer.from('video'),0,true)).status,201);
    assert.equal((await f.call('PUT','/api/videos/1/file',Buffer.from('video'),0,true)).status,409);
    for(const n of [0,2]){const r=await fetch(f.base+'/api/videos/1/file',{headers:{Authorization:'Bearer '+f.tokens[n]}});assert.equal(r.status,200);assert.equal(await r.text(),'video');}
    assert.equal((await f.call('GET','/api/videos/1/file',undefined,null)).status,401);
    assert.equal((await f.call('DELETE','/api/admin/videos/1',undefined,2)).status,200);
    assert.deepEqual(await readdir(f.uploadDir),[]);
  }finally{await f.close();}
});
test('video metadata rejects invalid MIME and oversized files',async()=>{
  const f=await fixture({maxUploadBytes:10});try{
    assert.equal((await f.call('POST','/api/videos',{...metadata,size:11})).status,400);
    assert.equal((await f.call('POST','/api/videos',{...metadata,mimeType:'video/html'})).status,400);
  }finally{await f.close();}
});
test('results persist language content and reject reversed, overlapping or partial timestamps',async()=>{
  const f=await fixture();try{
    await f.call('POST','/api/videos',metadata);
    for(const lines of [[{vi:'x',start:2,end:1}],[{vi:'x',start:1}], [{vi:'x',start:0,end:3},{vi:'y',start:2,end:4}]])
      assert.equal((await f.call('POST','/api/videos/1/results',{segments:lines})).status,400);
    assert.equal((await f.call('POST','/api/videos/1/results',{segments})).status,200);
    assert.equal(JSON.parse(f.videos[0].results.subtitles.vi)[0].text,'Nấu cơm');
    assert.equal((await f.call('POST','/api/videos/1/results',{segments},1)).status,403);
  }finally{await f.close();}
});
test('orders reject forged owner, isolate history, payment explicitly enabled and idempotent',async()=>{
  const f=await fixture();try{
    const body={name:'One',email:'one@example.com',uploads:1,outs:1,L:0};
    assert.equal((await f.call('POST','/api/orders',{...body,email:'two@example.com'})).status,403);
    assert.equal((await f.call('POST','/api/orders',body)).status,201);
    assert.equal((await f.call('POST','/api/orders/1/pay',{method:'qr'},1)).status,404);
    assert.equal((await f.call('POST','/api/orders/1/pay',{method:'qr'})).status,503);
    assert.equal(f.orders[0].status,'pending');
    assert.equal((await f.call('GET','/api/orders',undefined,1)).data.orders.length,0);
  }finally{await f.close();}
  const demo=await fixture({paymentDemo:true});try{
    await demo.call('POST','/api/orders',{name:'One',email:'one@example.com',uploads:1,outs:1,L:0});
    assert.equal((await demo.call('POST','/api/orders/1/pay',{method:'qr'})).status,200);
    assert.equal((await demo.call('POST','/api/orders/1/pay',{method:'qr'})).status,409);
  }finally{await demo.close();}
});
test('member feedback uses token identity, private history and replies; guest contacts remain separate',async()=>{
  const f=await fixture();try{
    await f.call('POST','/api/feedback',{email:'two@example.com',message:'Hỗ trợ'});
    assert.equal(f.feedback[0].email,'one@example.com');
    assert.equal((await f.call('GET','/api/feedback',undefined,1)).data.feedback.length,0);
    await f.call('POST','/api/contact',{name:'Guest',email:'one@example.com',message:'Contact'},null);
    assert.equal((await f.call('GET','/api/feedback')).data.feedback.length,1);
    assert.equal((await f.call('PATCH','/api/admin/feedback/f-1',{status:'resolved',priority:'high',reply:''},2)).status,400);
    assert.equal((await f.call('PATCH','/api/admin/feedback/f-1',{status:'resolved',priority:'high',reply:'Đã sửa'},2)).status,200);
    assert.equal((await f.call('GET','/api/feedback')).data.feedback[0].reply,'Đã sửa');
    assert.equal((await f.call('GET','/api/admin/feedback/f-1/history',undefined,2)).data.history.length,1);
  }finally{await f.close();}
});
test('admin media: permissions, validation, version conflict, review then publish, history',async()=>{
  const f=await fixture();try{
    await f.call('POST','/api/videos',metadata);
    const path='/api/admin/media/narrations/1/vi';
    const body={lines:[{text:'Nấu cơm',start:0,end:3}],version:0,status:'draft'};
    assert.equal((await f.call('PUT',path,body)).status,403);
    assert.equal((await f.call('PUT',path,{...body,lines:[{text:'x',start:3,end:1}]},2)).status,400);
    assert.equal((await f.call('PUT',path,body,2)).status,200);
    assert.equal((await f.call('PUT',path,body,2)).status,409);
    assert.equal((await f.call('PUT',path,{...body,version:1,status:'published'},2)).status,409);
    assert.equal((await f.call('PUT',path,{...body,version:1,status:'reviewing'},2)).status,200);
    assert.equal((await f.call('PUT',path,{...body,version:2,status:'published'},2)).status,200);
    assert.equal((await f.call('GET',path+'/history',undefined,2)).data.history.length,3);
  }finally{await f.close();}
});
test('all routed Admin modules require admin; catalog only exposes supported active languages',async()=>{
  const f=await fixture();try{
    for(const path of ['/api/admin/dashboard','/api/admin/statistics','/api/admin/videos','/api/admin/languages','/api/admin/media/narrations','/api/admin/media/subtitles','/api/admin/feedback','/api/admin/orders']){
      assert.equal((await f.call('GET',path,undefined,null)).status,401);
      assert.equal((await f.call('GET',path)).status,403);
      assert.equal((await f.call('GET',path,undefined,2)).status,200);
    }
    assert.deepEqual((await f.call('GET','/api/languages',undefined,null)).data.languages.map(x=>x.code),['vi','en']);
    assert.equal((await f.call('PATCH','/api/admin/languages/en',{name:'Anh',englishName:'English',status:'inactive'},2)).status,200);
    assert.deepEqual((await f.call('GET','/api/languages',undefined,null)).data.languages.map(x=>x.code),['vi']);
  }finally{await f.close();}
});
test('malformed token suffix and malformed password never authenticate',()=>{
  assert.equal(readToken(makeToken({email:'a@b.co',role:'admin'},'s')+'.extra','s'),null);
  for(const value of ['', 'xx:yy', '0:123', 'aa:aa',hashPassword('secret')+':junk']) assert.equal(verifyPassword('secret',value),false);
});
