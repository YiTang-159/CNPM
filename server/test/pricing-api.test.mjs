import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { makeToken } from '../src/auth.js';

const credential='only-for-unit-tests-not-secret';
const initial={currency:'VND',uploadMinor:20000,translationMinor:10000,maxVideos:500,maxTranslations:3,annualDiscountPct:20,version:1};
const users=[{id:1,email:'boss@test.invalid',role:'admin',status:'active'},{id:2,email:'buyer@test.invalid',role:'user',status:'active'}];
async function serve() {
 let state={...initial},writes=0;
 const repo={
  findUser:async email=>users.find(x=>x.email===email)||null,
  getPricing:async()=>({currencies:[state],packs:[]}),
  getPricingHistory:async()=>[],
  updatePricing:async (body,actor)=>{
   if(body.version!==state.version) throw Object.assign(new Error('price_changed'),{code:'price_changed'});
   writes++;state={...state,...body,version:state.version+1,changedBy:actor};return state;
  },
  createOrder:async()=>null,
 };
 const server=createApp(repo,{secret:credential,corsOrigin:'http://localhost:5173'}).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const token=user=>makeToken(user,credential);
 const call=async(path,method='GET',body=null,who=null)=>{
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(who?{Authorization:'Bearer '+token(who)}:{})},body:body?JSON.stringify(body):undefined});
  return {status:response.status,data:await response.json().catch(()=>({}))};
 };
 return {call,getWrites:()=>writes,close:()=>new Promise(r=>server.close(r))};
}
test('Public price is readable, unauthenticated update denied, user update forbidden',async()=>{
 const x=await serve();try{
  const data=await x.call('/api/pricing');assert.equal(data.status,200);assert.equal(data.data.currencies[0].uploadMinor,20000);
  assert.equal((await x.call('/api/admin/pricing','PUT',{...initial,reason:'update'})).status,401);
  assert.equal((await x.call('/api/admin/pricing','PUT',{...initial,reason:'update'},users[1])).status,403);
  assert.equal(x.getWrites(),0);
 }finally{await x.close();}
});
test('Admin rejects negative prices, accepts valid update once and stale version conflicts',async()=>{
 const x=await serve();try{
  const change={...initial,uploadMinor:25000,reason:'Cập nhật giá dịch vụ'};
  assert.equal((await x.call('/api/admin/pricing','PUT',{...change,uploadMinor:-1},users[0])).status,400);
  assert.equal((await x.call('/api/admin/pricing','PUT',change,users[0])).status,200);
  assert.equal((await x.call('/api/admin/pricing','PUT',change,users[0])).status,409);
  assert.equal((await x.call('/api/pricing')).data.currencies[0].uploadMinor,25000);
  assert.equal(x.getWrites(),1);
 }finally{await x.close();}
});
test('Orders without validated price version must confirm current quote before creation',async()=>{
 const x=await serve();try{
  const res=await x.call('/api/orders','POST',{name:'Buyer',email:'buyer@test.invalid',uploads:1,outs:1,L:0},users[1]);
  assert.equal(res.status,409);assert.equal(res.data.code,'price_changed');
 }finally{await x.close();}
});
