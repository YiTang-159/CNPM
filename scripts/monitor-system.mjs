/** Local health recorder. Run via Windows Task Scheduler every 5 minutes. */
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function probe(base='http://localhost:3000',fetchImpl=fetch){
  const result={at:new Date().toISOString(),api:false,db:false,ollama:false,modelReady:false,paymentMode:'unknown'};
  const get=async path=>{
    const response=await fetchImpl(new URL(path,base),{signal:AbortSignal.timeout(3000)});
    return response.json();
  };
  try {const data=await get('/api/health');result.api=true;result.db=data.ok===true && data.db===true;} catch { /* offline */ }
  if(result.api){
    try { const model=await get('/api/health/translation');result.ollama=model.reachable===true;result.modelReady=model.modelReady===true;} catch { /* model unavailable */ }
    try { const payment=await get('/api/payments/config'); result.paymentMode=String(payment.mode||'unknown'); } catch { /* offline */ }
  }
  result.status=!result.db?'DOWN':!result.modelReady?'DEGRADED':'OK';
  return result;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const base=process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:'http://localhost:3000';
  try {
    const report=await probe(base);
    const folder=join(root,'.local-monitor');
    await mkdir(folder,{recursive:true});
    await appendFile(join(folder,'health.jsonl'),JSON.stringify(report)+'\n',{mode:0o600});
    console.log(JSON.stringify(report,null,2));
    if(report.status!=='OK') process.exitCode=1;
  } catch(e){ console.error('MONITOR_FAILED:',e.message);process.exitCode=1; }
}
