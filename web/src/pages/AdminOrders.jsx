import { formatMinorMoney } from '../shared/format.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';

const PAGE=15;
const labels={pending:'Chờ thanh toán',paid:'Đã thanh toán',cancelled:'Đã hủy'};
const fmtDate=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'—';
export default function AdminOrders() {
  const [params]=useSearchParams();
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState(params.get('status')||'all');
  const [page,setPage]=useState(0);
  const load=useCallback(async()=>{
    try {setRows((await manageApi.orders()).orders||[]);setError('');}
    catch(e){setError('Không đọc được đơn hàng: '+(e.message||'Lỗi kết nối'));}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useAutoRefresh(load,true,30000);
  useEffect(()=>{setFilter(params.get('status')||'all');setPage(0);},[params]);
  const counts=useMemo(()=>Object.fromEntries(Object.keys(labels).map(state=>[state,rows.filter(x=>x.status===state).length])),[rows]);
  const filtered=useMemo(()=>rows.filter(x=>{
    const q=query.trim().toLowerCase();
    return (filter==='all'||x.status===filter)&&(!q||`${x.id} ${x.name||''} ${x.email||''} ${x.paymentRef||''} ${x.method||''}`.toLowerCase().includes(q));
  }).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),[rows,query,filter]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE));
  const current=Math.min(page,pages-1);
  return <>
    <div className="adm-head"><div><h1>Đơn hàng & thanh toán</h1><p>Tra cứu trạng thái đơn, phương thức và mã giao dịch. Thông tin được đọc từ SQL Server; trang này không tự xác nhận thanh toán.</p></div>
      <button type="button" className="btn btn-sm" disabled={loading} onClick={load}>Làm mới</button></div>
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
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thành tiền</th><th>Trạng thái</th><th>Phương thức</th><th>Tham chiếu</th><th>Ngày tạo (VN)</th></tr></thead>
        <tbody>{filtered.slice(current*PAGE,(current+1)*PAGE).map(x=><tr key={x.id}>
          <td><strong>#{x.id}</strong></td><td>{x.name||'—'}<p className="fine">{x.email||'—'}</p></td>
          <td>{formatMinorMoney(x.amount,x.currency)}</td><td><span className="adm-status" data-state={x.status}>{labels[x.status]||x.status}</span></td>
          <td>{x.method||'—'}</td><td>{x.paymentRef||'—'}</td><td>{fmtDate(x.createdAt)}</td>
        </tr>)}</tbody></table></div>
      {!loading&&!filtered.length&&<div className="adm-empty-state">{rows.length?'Không tìm thấy đơn hàng phù hợp bộ lọc.':'Chưa có đơn hàng.'}</div>}
      {filtered.length>PAGE&&<div className="pager"><span>{current*PAGE+1}–{Math.min(filtered.length,(current+1)*PAGE)} / {filtered.length}</span>
        <button type="button" className="btn btn-sm" disabled={current===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Trước</button>
        <button type="button" className="btn btn-sm" disabled={current>=pages-1} onClick={()=>setPage(p=>p+1)}>Sau</button></div>}
    </section>
  </>;
}
