import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { makeToken } from '../src/auth.js';
import { validateLegacyOwnerLink } from '../src/legacyOrders.js';

const proof={userId:1,evidenceType:'payment_reference',evidenceRef:'BANK-REFERENCE-2026',note:'Đã đối chiếu chứng từ gốc với khách hàng.',confirmed:true};

test('legacy owner validation requires explicit independent proof and confirmation',()=>{
  assert.deepEqual(validateLegacyOwnerLink(proof),{userId:1,evidenceType:'payment_reference',evidenceRef:proof.evidenceRef,note:proof.note});
  for (const bad of [
    {...proof,confirmed:false},{...proof,userId:0},{...proof,userId:2147483648},{...proof,evidenceType:'email_only'},
    {...proof,evidenceRef:'x'},{...proof,note:'short'}, {...proof,userId:'1'},
  ]) assert.equal(validateLegacyOwnerLink(bad),null);
});

test('historical order ownership reconciliation is protected by admin role and has errors',async()=>{
  const admin={id:2,name:'Admin',email:'admin@example.com',status:'active',role:'admin'};
  const user={id:1,name:'Customer',email:'customer@example.com',status:'active',role:'user'};
  let linked=false;let invoked=0;
  const repo={
    findUser:async email=>email===admin.email?admin:email===user.email?user:null,
    legacyOwnerCandidates:async id=>id===4?{order:{id:4,userId:linked?1:null,email:user.email},candidates:linked?[]:[user],requiresEvidence:true}:null,
    linkLegacyOwner:async(id,body,actor)=>{
      invoked++;
      assert.equal(actor,admin.email);
      if(!validateLegacyOwnerLink(body))throw Object.assign(new Error('invalid'),{code:'invalid'});
      if(id!==4)throw Object.assign(new Error('not_found'),{code:'not_found'});
      if(linked)throw Object.assign(new Error('already_linked'),{code:'already_linked'});
      linked=true;return {orderId:id,userId:1,ownership:'manual_verified',creditsGranted:false};
    },
  };
  const server=createApp(repo,{secret:'legacy-test'}).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}`;
    const request=async(method,path,body,who)=>{
      const r=await fetch(url+path,{method,headers:{'Content-Type':'application/json',...(who?{Authorization:'Bearer '+makeToken(who,'legacy-test')}: {})},body:body?JSON.stringify(body):undefined});
      return {status:r.status,data:await r.json()};
    };
    const path='/api/admin/orders/4';
    assert.equal((await request('GET',path+'/owner-candidates',null,null)).status,401);
    assert.equal((await request('GET',path+'/owner-candidates',null,user)).status,403);
    assert.equal((await request('POST',path+'/link-owner',proof,user)).status,403);
    assert.equal((await request('GET',path+'/owner-candidates',null,admin)).data.candidates[0].id,1);
    assert.equal((await request('POST',path+'/link-owner',{...proof,note:'bad'},admin)).status,400);
    assert.equal(invoked,0); // HTTP validation rejects invalid evidence before invoking SQL
    assert.equal((await request('POST',path+'/link-owner',proof,admin)).data.creditsGranted,false);
    assert.equal((await request('POST',path+'/link-owner',proof,admin)).status,409);
    assert.equal((await request('GET','/api/admin/orders/900/owner-candidates',null,admin)).status,404);
    for(const invalidId of ['0','-1','1.5','99999999999999999999999','xyz']) {
      assert.equal((await request('GET',`/api/admin/orders/${invalidId}/owner-candidates`,null,admin)).status,400);
      assert.equal((await request('POST',`/api/admin/orders/${invalidId}/link-owner`,proof,admin)).status,400);
    }
    assert.equal((await request('GET',path+'/owner-candidates',null,admin)).data.order.userId,1);
    assert.equal(invoked,2); // one successful write; one retry blocked by the repository

  }finally{await new Promise(resolve=>server.close(resolve));}
});
