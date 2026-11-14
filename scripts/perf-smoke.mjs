/** Safe GET-only smoke test; does not create orders or modify SQL. */
const getArg=(name,defaultValue)=>{const index=process.argv.indexOf(name);return index<0?defaultValue:process.argv[index+1];};
export async function loadProbe({base='http://localhost:3000',count=40,concurrency=5,fetchImpl=fetch}={}) {
  if (!Number.isInteger(count)||count<1||count>200 || !Number.isInteger(concurrency)||concurrency<1||concurrency>10) throw Error('requests 1-200, concurrency 1-10');
  let next=0;const elapsed=[],errors=[];
  await Promise.all(Array.from({length:Math.min(concurrency,count)}, async()=>{
    while(next<count){ const n=next++;const now=performance.now();
      try {const response=await fetchImpl(new URL(n%2===0?'/api/health':'/api/payments/config',base),{signal:AbortSignal.timeout(10000)});
        if(!response.ok) errors.push({request:n,status:response.status});
      }catch(e){errors.push({request:n,error:e.name||'network'});}
      elapsed.push(performance.now()-now);
    }
  }));
  const sorted=elapsed.sort((a,b)=>a-b);
  return {requests:count,concurrency,success:count-errors.length,failed:errors.length,
    p50Ms:Math.round(sorted[Math.ceil(count*.50)-1]),p95Ms:Math.round(sorted[Math.ceil(count*.95)-1]),
    maxMs:Math.round(sorted[count-1]),pass:errors.length===0};
}
if(process.argv[1]?.endsWith('perf-smoke.mjs')){
  const args={base:getArg('--url','http://localhost:3000'),count:Number(getArg('--requests','40')),
    concurrency:Number(getArg('--concurrency','5'))};
  try {const report=await loadProbe(args);console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;}
  catch(e){console.error('PERF_SMOKE_FAILED:',e.message);process.exitCode=1;}
}
