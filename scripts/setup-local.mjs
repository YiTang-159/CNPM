import { randomBytes } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const target=fileURLToPath(new URL('../.env',import.meta.url));
let content='';
try { content=await readFile(target,'utf8'); } catch(e) { if(e.code!=='ENOENT') throw e; }
const keys=new Map(content.split(/\r?\n/).filter(x=>x.trim()&&!x.trim().startsWith('#')&&x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()]));
// Existing SQL credentials and connection settings are preserved byte for byte.
const defaults={ADMIN_EMAIL:'admin@dubchef.vn',ADMIN_PASSWORD:'Admin!'+randomBytes(18).toString('hex'),TOKEN_SECRET:randomBytes(48).toString('hex'),PAYMENT_DEMO:'true'};
for(const [key,value] of Object.entries(defaults)) {
  if(keys.get(key)) continue;
  const pattern=new RegExp('^'+key+'=.*$','m');
  if(pattern.test(content))content=content.replace(pattern,key+'='+value);
  else content+=(content.endsWith('\n')||!content?'':'\n')+key+'='+value+'\n';
}
await writeFile(target,content,{mode:0o600});
console.log('Đã bổ sung cấu hình còn thiếu, giữ nguyên kết nối SQL. Xem ADMIN_EMAIL và ADMIN_PASSWORD trong .env để đăng nhập. Mật khẩu không in ra log.');
