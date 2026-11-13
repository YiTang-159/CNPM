import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';
import { formatMinorMoney } from '../shared/format.js';
import { adminHref } from '../utils/adminLinks.js';
import { paymentFlag } from '../utils/adminPayments.js';
import AdminCustomerContext from '../components/AdminCustomerContext.jsx';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';

const vnDate = v => v ? new Date(v).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}) : '—';
const flags = {all:'Tất cả',pending:'Chờ thanh toán',cancelled:'Đơn đã hủy',other:'Trạng thái khác',missing_ref:'Đã thanh toán, thiếu tham chiếu',unlinked:'Đã thanh toán, chưa liên kết tài khoản',recorded:'Đã ghi giao dịch'};
/** Đối soát các dấu hiệu ghi nhận ở CSDL: không có xác minh ngân hàng hoặc thu tiền thật. */
export default function AdminPayments() {
  const [params] = useSearchParams();
  const [rows,setRows] = useState([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [query,setQuery] = useState(params.get('email') || params.get('orderId') || '');
  const [flag,setFlag] = useState(params.get('flag')||'all');
  const [selected,setSelected] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const r=await manageApi.orders();setRows(r.orders||[]);setError(''); }
    catch(e){setError('Không tải được dữ liệu: '+(e.message||'Lỗi kết nối'));}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{setQuery(params.get('email')||params.get('orderId')||'');setFlag(params.get('flag')||'all');},[params]);
  const filtered=useMemo(()=>rows.filter(row=>{
    const q=query.trim().toLowerCase();
    return (flag==='all'||paymentFlag(row)===flag)&&(!q||`${row.id} ${row.email||''} ${row.paymentRef||''} ${row.method||''}`.toLowerCase().includes(q));
  }),[rows,query,flag]);
  const flagged=rows.filter(r=>['missing_ref','unlinked'].includes(paymentFlag(r))).length;
  return <>
    <div className="adm-head"><div><h1>Đối soát thanh toán</h1><p>Kiểm tra tình trạng ghi nhận giao dịch và phát hiện dữ liệu cần xác minh. Không xử lý thanh toán thật trong trang này.</p></div>
      <div className="adm-tools"><Link to="/admin/orders" className="btn btn-sm">Quản lý đơn hàng</Link><button type="button" className="btn btn-sm" onClick={load} disabled={loading}>Làm mới</button></div></div>
    <AdminActiveFilter params={params} base="/admin/payments"/>
    <div className="adm-policy-note"><strong>Thanh toán mô phỏng</strong><p>Trạng thái <code>paid</code> và mã tham chiếu <code>success</code> chỉ phản ánh dữ liệu hệ thống; không có đối soát sao kê ngân hàng. Không được dùng những số liệu này làm bằng chứng đã nhận tiền thật.</p></div>
    <div className="ops-kpis"><div className="ops-kpi"><strong>{rows.length}</strong><span>Đơn trong danh sách API</span></div>
      <div className="ops-kpi"><strong>{rows.filter(x=>x.status==='paid').length}</strong><span>Đơn đánh dấu paid</span></div>
      <div className="ops-kpi"><strong>{flagged}</strong><span>Cần rà soát dữ liệu</span></div></div>
    <section className="panel"><div className="adm-toolbar">
      <label className="adm-field adm-field-search">Tìm mã đơn, email, mã tham chiếu<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ví dụ: #4 hoặc email khách" /></label>
      <label className="adm-field">Tình trạng kiểm tra<select value={flag} onChange={e=>setFlag(e.target.value)}>{Object.entries(flags).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    </div><p className="adm-table-meta">{filtered.length}/{rows.length} bản ghi · API trả về tối đa 500 đơn gần nhất.</p>
      {error&&<p role="alert" className="ops-notice">{error}</p>}{loading&&<p role="status">Đang tải dữ liệu…</p>}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Đơn</th><th>Khách hàng</th><th>Phương thức</th><th>Tham chiếu</th><th>Giá trị</th><th>Rà soát</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.map(row=><tr key={row.id}><td>#{row.id}<p className="fine">{vnDate(row.createdAt)}</p></td><td>{row.email}</td>
          <td>{row.method||'—'}</td><td>{row.paymentRef||'—'}</td><td>{formatMinorMoney(row.amount,row.currency)}</td>
          <td><span className="adm-status" data-state={paymentFlag(row)==='recorded'?'active':'pending'}>{flags[paymentFlag(row)]}</span></td>
          <td><button className="btn btn-sm" type="button" onClick={()=>setSelected(row.id===selected?null:row.id)}>{selected===row.id?'Đóng':'Chi tiết'}</button></td></tr>)}</tbody></table></div>
      {!loading&&!filtered.length&&<div className="adm-empty-state">Không có giao dịch phù hợp bộ lọc.</div>}
      {selected&&rows.some(r=>r.id===selected)&&<div className="adm-record-detail" role="region" aria-label={`Chi tiết đối soát đơn ${selected}`}>
        {rows.filter(r=>r.id===selected).map(row=><div key={row.id}><h3>Đơn hàng #{row.id}</h3>
          <p>Trạng thái đơn: <strong>{row.status}</strong> · Mã tài khoản: <strong>{row.userId ?? 'Chưa liên kết'}</strong></p>
          <p>Mã tham chiếu: <strong>{row.paymentRef||'Chưa ghi nhận'}</strong> · Phương thức: {row.method||'—'}</p>
          <AdminCustomerContext email={row.email}/><Link className="btn btn-sm" to={adminHref('/admin/orders',{orderId:row.id})}>Xem đơn gốc</Link></div>)}
      </div>}
    </section>
  </>;
}
