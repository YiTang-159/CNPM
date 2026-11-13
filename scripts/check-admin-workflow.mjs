// Test không cần cài node_modules: chỉ kiểm tra điều hướng và luật lọc thuần.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMIN_GROUPS, ADMIN_LINKS, currentAdminLink } from '../web/src/components/AdminNavigation.js';
import { adminHref, matchesText } from '../web/src/utils/adminLinks.js';
import { paymentFlag } from '../web/src/utils/adminPayments.js';
import { calcPrice, SAMPLE_PACKS } from '../shared/pricing.js';
import { priceOrder } from '../server/src/orders.js';

const app = readFileSync(new URL('../web/src/App.jsx', import.meta.url), 'utf8');
const routeChildren = [...app.matchAll(/<Route path="([^"/]+)"/g)].map(x => '/admin/' + x[1]);
const routes = new Set(['/admin', ...routeChildren]);
assert.equal(new Set(ADMIN_LINKS.map(x=>x.to)).size, ADMIN_LINKS.length, 'Menu bị trùng đường dẫn');
assert(ADMIN_GROUPS.length >= 4, 'Cần chia nhóm theo nghiệp vụ');
for (const link of ADMIN_LINKS) assert(routes.has(link.to), `Menu ${link.name} không có route ${link.to}`);
assert.equal(currentAdminLink('/admin/pricing').name, 'Gói dịch vụ & bảng giá');
assert.equal(currentAdminLink('/admin/payments').name, 'Đối soát thanh toán');
assert.equal(currentAdminLink('/admin').name, 'Thống kê truy cập');
assert.equal(adminHref('/admin/orders',{email:'customer+1@example.com',status:'all'}), '/admin/orders?email=customer%2B1%40example.com');
assert(matchesText('NGUYỄN THỊ AN', 'thị an'));
assert.equal(paymentFlag({status:'paid',paymentRef:'QR-123',userId:1}),'recorded');
assert.equal(paymentFlag({status:'paid',paymentRef:null,userId:1}),'missing_ref');
assert.equal(paymentFlag({status:'paid',paymentRef:'QR-123',userId:null}),'unlinked');
assert.equal(paymentFlag({status:'pending',paymentRef:null,userId:1}),'pending');
assert.equal(paymentFlag({status:'cancelled',paymentRef:null,userId:1}),'cancelled');
for(let L=0;L<3;L++) for(const pack of SAMPLE_PACKS){
  const checkout = priceOrder({L,uploads:pack.uploads,outs:pack.outs});
  const divisor = L === 0 ? 1 : 100;
  assert.equal(checkout.amountMinor,Math.round(calcPrice(L,pack.uploads,pack.outs).total*divisor));
}
console.log(`OK: ${ADMIN_GROUPS.length} nhóm, ${ADMIN_LINKS.length} menu có route; lọc URL, đối soát và giá được kiểm tra.`);
