// Dựng báo cáo HTML (A4, in được ra PDF) từ dữ liệu các view schema bc. Không truy cập CSDL.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : esc(v));

function table(rows, empty) {
  if (!rows.length) return `<p class="empty">${esc(empty)}</p>`;
  const cols = Object.keys(rows[0]);
  const head = cols.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = rows.map((r) => `<tr>${cols.map((c) => `<td class="${typeof r[c] === 'number' ? 'n' : ''}">${r[c] === null ? '<span class="nul">—</span>' : fmt(r[c])}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function bars(rows, labelKey, valueKey) {
  if (!rows.length) return '<p class="empty">Chưa có dữ liệu.</p>';
  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
  return `<div class="bars">${rows.map((r) => {
    const v = Number(r[valueKey]) || 0;
    return `<div class="bar"><span class="bl">${esc(r[labelKey])}</span><span class="bt"><i style="width:${Math.max(2, (v / max) * 100)}%"></i></span><b>${v.toLocaleString('vi-VN')}</b></div>`;
  }).join('')}</div>`;
}

export function renderReport(d) {
  const groups = [];
  for (const r of d.tongHop) {
    let g = groups.find((x) => x.name === r['Nhóm']);
    if (!g) groups.push((g = { name: r['Nhóm'], items: [] }));
    g.items.push(r);
  }
  const issues = d.toanVen.length;
  const kpis = groups.map((g) => `<section class="grp"><h3>${esc(g.name)}</h3>${g.items.map((i) => `<div class="kpi"><span>${esc(i['Chỉ số'])}</span><b>${Number(i['Giá trị']).toLocaleString('vi-VN')}</b></div>`).join('')}</section>`).join('');
  const dateOnly = (v) => (v instanceof Date ? v.toISOString().slice(0, 10).split('-').reverse().join('/') : v);
  const withDates = (rows) => rows.map((r) => ({ ...r, ...(r['Ngày'] ? { 'Ngày': dateOnly(r['Ngày']) } : {}) }));
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Báo cáo quản trị Dubchef</title>
<style>
:root{--ink:#1f2937;--mut:#6b7280;--line:#e5e7eb;--acc:#0f4c81;--bg:#f3f4f6;--card:#fff;--ok:#047857;--bad:#b91c1c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 "Segoe UI",system-ui,Arial,sans-serif}
.page{max-width:900px;margin:24px auto;background:var(--card);padding:40px 44px;box-shadow:0 1px 8px rgba(0,0,0,.08)}
header{border-bottom:3px solid var(--acc);padding-bottom:14px;margin-bottom:22px}
h1{margin:0;font-size:24px;color:var(--acc)}header p{margin:4px 0 0;color:var(--mut);font-size:13px}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:var(--acc);border-left:4px solid var(--acc);padding-left:10px;margin:28px 0 12px}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
.grp{border:1px solid var(--line);border-radius:8px;padding:12px 14px}.grp h3{margin:0 0 8px;font-size:13px;color:var(--mut);text-transform:uppercase}
.kpi{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px dashed var(--line)}.kpi:first-of-type{border-top:0}
.kpi span{color:var(--ink)}.kpi b{font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#eef2f7;text-align:left;font-weight:600}
th,td{padding:6px 9px;border-bottom:1px solid var(--line)}td.n{text-align:right;font-variant-numeric:tabular-nums}.nul{color:var(--mut)}
.empty{color:var(--mut);font-style:italic;margin:4px 0}
.status{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:600;font-size:13px}.ok{background:#d1fae5;color:var(--ok)}.bad{background:#fee2e2;color:var(--bad)}
.bars .bar{display:grid;grid-template-columns:90px 1fr 50px;gap:10px;align-items:center;margin:4px 0}.bt{background:#eef2f7;border-radius:4px;height:14px;overflow:hidden}.bt i{display:block;height:100%;background:var(--acc)}.bars b{text-align:right}
footer{margin-top:30px;padding-top:10px;border-top:1px solid var(--line);color:var(--mut);font-size:12px;display:flex;justify-content:space-between}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;max-width:none;padding:0}h2{break-after:avoid}table,.grp{break-inside:avoid}@page{size:A4;margin:16mm}}
</style></head><body><main class="page">
<header><h1>Báo cáo quản trị Dubchef</h1><p>Lập lúc ${esc(d.thoiDiem)} (giờ Việt Nam) · Cơ sở dữ liệu ${esc(d.csdl)}</p></header>
<h2>1. Tổng hợp</h2><div class="kgrid">${kpis}</div>
<h2>2. Kiểm tra toàn vẹn dữ liệu</h2>${issues ? `<p><span class="status bad">Phát hiện ${issues} vấn đề</span></p>${table(d.toanVen, '')}` : '<p><span class="status ok">Đạt: không phát hiện bất thường</span></p>'}
<h2>3. Người dùng</h2>${table(d.nguoiDung, 'Chưa có người dùng.')}
<h2>4. Video gần đây</h2>${table(d.video, 'Chưa có video.')}
<h2>5. Đơn hàng gần đây</h2>${table(d.donHang, 'Chưa có đơn hàng.')}
<h2>6. Doanh thu theo ngày</h2>${table(withDates(d.doanhThu), 'Chưa có giao dịch thành công.')}
<h2>7. Lượt quét mã QR theo ngày</h2>${bars(withDates(d.qr).map((r) => ({ ...r, 'Ngày': String(r['Ngày']) })), 'Ngày', 'Lượt quét')}
<h2>8. Phản hồi chưa xử lý</h2>${table(d.phanHoi, 'Không có phản hồi tồn đọng.')}
<footer><span>Dubchef · Báo cáo tự động từ SQL Server</span><span>Chỉ đọc dữ liệu, không thay đổi CSDL</span></footer>
</main></body></html>`;
}
