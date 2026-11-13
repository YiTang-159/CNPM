import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useSearchParams } from 'react-router-dom';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { manageApi } from '../api/workflows.js';
import { Link } from 'react-router-dom';
import { adminHref } from '../utils/adminLinks.js';
import AdminCustomerContext from '../components/AdminCustomerContext.jsx';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';
const states = {new:'Mới', reviewing:'Đang xử lý', resolved:'Đã giải quyết'};
const priorities = {low:'Thấp',normal:'Bình thường',high:'Cao'};
export default function AdminFeedback() {
  const tr = useAdminT();
  const [params]=useSearchParams();
  const [items,setItems] = useState([]);
  const [edits,setEdits] = useState({});
  const [filter,setFilter] = useState({q:params.get('email')||'',status:params.get('status')||'all',priority:'all'});
  const [message,setMessage] = useState('');
  const [histories,setHistories] = useState({});
  const [busy,setBusy] = useState('');
  const load = useCallback(async()=>{
    try {
      const rows=(await manageApi.feedback()).feedback||[];
      setItems(rows);
      setEdits(Object.fromEntries(rows.map(r=>[r.id,{status:r.status,priority:r.priority||'normal',reply:r.reply||''}])));
      setMessage('');
    } catch(e) { setMessage('Không lấy được phản hồi từ SQL Server: '+e.message); }
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{setFilter(old=>({...old,status:params.get('status')||'all',q:params.get('email')||''}));},[params]);
  const filtered=useMemo(()=>items.filter(r=>{
    const q=filter.q.trim().toLowerCase();
    return (filter.status==='all'||r.status===filter.status) &&
      (filter.priority==='all'||(r.priority||'normal')===filter.priority) &&
      (!q||`${r.name} ${r.email} ${r.message} ${r.id}`.toLowerCase().includes(q));
  }),[items,filter]);
  const counts=Object.fromEntries(Object.keys(states).map(s=>[s,items.filter(x=>x.status===s).length]));
  const change=(id,key,value)=>setEdits(old=>({...old,[id]:{...old[id],[key]:value}}));
  async function save(item) {
    const v=edits[item.id];
    if (v.status==='resolved'&&!v.reply.trim()) {setMessage('Cần nhập câu trả lời trước khi chuyển sang Đã giải quyết.');return;}
    setBusy(item.id);
    try {
      await manageApi.updateFeedback(item.id,v);
      await load(); setMessage(`Đã lưu và ghi lịch sử yêu cầu ${item.id}.`);
    } catch(e) {setMessage('Không lưu được: '+e.message);}
    finally {setBusy('');}
  }
  
async function toggleHistory(id) {
  if (histories[id]) {
    setHistories(v => ({
      ...v,
      [id]: null
    }));
    return;
  }

  try {
    const data = await manageApi.feedbackHistory(id);

    setHistories(v => ({
      ...v,
      [id]: data.history || []
    }));
  } catch (e) {
    setMessage('Không đọc được lịch sử: ' + e.message);
  }
}
  useAutoRefresh(load, !busy && !items.some(r => { const e=edits[r.id];return e && (e.reply!==(r.reply||'') || e.status!==r.status || e.priority!==(r.priority||'normal')); }));
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Trung tâm phản hồi & chăm sóc khách hàng"} /></h1>
      <p><AdminT vi={"Quản lý cả phản hồi tài khoản và liên hệ khách. Phân loại ưu tiên, theo dõi trạng thái, trả lời và ghi lịch sử xử lý vào SQL Server."} /></p>
    </div><button className="btn btn-sm" onClick={load}><AdminT vi={"Làm mới"} /></button></div>
    <AdminActiveFilter params={params} base="/admin/feedback"/>
    <div className="ops-kpis">{Object.entries(states).map(([s,label])=><div className="ops-kpi" key={s}>
      <strong>{counts[s]||0}</strong><span>{tr(label)}</span></div>)}</div>
    <section className="panel ops-panel">
      <div className="ops-toolbar"><label><AdminT vi={"Tìm phản hồi"} /><input value={filter.q} placeholder={tr("Tên, email, nội dung")} onChange={e=>setFilter(v=>({...v,q:e.target.value}))}/></label>
        <label><AdminT vi={"Trạng thái"} /><select value={filter.status} onChange={e=>setFilter(v=>({...v,status:e.target.value}))}><option value="all">{tr("Tất cả")}</option>
          {Object.entries(states).map(([s,n])=><option value={s} key={s}>{tr(n)}</option>)}</select></label>
        <label><AdminT vi={"Ưu tiên"} /><select value={filter.priority} onChange={e=>setFilter(v=>({...v,priority:e.target.value}))}><option value="all">{tr("Tất cả")}</option>
          {Object.entries(priorities).map(([s,n])=><option key={s} value={s}>{tr(n)}</option>)}</select></label></div>
      <p className="fine">{filtered.length}/{items.length} <AdminT vi={"yêu cầu · Chuyển Đã giải quyết bắt buộc có câu trả lời · Thao tác lưu có ghi người xử lý và lịch sử."} /></p>
      {message?<p role="status" className="ops-notice">{tr(message)}</p>:null}
      <div className="ops-feedback-grid">{filtered.map(item=><article className="ops-feedback-card" key={item.id}>
        <div className="ops-head"><div><strong>{item.name} <span className="fine">({item.id})</span></strong>
          <p className="fine">{item.email} · {tr(item.source==='contact'?'Trang liên hệ':'Tài khoản')}
            {item.videoId?` · Video #${item.videoId}`:''}</p>
            {item.videoId&&<Link className="adm-inline-link" to={adminHref('/admin/videos',{videoId:item.videoId})}><AdminT vi={"Mở video liên quan →"} /></Link>}</div>
          <span className={`ops-state ops-state-${item.status}`}>{tr(states[item.status]||item.status)}</span></div>
        <p className="ops-message">{item.message}</p>
        <p className="fine"><AdminT vi={"Gửi:"} /> {new Date(item.createdAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'})}{item.assignedTo?` · ${tr('Xử lý bởi')} ${item.assignedTo}`:''}</p>
        <div className="ops-toolbar"><label><AdminT vi={"Trạng thái"} /><select aria-label={`${tr("Trạng thái")} ${item.id}`} value={edits[item.id]?.status||item.status}
          onChange={e=>change(item.id,'status',e.target.value)}>{Object.entries(states).map(([s,n])=><option key={s} value={s}>{tr(n)}</option>)}</select></label>
          <label><AdminT vi={"Độ ưu tiên"} /><select aria-label={`${tr("Ưu tiên")} ${item.id}`} value={edits[item.id]?.priority||'normal'}
          onChange={e=>change(item.id,'priority',e.target.value)}>{Object.entries(priorities).map(([s,n])=><option key={s} value={s}>{tr(n)}</option>)}</select></label></div>
        <label className="ops-reply"><AdminT vi={"Trả lời của Admin"} /><textarea rows={3} maxLength={2000} value={edits[item.id]?.reply||''}
          onChange={e=>change(item.id,'reply',e.target.value)} placeholder={tr("Nhập phản hồi để gửi lại trong tài khoản khách hàng…")}/></label>
        <AdminCustomerContext email={item.email} compact/>
        <div className="adm-actions ops-gap"><button className="btn btn-primary" disabled={busy===item.id} onClick={()=>save(item)}>
          {tr(busy===item.id?'Đang lưu…':'Lưu xử lý')}</button>
          <button className="btn" onClick={()=>toggleHistory(item.id)}><AdminT vi={"Lịch sử"} /> {histories[item.id]?'▲':'▼'}</button></div>
        {histories[item.id]?<div className="ops-audit"><b><AdminT vi={"Lịch sử xử lý"} /></b>
          {histories[item.id].length?histories[item.id].map(h=><p key={h.id} className="fine">
            {new Date(h.changedAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'})} · {h.editor} · {tr(states[h.status])} · {tr(priorities[h.priority])}
          </p>):<p className="fine"><AdminT vi={"Chưa có lịch sử cập nhật."} /></p>}</div>:null}
      </article>)}</div>
      {!filtered.length?<p className="fine"><AdminT vi={"Không có phản hồi phù hợp. Phản hồi mới của khách sẽ xuất hiện tại đây."} /></p>:null}
    </section>
  </>;
}
