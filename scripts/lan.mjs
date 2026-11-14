import { networkInterfaces } from 'node:os';
import { spawnSync } from 'node:child_process';

const interfaces=Object.values(networkInterfaces()).flat();
const ip=interfaces.find(n=>n && n.family==='IPv4' && !n.internal &&
  !n.address.startsWith('169.254.') && !n.address.startsWith('172.17.'))?.address;
if (!ip) { console.error('Không tìm thấy IP LAN. Kết nối Wi-Fi riêng trước khi chạy.'); process.exit(1); }
const env={...process.env,WEB_BIND_ADDRESS:'0.0.0.0',API_BIND_ADDRESS:'127.0.0.1',DB_BIND_ADDRESS:'127.0.0.1'};
const run=spawnSync('docker',['compose','up','-d','--build'],{env,stdio:'inherit'});
if (run.error || run.status !== 0) process.exit(run.status || 1);
const url=`http://${ip}:5173/#/guest`;
console.log('\nMở trên điện thoại cùng Wi-Fi riêng: '+url);
console.log('CHỈ cổng web 5173 được mở LAN. API 3000 và SQL 1433 vẫn ở loopback.');
console.log('Không dùng trên Wi-Fi công cộng; QUÉT QR LAN chỉ dùng để thử, không dùng thay HTTPS public.');
const qr=spawnSync('python',['scripts/lan-qr.py',url],{stdio:'inherit'});
if(qr.error || qr.status !== 0) console.log('Không tạo được QR terminal. Mở URL phía trên trực tiếp.');
