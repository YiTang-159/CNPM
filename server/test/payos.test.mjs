import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { makeToken } from '../src/auth.js';
import { createPayosGateway, signPayosData, verifyPayosData, signPaymentRequest } from '../src/payos.js';

const key = '1a54716c8f0efb2744fb28b6e38b25da7f67a925d98bc1c18bd8faaecadd7675';
const config = { PAYOS_CLIENT_ID:'test-client-123',PAYOS_API_KEY:'test-api-key-123',PAYOS_CHECKSUM_KEY:key,
  PAYOS_RETURN_URL:'http://localhost:5173/#/pricing',PAYOS_CANCEL_URL:'http://localhost:5173/#/pricing',NODE_ENV:'test' };

// Signature được đối chiếu theo ví dụ chính thức của payOS.
test('payOS webhook HMAC official fixture and tampering', () => {
  const data = {orderCode:123,amount:3000,description:'VQRIO123',accountNumber:'12345678',reference:'TF230204212323',
    transactionDateTime:'2023-02-04 18:25:00',currency:'VND',paymentLinkId:'124c33293c43417ab7879e14c8d9eb18',
    code:'00',desc:'Thành công',counterAccountBankId:'',counterAccountBankName:'',counterAccountName:'',counterAccountNumber:'',virtualAccountName:'',virtualAccountNumber:''};
  const signature='412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03';
  assert.equal(signPayosData(data,key),signature);
  assert.equal(verifyPayosData(data,signature,key),true);
  assert.equal(verifyPayosData({...data,amount:4000},signature,key),false);
  assert.equal(verifyPayosData(data,'bad',key),false);
});

test('payOS hosted link must be signed, amount comes from SQL, rejects a tampered provider response', async () => {
  let sent;
  const gateway=createPayosGateway(config, async (_url, options) => {
    sent=JSON.parse(options.body);
    assert.equal(sent.signature,signPaymentRequest(sent,key));
    const data={orderCode:7,amount:90000,checkoutUrl:'https://pay.payos.vn/web/test123',paymentLinkId:'test123'};
    return {ok:true,json:async()=>({code:'00',data,signature:signPayosData(data,key)})};
  });
  const link=await gateway.createCheckout({id:7,amountMinor:90000,currency:'VND'});
  assert.equal(link.checkoutUrl,'https://pay.payos.vn/web/test123');
  assert.equal(sent.description,'DC7');
  await assert.rejects(gateway.createCheckout({id:7,amountMinor:50000,currency:'USD'}),/payment_unsupported/);
  const tampered=createPayosGateway(config,async()=>({ok:true,json:async()=>({code:'00',data:{orderCode:7,amount:1,checkoutUrl:'https://pay.payos.vn/web/test'},signature:'0'.repeat(64)})}));
  await assert.rejects(tampered.createCheckout({id:7,amountMinor:90000,currency:'VND'}),/payment_gateway_invalid_response/);
});

test('customer checkout requires ownership; payOS webhook settles once and rejects fake / mismatched payments', async () => {
  const users=[{id:1,email:'one@example.com',name:'One',role:'user',status:'active'}, {id:2,email:'two@example.com',name:'Two',role:'user',status:'active'}];
  const order={id:7,userId:1,currency:'VND',amountMinor:90000,status:'pending',email:users[0].email,uploads:3,outs:3};
  const payments=[];
  const repo={
    findUser:async email=>users.find(x=>x.email===email),
    orderOwner:async(id,uid)=>id===order.id && uid===order.userId,
    getOrderForPayment:async(id,uid=null)=>id===7&&(uid==null || uid===order.userId)?{...order}:null,
    payOrder:async(id,payment)=>{if(id!==7 || order.status!=='pending')return null;order.status='paid';payments.push(payment);return {order:{...order}};},
  };
  const gateway={createCheckout:async o=>({checkoutUrl:'https://pay.payos.vn/web/abc',provider:'payos',orderId:o.id}),
    verifyWebhook:body=>{
      if(!verifyPayosData(body.data,body.signature,key))throw new Error('bad');
      return {success:body.success===true&&body.code==='00'&&body.data.code==='00',
        orderCode:body.data.orderCode,amount:body.data.amount,currency:body.data.currency,reference:body.data.reference};
    }};
  const app=createApp(repo,{secret:'test-secret',paymentMode:'payos',payosGateway:gateway});
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const call=async(path,body,userId=1,method='POST')=>{
    const headers={'Content-Type':'application/json'};
    if(userId != null) headers.Authorization='Bearer '+makeToken(users[userId-1],'test-secret');
    const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,data:await response.json()};
  };
  const event=(data)=>({code:'00',success:true,data,signature:signPayosData(data,key)});
  try {
    assert.equal((await call('/api/orders/7/checkout',{},2)).status,404);
    assert.equal((await call('/api/orders/7/checkout',{},1)).status,200);
    assert.equal((await call('/api/orders/7/pay',{method:'qr'})).status,503,'legacy self-pay is disabled in payos mode');
    assert.equal((await call('/api/orders/7/status',undefined,2,'GET')).status,404);
    assert.equal((await call('/api/orders/7/status',undefined,1,'GET')).data.order.status,'pending');
    const good={orderCode:7,amount:90000,currency:'VND',reference:'TF-EXTERNAL-001',code:'00'};
    assert.equal((await call('/api/payments/payos/webhook',{...event(good),signature:'f'.repeat(64)},null)).status,400);
    assert.equal((await call('/api/payments/payos/webhook',event({...good,amount:1}),null)).status,409);
    assert.equal((await call('/api/payments/payos/webhook',event({...good,currency:'USD'}),null)).status,409);
    assert.equal(order.status,'pending');
    assert.equal((await call('/api/payments/payos/webhook',event(good),null)).status,200);
    assert.equal(order.status,'paid');
    assert.deepEqual(payments,[{method:'qr',ref:good.reference,source:'payos'}]);
    assert.equal((await call('/api/payments/payos/webhook',event(good),null)).data.alreadyProcessed,true);
    assert.equal(payments.length,1);
    assert.equal((await call('/api/orders/7/status',undefined,1,'GET')).data.order.status,'paid');
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
