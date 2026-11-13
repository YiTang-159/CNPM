import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_PACKS, unitPrice, calcPrice, OUT_PER_VIDEO, MAX_VIDEOS } from '../shared/pricing.js';
import { planPrice, formatMoney } from '../shared/format.js';
import { I } from '../shared/i18n.js';

const currencies = [{ code: 'VND', label: 'Việt Nam (VND)' },{ code: 'USD', label: 'Hoa Kỳ (USD)' },{ code: 'CNY', label: 'Trung Quốc (CNY)' }];
/** Bảng quản trị giá phản ánh đúng nguồn tính giá của User + Backend; hiện chỉ đọc. */
export default function AdminPricing() {
  const [currency, setCurrency] = useState(0);
  const [yearly, setYearly] = useState(false);
  return <>
    <div className="adm-head"><div><h1>Gói dịch vụ & bảng giá</h1>
      <p>Tra cứu chính sách giá mà khách hàng đang xem. Giá đặt hàng được API tính lại, không dựa vào số tiền khách gửi lên.</p></div>
      <Link className="btn btn-sm" to="/admin/orders">Xem đơn hàng</Link></div>
    <div className="adm-policy-note" role="note"><strong>Chế độ xem cấu hình — chưa hỗ trợ sửa giá trong Admin.</strong>
      <p>Hiện đơn giá nằm trong <code>shared/pricing.js</code> và bảng giá định kỳ nằm trong <code>shared/i18n.js</code>. Sửa giá cần đồng bộ web, backend, mobile và kiểm thử trước khi công bố. Trang này không ghi thay đổi vào SQL Server.</p></div>
    <section className="panel"><div className="adm-work-head"><div><h2>Đơn giá theo video</h2><p>Áp dụng cho bảng tính phí theo số lượng video và ngôn ngữ.</p></div></div>
      <div className="adm-toolbar"><label className="adm-field">Tiền tệ<select value={currency} onChange={e=>setCurrency(Number(e.target.value))}>
        {currencies.map((item,i)=><option key={item.code} value={i}>{item.label}</option>)}</select></label></div>
      <div className="ops-kpis"><div className="ops-kpi"><strong>{formatMoney(currency,unitPrice(currency,0))}</strong><span>Giá / video tải lên</span></div>
        <div className="ops-kpi"><strong>{formatMoney(currency,unitPrice(currency,1))}</strong><span>Giá / video dịch ra</span></div>
        <div className="ops-kpi"><strong>{MAX_VIDEOS}</strong><span>Tối đa video nhập mỗi lượt · tối đa {OUT_PER_VIDEO} bản dịch/video</span></div></div>
    </section>
    <section className="panel"><div className="panel-head"><h2>Gói mẫu trên trang khách hàng</h2><span className="fine">Dữ liệu trực tiếp từ công thức tính phí dùng chung</span></div>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Gói</th><th>Video tải lên</th><th>Video dịch ra</th><th>Giá tính theo cấu hình</th><th>Đường dẫn nghiệp vụ</th></tr></thead>
        <tbody>{SAMPLE_PACKS.map(pack=><tr key={pack.id}><td><strong>Gói mẫu #{pack.id}</strong></td><td>{pack.uploads}</td><td>{pack.outs}</td>
          <td><strong>{formatMoney(currency,calcPrice(currency,pack.uploads,pack.outs).total)}</strong></td><td><Link to="/admin/orders">Đơn hàng liên quan →</Link></td></tr>)}</tbody></table></div>
    </section>
    <section className="panel"><div className="adm-work-head"><div><h2>Bảng giá định kỳ đang hiển thị</h2><p>Đây là thông tin giới thiệu gói dịch vụ; không tự động tạo thuê bao khi khách đặt đơn số lượng video.</p></div>
      <div className="adm-tools"><button type="button" className="btn btn-sm" aria-pressed={!yearly} onClick={()=>setYearly(false)}>Theo tháng</button>
        <button type="button" className="btn btn-sm" aria-pressed={yearly} onClick={()=>setYearly(true)}>Giá có giảm 20%</button></div></div>
      <div className="adm-price-grid">{[0,1,2].map(i=><article key={i} className="adm-price-card"><h3>{I[`pl${i+1}`]?.[currency] || `Gói ${i+1}`}</h3>
        <strong>{formatMoney(currency,planPrice(currency,i,yearly))}</strong><p>Giá trình bày trên trang Bảng giá</p></article>)}</div>
    </section>
  </>;
}
