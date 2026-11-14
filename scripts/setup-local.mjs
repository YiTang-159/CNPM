import { randomBytes } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const target=fileURLToPath(new URL('../.env',import.meta.url));
let content='';
try { content=await readFile(target,'utf8'); } catch(e) { if(e.code!=='ENOENT') throw e; }
const keys=new Map(content.split(/\r?\n/).filter(x=>x.trim()&&!x.trim().startsWith('#')&&x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()]));
// Existing SQL credentials and connection settings are preserved byte for byte.
const defaults={DB_PASSWORD:'Db!'+randomBytes(24).toString('hex'),ADMIN_EMAIL:'admin@dubchef.vn',ADMIN_PASSWORD:'Admin!'+randomBytes(18).toString('hex'),TOKEN_SECRET:randomBytes(48).toString('hex'),PAYMENT_MODE:keys.get('PAYMENT_DEMO') === 'true' ? 'demo' : 'disabled',CORS_ORIGIN:'http://localhost:5173,http://127.0.0.1:5173',DB_BIND_ADDRESS:'127.0.0.1',API_BIND_ADDRESS:'127.0.0.1',DB_TRUST_SERVER_CERTIFICATE:'true'};
// Migrate the obsolete demo toggle to the single supported mode, without touching DB secrets.
content=content.replace(/^PAYMENT_DEMO=.*(?:\r?\n|$)/gm,'');
let generatedAdminPassword = null;
for(const [key,value] of Object.entries(defaults)) {
  const existing = keys.get(key);
  // Only replace template placeholders. Never rotate a real existing SQL password automatically.
  if (existing && (key !== 'ADMIN_PASSWORD' || existing.length > 0) && !existing.startsWith('CHANGE_TO_') && !existing.startsWith('GENERATE_USING_')) continue;
  if (key === 'ADMIN_PASSWORD') generatedAdminPassword = value;
  const pattern=new RegExp('^'+key+'=.*$','m');
  if(pattern.test(content))content=content.replace(pattern,key+'='+value);
  else content+=(content.endsWith('\n')||!content?'':'\n')+key+'='+value+'\n';
}
await writeFile(target,content,{mode:0o600});
console.log('Đã thêm biến còn thiếu vào .env (không ghi đè mật khẩu SQL cũ). Giữ bí mật file này; không chia sẻ .env.');
if (generatedAdminPassword && process.stdout.isTTY) {
  // Display exactly once at interactive local setup; never print in CI/log capture.
  process.stdout.write('Mật khẩu Admin vừa tạo (chỉ hiển thị lần này, không chia sẻ): ' + generatedAdminPassword + '\n');
} else if (generatedAdminPassword) console.log('Mật khẩu Admin đã được sinh trong .env riêng; không in trong môi trường tự động.');
if (/^(?:CHANGE_TO_|GENERATE_USING_)/.test(keys.get('DB_PASSWORD') || '') || /(?:dubchef|12345)/i.test(keys.get('DB_PASSWORD') || '')) {
  console.warn('CẢNH BÁO: DB_PASSWORD hiện tại là mật khẩu mẫu/yếu. Với DB đã có dữ liệu, đổi mật khẩu SA trong SQL Server trước rồi cập nhật .env theo docs/BAO_MAT_VA_CHIA_SE.md.');
}
