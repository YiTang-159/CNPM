import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sql from 'mssql';
import { openRepo } from '../src/db.js';
import { createApp } from '../src/app.js';

// Opt-in SQL test; creates and drops ONLY a new randomized test DB. Never uses the user's DB_NAME.
test('SQL Server migrations, all Admin modules, private data and restart persistence',{
  skip:process.env.DB_INTEGRATION!=='true',timeout:180000,
},async()=>{
  assert.ok(process.env.DB_PASSWORD,'DB_PASSWORD required');
  const db=`DubchefIntegration_${process.pid}_${randomBytes(6).toString('hex')}`;
  const before={name:process.env.DB_NAME,skip:process.env.DB_SKIP_CREATE};
  const config=database=>({server:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||1433),
    user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD,database,options:{encrypt:true,trustServerCertificate:true}});
  process.env.DB_NAME=db;delete process.env.DB_SKIP_CREATE;
  const uploadDir=await mkdtemp(join(tmpdir(),'dubchef-sql-'));
  let repo,server,base;
  const stop=async()=>{if(server){await new Promise(r=>server.close(r));server=null;}if(repo){await repo.close();repo=null;}};
  const start=async()=>{repo=await openRepo();server=createApp(repo,{secret:'sql-integration-fixed-secret',uploadDir,paymentDemo:true}).listen(0,'127.0.0.1');
    await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;};
  const call=async(method,path,body,token,raw=false,headers={})=>{const r=await fetch(base+path,{method,
    headers:{'Content-Type':raw?'application/octet-stream':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},
    body:body==null?undefined:raw?body:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>({}))};};
  try{
    await start();assert.equal((await call('GET','/api/health')).data.db,true);
    await repo.ensureAdmin('admin@integration.example','AdminIntegration123!');
    const a=(await call('POST','/api/auth/login',{email:'admin@integration.example',password:'AdminIntegration123!'})).data.user;
    const reg=await call('POST','/api/auth/register',{name:'Khách Việt',email:'KHACH@integration.example',password:'KhachIntegration123!'});
    assert.equal(reg.status,201);const u=reg.data.user;
    assert.equal((await call('POST','/api/auth/register',{name:'Trùng',email:u.email,password:'KhachIntegration123!'})).status,409);
    assert.equal((await call('POST','/api/auth/login',{email:u.email,password:'wrong'})).status,401);
    assert.equal((await call('POST','/api/auth/login',{email:u.email,password:'KhachIntegration123!'})).status,200);
    const other=(await call('POST','/api/auth/register',{name:'Khác',email:'other@integration.example',password:'OtherIntegration123!'})).data.user;
    // Credits are granted only after actual demo payment (in this isolated test DB).
    assert.equal((await call('GET','/api/me/entitlements',null,u.token)).data.uploadsRemaining,0);
    const order=await call('POST','/api/orders',{name:u.name,email:u.email,uploads:1,outs:1,L:0},u.token);
    assert.equal(order.status,201);const oid=order.data.order.id;
    assert.equal((await call('POST','/api/videos',{title:'no-credit',fileName:'no.mp4',size:5,mimeType:'video/mp4',originalLanguage:'vi'},u.token)).data.code,'quota_upload_exceeded');
    assert.equal((await call('POST',`/api/orders/${oid}/pay`,{method:'qr'},u.token)).status,200);
    assert.equal((await call('GET','/api/me/entitlements',null,u.token)).data.uploadsRemaining,1);
    const meta={title:'Phở Việt',fileName:'pho.mp4',size:5,mimeType:'video/mp4',originalLanguage:'vi'};
    const key='a1939eee-d3cf-4631-bc2b-17a29ea23498';
    const video=await call('POST','/api/videos',meta,u.token,false,{'X-Idempotency-Key':key});
    assert.equal(video.status,201);const id=video.data.video.id;
    const replay=await call('POST','/api/videos',meta,u.token,false,{'X-Idempotency-Key':key});
    assert.equal(replay.status,200);assert.equal(replay.data.video.id,id);
    assert.equal((await call('POST','/api/videos',{...meta,title:'not same'},u.token,false,{'X-Idempotency-Key':key})).data.code,'idempotency_conflict');
    assert.equal((await call('PUT',`/api/videos/${id}/file`,Buffer.from('video'),u.token,true)).status,201);
    const lines=[{vi:'Đun nước',en:'Boil water',start:0,end:3}];
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments:lines},u.token)).status,200);
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments:lines},u.token)).status,200,'retry same translation is free');
    assert.equal((await call('POST',`/api/videos/${id}/results`,{segments:[{vi:'Đun nước',zh:'煮水',start:0,end:3}]},u.token)).data.code,'quota_translation_exceeded');
    assert.equal((await call('GET','/api/videos',null,other.token)).data.videos.length,0);
    assert.equal((await call('GET',`/api/videos/${id}/file`,null,other.token)).status,403);
    for(const kind of ['narrations','subtitles']){
      const path=`/api/admin/media/${kind}/${id}/vi`;
      let row=(await call('GET',path,null,a.token)).data.item;assert.ok(row);
      let body={lines:[{text:'Đun nước đã sửa',start:0,end:3}],version:row.version,status:'reviewing'};
      assert.equal((await call('PUT',path,body,a.token)).status,200);
      assert.equal((await call('PUT',path,body,a.token)).status,409);
      row=(await call('GET',path,null,a.token)).data.item;
      assert.equal((await call('PUT',path,{...body,version:row.version,status:'published'},a.token)).status,200);
      assert.ok((await call('GET',path+'/history',null,a.token)).data.history.length>=3);
    }
    assert.equal((await call('POST','/api/feedback',{message:'Xin hỗ trợ',videoId:id},u.token)).status,201);
    assert.equal((await call('POST','/api/contact',{name:'Khách',email:'guest@example.com',message:'Liên hệ'})).status,201);
    const fb=(await call('GET','/api/admin/feedback',null,a.token)).data.feedback.find(x=>x.source==='user');
    assert.equal((await call('PATCH',`/api/admin/feedback/${fb.id}`,{status:'resolved',priority:'high',reply:'Đã cập nhật'},a.token)).status,200);
    assert.equal((await call('GET','/api/feedback',null,u.token)).data.feedback[0].reply,'Đã cập nhật');
    assert.equal((await call('GET','/api/feedback',null,other.token)).data.feedback.length,0);
    assert.equal((await call('GET',`/api/admin/feedback/${fb.id}/history`,null,a.token)).data.history.length,1);
    assert.equal((await call('POST','/api/admin/languages',{code:'fr',name:'Pháp',englishName:'French'},a.token)).status,201);
    assert.equal((await call('PATCH','/api/admin/languages/fr',{name:'Pháp',englishName:'French',status:'inactive'},a.token)).status,200);
    assert.equal((await call('POST','/api/track',{visitorId:'sql-test',path:'/demo',lang:'vi'})).status,204);
    assert.equal((await call('POST','/api/qr-scan',{visitorId:'sql-test',lang:'vi'})).status,204);
    assert.equal(order.data.order.userId,u.id);
    assert.equal((await call('GET','/api/orders',null,other.token)).data.orders.length,0);
    assert.equal((await call('POST',`/api/orders/${oid}/pay`,{method:'qr'},other.token)).status,404);
    assert.equal((await call('POST',`/api/orders/${oid}/pay`,{method:'qr'},u.token)).status,409);
    assert.deepEqual((await call('GET','/api/me/entitlements',null,u.token)).data.grants.map(x=>[x.usedUploads,x.usedTranslations]),[[1,1]]);
    assert.equal((await call('POST','/api/videos',{title:'too many',fileName:'x.mp4',size:5,mimeType:'video/mp4',originalLanguage:'vi'},u.token)).data.code,'quota_upload_exceeded');
    for(const path of ['/api/admin/dashboard','/api/admin/statistics','/api/admin/videos','/api/admin/orders','/api/admin/languages','/api/admin/overview','/api/admin/qr']){
      assert.equal((await call('GET',path,null,a.token)).status,200);
      assert.equal((await call('GET',path,null,u.token)).status,403);
    }
    await stop();await start(); // migrations repeat and target the same isolated DB
    assert.equal((await call('GET','/api/videos',null,u.token)).data.videos[0].id,id);
    const saved=(await call('GET',`/api/videos/${id}/results`,null,u.token)).data;
    assert.equal(JSON.parse(saved.subtitles.find(x=>x.language==='vi').content)[0].text,'Đun nước đã sửa');
    assert.equal((await call('GET','/api/feedback',null,u.token)).data.feedback[0].status,'resolved');
    assert.equal((await call('GET','/api/orders',null,u.token)).data.orders[0].status,'paid');
    assert.equal((await call('DELETE','/api/admin/users?email='+u.email,null,a.token)).status,409);
    assert.equal((await call('PATCH','/api/admin/users',{email:u.email,status:'locked'},a.token)).status,200);
    assert.equal((await call('GET','/api/videos',null,u.token)).status,401);
    assert.equal((await call('PATCH','/api/admin/users',{email:u.email,status:'active'},a.token)).status,200);
    assert.ok((await call('GET','/api/admin/audit',null,a.token)).data.activities.some(x=>x.type==='user_status'));
    assert.equal((await call('DELETE',`/api/admin/videos/${id}`,null,a.token)).status,200);
    assert.equal((await call('GET','/api/admin/videos',null,a.token)).data.videos.length,0);
    const check=await new sql.ConnectionPool(config(db)).connect();
    try{
      assert.equal((await check.request().query('SELECT COUNT(*) n FROM dbo.GiaoDich')).recordset[0].n,1);
      assert.deepEqual((await check.request().query('SELECT SoVideoDang AS uploads,DaDungVideoDang AS usedUp,SoVideoDich AS outs,DaDungVideoDich AS usedOut FROM dbo.QuyenLoiGoi')).recordset.map(x=>[x.uploads,x.usedUp,x.outs,x.usedOut]), [[1,1,1,1]]);
      assert.equal((await check.request().query("SELECT COUNT(*) AS n FROM dbo.SuDungQuyenLoi WHERE TrangThai='used'")).recordset[0].n,2);
      assert.equal((await check.request().query('SELECT MaNguoiDung AS uid FROM dbo.DonHang WHERE MaDonHang='+oid)).recordset[0].uid,u.id);
      assert.equal((await check.request().query("SELECT COUNT(*) n FROM sys.foreign_keys WHERE name='FK_DonHang_NguoiDung'")).recordset[0].n,1);
      assert.equal((await check.request().query("SELECT COUNT(*) n FROM dbo.NhatKyQuanTri WHERE Loai='user_status'")).recordset[0].n,2);
      assert.ok((await check.request().query('SELECT COUNT(*) n FROM dbo.LichSuDangNhap')).recordset[0].n>=2);
    }finally{await check.close();}
  }finally{
    await stop();await rm(uploadDir,{recursive:true,force:true});
    try{
      assert.match(db,/^DubchefIntegration_\d+_[a-f0-9]{12}$/);
      const m=await new sql.ConnectionPool(config('master')).connect();
      try{await m.request().query(`IF DB_ID(N'${db}') IS NOT NULL BEGIN ALTER DATABASE [${db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${db}]; END`);}finally{await m.close();}
    }finally{
      if(before.name==null)delete process.env.DB_NAME;else process.env.DB_NAME=before.name;
      if(before.skip==null)delete process.env.DB_SKIP_CREATE;else process.env.DB_SKIP_CREATE=before.skip;
    }
  }
});
