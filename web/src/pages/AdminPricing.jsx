import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_PACKS, unitPrice, calcPrice, OUT_PER_VIDEO, MAX_VIDEOS } from '../shared/pricing.js';
import { planPrice, formatMoney } from '../shared/format.js';
import { I } from '../shared/i18n.js';
import { useI18n } from '../context/I18nContext.jsx';

const currencies = [{ code: 'VND', label: 'Việt Nam (VND)' },{ code: 'USD', label: 'Hoa Kỳ (USD)' },{ code: 'CNY', label: 'Trung Quốc (CNY)' }];
/** Bảng quản trị giá phản ánh đúng nguồn tính giá của User + Backend; hiện chỉ đọc. */
export default function AdminPricing() {
  const tr = useAdminT();
  const { L } = useI18n();
  const [currency, setCurrency] = useState(0);
  const [yearly, setYearly] = useState(false);
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Gói dịch vụ & bảng giá"} /></h1>
      <p><AdminT vi={"Tra cứu chính sách giá mà khách hàng đang xem. Giá đặt hàng được API tính lại, không dựa vào số tiền khách gửi lên."} /></p></div>
      <Link className="btn btn-sm" to="/admin/orders"><AdminT vi={"Xem đơn hàng"} /></Link></div>
    <div className="adm-policy-note" role="note"><strong><AdminT vi={"Chế độ xem cấu hình — chưa hỗ trợ sửa giá trong Admin."} /></strong>
      <p><AdminT vi={"Hiện đơn giá nằm trong"} /> <code>shared/pricing.js</code> <AdminT vi={"và bảng giá định kỳ nằm trong"} /> <code>shared/i18n.js</code><AdminT vi={". Sửa giá cần đồng bộ web, backend, mobile và kiểm thử trước khi công bố. Trang này không ghi thay đổi vào SQL Server."} /></p></div>
    <section className="panel"><div className="adm-work-head"><div><h2><AdminT vi={"Đơn giá theo video"} /></h2><p><AdminT vi={"Áp dụng cho bảng tính phí theo số lượng video và ngôn ngữ."} /></p></div></div>
      <div className="adm-toolbar"><label className="adm-field"><AdminT vi={"Tiền tệ"} /><select value={currency} onChange={e=>setCurrency(Number(e.target.value))}>
        {currencies.map((item,i)=><option key={item.code} value={i}>{tr(item.label)}</option>)}</select></label></div>
      <div className="ops-kpis"><div className="ops-kpi"><strong>{formatMoney(currency,unitPrice(currency,0))}</strong><span><AdminT vi={"Giá / video tải lên"} /></span></div>
        <div className="ops-kpi"><strong>{formatMoney(currency,unitPrice(currency,1))}</strong><span><AdminT vi={"Giá / video dịch ra"} /></span></div>
        <div className="ops-kpi"><strong>{MAX_VIDEOS}</strong><span><AdminT vi={"Tối đa video nhập mỗi lượt · tối đa"} /> {OUT_PER_VIDEO} <AdminT vi={"bản dịch/video"} /></span></div></div>
    </section>
    <section className="panel"><div className="panel-head"><h2><AdminT vi={"Gói mẫu trên trang khách hàng"} /></h2><span className="fine"><AdminT vi={"Dữ liệu trực tiếp từ công thức tính phí dùng chung"} /></span></div>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th><AdminT vi={"Gói"} /></th><th><AdminT vi={"Video tải lên"} /></th><th><AdminT vi={"Video dịch ra"} /></th><th><AdminT vi={"Giá tính theo cấu hình"} /></th><th><AdminT vi={"Đường dẫn nghiệp vụ"} /></th></tr></thead>
        <tbody>{SAMPLE_PACKS.map(pack=><tr key={pack.id}><td><strong><AdminT vi={"Gói mẫu #"} />{pack.id}</strong></td><td>{pack.uploads}</td><td>{pack.outs}</td>
          <td><strong>{formatMoney(currency,calcPrice(currency,pack.uploads,pack.outs).total)}</strong></td><td><Link to="/admin/orders"><AdminT vi={"Đơn hàng liên quan →"} /></Link></td></tr>)}</tbody></table></div>
    </section>
    <section className="panel"><div className="adm-work-head"><div><h2><AdminT vi={"Bảng giá định kỳ đang hiển thị"} /></h2><p><AdminT vi={"Đây là thông tin giới thiệu gói dịch vụ; không tự động tạo thuê bao khi khách đặt đơn số lượng video."} /></p></div>
      <div className="adm-tools"><button type="button" className="btn btn-sm" aria-pressed={!yearly} onClick={()=>setYearly(false)}><AdminT vi={"Theo tháng"} /></button>
        <button type="button" className="btn btn-sm" aria-pressed={yearly} onClick={()=>setYearly(true)}><AdminT vi={"Giá có giảm 20%"} /></button></div></div>
      <div className="adm-price-grid">{[0,1,2].map(i=><article key={i} className="adm-price-card"><h3>{I[`pl${i+1}`]?.[L] || `${tr("Gói")} ${i+1}`}</h3>
        <strong>{formatMoney(currency,planPrice(currency,i,yearly))}</strong><p><AdminT vi={"Giá trình bày trên trang Bảng giá"} /></p></article>)}</div>
    </section>
  </>;
}
