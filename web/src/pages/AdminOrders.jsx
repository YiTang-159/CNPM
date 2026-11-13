import { formatMinorMoney } from '../shared/format.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminHref } from '../utils/adminLinks.js';
import AdminCustomerContext from '../components/AdminCustomerContext.jsx';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';
import { manageApi } from '../api/workflows.js';

const PAGE=15;
const labels={pending:'Chờ thanh toán',paid:'Đã thanh toán',cancelled:'Đã hủy'};
const fmtDate=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'—';
export default function AdminOrders() {
  const [params]=useSearchParams();
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState(params.get('email')||params.get('orderId')||'');
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState(params.get('status')||'all');
  const [page,setPage]=useState(0);
  const load=useCallback(async()=>{
    try {setRows((await manageApi.orders()).orders||[]);setError('');}
    catch(e){setError('Không đọc được đơn hàng: '+(e.message||'Lỗi kết nối'));}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useAutoRefresh(load,true,30000);
  useEffect(()=>{setFilter(params.get('status')||'all');setQuery(params.get('email')||params.get('orderId')||'');setPage(0);},[params]);
  const counts=useMemo(()=>Object.fromEntries(Object.keys(labels).map(state=>[state,rows.filter(x=>x.status===state).length])),[rows]);
  const filtered=useMemo(()=>rows.filter(x=>{
    const q=query.trim().toLowerCase();
    return (filter==='all'||x.status===filter)&&(!q||`${x.id} ${x.name||''} ${x.email||''} ${x.paymentRef||''} ${x.method||''} ${x.userId||''}`.toLowerCase().includes(q));
  }).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),[rows,query,filter]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE));
  const current=Math.min(page,pages-1);
  return <>
    <div className="adm-head"><div><h1>Quản lý đơn hàng</h1><p>Tra cứu đơn theo khách hàng, số tiền và trạng thái. Đối soát giao dịch được tách thành một trang riêng để không nhầm việc quản lý đơn với xác minh thanh toán.</p></div>
      <div className="adm-tools"><Link className="btn btn-sm" to="/admin/payments">Đối soát thanh toán</Link><button type="button" className="btn btn-sm" disabled={loading} onClick={load}>Làm mới</button></div></div>
    <AdminActiveFilter params={params} base="/admin/orders"/>
    <div className="ops-kpis">
      <div className="ops-kpi"><strong>{rows.length}</strong><span>Tổng đơn trong danh sách</span></div>
      <div className="ops-kpi"><strong>{counts.pending||0}</strong><span>Chờ thanh toán</span></div>
      <div className="ops-kpi"><strong>{counts.paid||0}</strong><span>Đã thanh toán</span></div>
    </div>
    <section className="panel"><div className="adm-toolbar">
      <label className="adm-field adm-field-search">Tra cứu đơn hàng<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Mã đơn, tên, email, mã giao dịch…" /></label>
      <label className="adm-field">Trạng thái<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}><option value="all">Tất cả trạng thái</option>
        {Object.entries(labels).map(([key,name])=><option key={key} value={key}>{name}</option>)}
      </select></label></div>
      <p className="adm-table-meta">Hiện {filtered.length}/{rows.length} đơn trong phạm vi API trả về (tối đa 500 đơn gần nhất).</p>
      {error&&<p className="ops-notice" role="alert">{error}</p>}
      {loading&&<p role="status">Đang tải đơn hàng…</p>}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Liên kết tài khoản</th><th>Thành tiền</th><th>Trạng thái</th><th>Phương thức</th><th>Tham chiếu</th><th>Ngày tạo (VN)</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.slice(current*PAGE,(current+1)*PAGE).map(x=><tr key={x.id}>
          <td><strong>#{x.id}</strong></td><td>{x.name||'—'}<p className="fine">{x.email||'—'}</p></td>
          <td>{x.userId!=null?`#${x.userId}`:<span className="adm-status" data-state="pending">Chưa xác minh</span>}</td>
          <td>{formatMinorMoney(x.amount,x.currency)}</td><td><span className="adm-status" data-state={x.status}>{labels[x.status]||x.status}</span></td>
          <td>{x.method||'—'}</td><td>{x.paymentRef||'—'}</td><td>{fmtDate(x.createdAt)}</td><td><button type="button" className="btn btn-sm" onClick={()=>setSelected(x.id===selected?null:x.id)}>{selected===x.id?'Đóng':'Chi tiết'}</button></td>
        </tr>)}</tbody></table></div>
      {selected&&rows.some(row=>row.id===selected)&&<div className="adm-record-detail" role="region" aria-label={`Chi tiết đơn hàng ${selected}`}>
        {rows.filter(row=>row.id===selected).map(row=><div key={row.id}>
          <div className="adm-work-head"><div><h3>Đơn hàng #{row.id}</h3><p>{row.name||'Khách hàng'} · {row.email} · {fmtDate(row.createdAt)}</p></div>
            <Link className="btn btn-sm" to={adminHref('/admin/payments',{orderId:row.id})}>Xem đối soát →</Link></div>
          <p>Giá trị: <strong>{formatMinorMoney(row.amount,row.currency)}</strong> · Trạng thái: <strong>{labels[row.status]||row.status}</strong></p>
          <p>Mã người dùng: {row.userId??'Chưa liên kết'} · Tham chiếu: {row.paymentRef||'Chưa có'}</p>
          <AdminCustomerContext email={row.email}/>
        </div>)}
      </div>}
      {!loading&&!filtered.length&&<div className="adm-empty-state">{rows.length?'Không tìm thấy đơn hàng phù hợp bộ lọc.':'Chưa có đơn hàng.'}</div>}
      {filtered.length>PAGE&&<div className="pager"><span>{current*PAGE+1}–{Math.min(filtered.length,(current+1)*PAGE)} / {filtered.length}</span>
        <button type="button" className="btn btn-sm" disabled={current===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Trước</button>
        <button type="button" className="btn btn-sm" disabled={current>=pages-1} onClick={()=>setPage(p=>p+1)}>Sau</button></div>}
    </section>
  </>;
}
