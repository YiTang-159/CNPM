import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { formatMinorMoney } from '../shared/format.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminHref } from '../utils/adminLinks.js';
import AdminCustomerContext from '../components/AdminCustomerContext.jsx';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';
import { manageApi } from '../api/workflows.js';
import LegacyOwnerReview from '../components/LegacyOwnerReview.jsx';

const PAGE=15;
const labels={pending:'Chờ thanh toán',paid:'Đã thanh toán',cancelled:'Đã hủy'};
const fmtDate=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'—';
export default function AdminOrders() {
  const tr = useAdminT();
  const [params]=useSearchParams();
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState(params.get('email')||params.get('orderId')||'');
  const [selected,setSelected]=useState(null);
  const [legacyInput,setLegacyInput]=useState('');
  const [legacyLookupId,setLegacyLookupId]=useState(null);
  const [legacyInputError,setLegacyInputError]=useState('');
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
    <div className="adm-head"><div><h1><AdminT vi={"Quản lý đơn hàng"} /></h1><p><AdminT vi={"Tra cứu đơn theo khách hàng, số tiền và trạng thái. Đối soát giao dịch được tách thành một trang riêng để không nhầm việc quản lý đơn với xác minh thanh toán."} /></p></div>
      <div className="adm-tools"><Link className="btn btn-sm" to="/admin/payments"><AdminT vi={"Đối soát thanh toán"} /></Link><button type="button" className="btn btn-sm" disabled={loading} onClick={load}><AdminT vi={"Làm mới"} /></button></div></div>
    <AdminActiveFilter params={params} base="/admin/orders"/>
    <section className="panel" style={{padding:16,marginBottom:16}}>
      <h2><AdminT vi="Tra cứu đơn hàng cũ theo mã" /></h2>
      <p className="fine"><AdminT vi="Danh sách bên dưới chỉ hiển thị 500 đơn gần nhất. Nhập mã đơn để xác minh đơn cũ không còn xuất hiện trong danh sách." /></p>
      <form className="adm-toolbar" onSubmit={event=>{
        event.preventDefault();
        const id=Number(legacyInput);
        if(!/^[1-9]\d*$/.test(legacyInput.trim())||!Number.isSafeInteger(id)||id>2147483647){
          setLegacyInputError('Mã đơn không hợp lệ');setLegacyLookupId(null);return;
        }
        setLegacyInputError('');setLegacyLookupId(id);
      }}>
        <label className="adm-field"><AdminT vi="Mã đơn hàng cần xác minh" />
          <input type="text" inputMode="numeric" value={legacyInput} onChange={event=>setLegacyInput(event.target.value)} placeholder="Ví dụ: 123" />
        </label>
        <button className="btn btn-primary" type="submit"><AdminT vi="Tra cứu chủ đơn" /></button>
        {legacyLookupId!=null&&<button className="btn btn-sm" type="button" onClick={()=>setLegacyLookupId(null)}><AdminT vi="Đóng" /></button>}
      </form>
      {legacyInputError&&<p role="alert" className="ops-notice">{tr(legacyInputError)}</p>}
      {legacyLookupId!=null&&<LegacyOwnerReview key={legacyLookupId} order={{id:legacyLookupId}} onLinked={async()=>{setLegacyLookupId(null);await load();}}/>}
    </section>
    <div className="ops-kpis">
      <div className="ops-kpi"><strong>{rows.length}</strong><span><AdminT vi={"Tổng đơn trong danh sách"} /></span></div>
      <div className="ops-kpi"><strong>{counts.pending||0}</strong><span><AdminT vi={"Chờ thanh toán"} /></span></div>
      <div className="ops-kpi"><strong>{counts.paid||0}</strong><span><AdminT vi={"Đã thanh toán"} /></span></div>
    </div>
    <section className="panel"><div className="adm-toolbar">
      <label className="adm-field adm-field-search"><AdminT vi={"Tra cứu đơn hàng"} /><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder={tr("Mã đơn, tên, email, mã giao dịch…")} /></label>
      <label className="adm-field"><AdminT vi={"Trạng thái"} /><select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}><option value="all">{tr("Tất cả trạng thái")}</option>
        {Object.entries(labels).map(([key,name])=><option key={key} value={key}>{tr(name)}</option>)}
      </select></label></div>
      <p className="adm-table-meta"><AdminT vi={"Hiện"} /> {filtered.length}/{rows.length} <AdminT vi={"đơn trong phạm vi API trả về (tối đa 500 đơn gần nhất)."} /></p>
      {error&&<p className="ops-notice" role="alert">{tr(error)}</p>}
      {loading&&<p role="status"><AdminT vi={"Đang tải đơn hàng…"} /></p>}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th><AdminT vi={"Mã đơn"} /></th><th><AdminT vi={"Khách hàng"} /></th><th><AdminT vi={"Liên kết tài khoản"} /></th><th><AdminT vi={"Thành tiền"} /></th><th><AdminT vi={"Trạng thái"} /></th><th><AdminT vi={"Phương thức"} /></th><th><AdminT vi={"Tham chiếu"} /></th><th><AdminT vi={"Ngày tạo (VN)"} /></th><th><AdminT vi={"Thao tác"} /></th></tr></thead>
        <tbody>{filtered.slice(current*PAGE,(current+1)*PAGE).map(x=><tr key={x.id}>
          <td><strong>#{x.id}</strong></td><td>{x.name||'—'}<p className="fine">{x.email||'—'}</p></td>
          <td>{x.userId!=null?`#${x.userId}`:<span className="adm-status" data-state="pending"><AdminT vi={"Chưa xác minh"} /></span>}</td>
          <td>{formatMinorMoney(x.amount,x.currency)}</td><td><span className="adm-status" data-state={x.status}>{tr(labels[x.status]||x.status)}</span></td>
          <td>{x.method||'—'}</td><td>{x.paymentRef||'—'}</td><td>{fmtDate(x.createdAt)}</td><td><button type="button" className="btn btn-sm" onClick={()=>setSelected(x.id===selected?null:x.id)}>{tr(selected===x.id?'Đóng':'Chi tiết')}</button></td>
        </tr>)}</tbody></table></div>
      {selected&&rows.some(row=>row.id===selected)&&<div className="adm-record-detail" role="region" aria-label={`${tr("Chi tiết đơn hàng")} ${selected}`}>
        {rows.filter(row=>row.id===selected).map(row=><div key={row.id}>
          <div className="adm-work-head"><div><h3><AdminT vi={"Đơn hàng #"} />{row.id}</h3><p>{row.name||tr('Khách hàng')} · {row.email} · {fmtDate(row.createdAt)}</p></div>
            <Link className="btn btn-sm" to={adminHref('/admin/payments',{orderId:row.id})}><AdminT vi={"Xem đối soát →"} /></Link></div>
          <p><AdminT vi={"Giá trị:"} /> <strong>{formatMinorMoney(row.amount,row.currency)}</strong> <AdminT vi={"· Trạng thái:"} /> <strong>{tr(labels[row.status]||row.status)}</strong></p>
          <p><AdminT vi={"Mã người dùng:"} /> {row.userId??tr('Chưa liên kết')} <AdminT vi={"· Tham chiếu:"} /> {row.paymentRef||tr('Chưa có')}</p>
          <AdminCustomerContext email={row.email}/>
          {row.userId==null&&<LegacyOwnerReview order={row} onLinked={async()=>{setSelected(null);await load();}}/>}
        </div>)}
      </div>}
      {!loading&&!filtered.length&&<div className="adm-empty-state">{tr(rows.length?'Không tìm thấy đơn hàng phù hợp bộ lọc.':'Chưa có đơn hàng.')}</div>}
      {filtered.length>PAGE&&<div className="pager"><span>{current*PAGE+1}–{Math.min(filtered.length,(current+1)*PAGE)} / {filtered.length}</span>
        <button type="button" className="btn btn-sm" disabled={current===0} onClick={()=>setPage(p=>Math.max(0,p-1))}><AdminT vi={"Trước"} /></button>
        <button type="button" className="btn btn-sm" disabled={current>=pages-1} onClick={()=>setPage(p=>p+1)}>{tr('Sau')}</button></div>}
    </section>
  </>;
}
