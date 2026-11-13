import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import SavedVideo from '../components/SavedVideo.jsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import AdminCustomerContext from '../components/AdminCustomerContext.jsx';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';
import { adminHref } from '../utils/adminLinks.js';

const STATUS={uploaded:'Đã tải lên',processing:'Đang xử lý',completed:'Hoàn thành',failed:'Thất bại',hidden:'Đã ẩn'};
const fmtDate=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'—';
export default function AdminVideos() {
  const tr = useAdminT();
  const [params]=useSearchParams();
  const [videos,setVideos]=useState([]);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(params.get('email')||params.get('videoId')||'');
  const [contextVideo,setContextVideo]=useState(null);
  const [filter,setFilter]=useState(params.get('status')||'all');
  const [viewing,setViewing]=useState(null);
  const [pending,setPending]=useState({});
  const [busy,setBusy]=useState(null);
  const load=useCallback(async()=>{
    try {setVideos((await manageApi.videos()).videos||[]);setMessage('');}
    catch(err) {setMessage('Không đọc được SQL Server: '+err.message);}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useAutoRefresh(load,!busy&&!Object.keys(pending).length,30000);
  useEffect(()=>{setFilter(params.get('status')||'all');setSearch(params.get('email')||params.get('videoId')||'');},[params]);
  const shown=useMemo(()=>videos.filter(v=>(filter==='all'||v.status===filter)&&
    `${v.id} ${v.title||''} ${v.userEmail||''} ${v.fileName||''}`.toLowerCase().includes(search.toLowerCase().trim())),[videos,search,filter]);
  async function act(id,run) {
    setBusy(id);
    try {await run();setPending(old=>{const next={...old};delete next[id];return next;});await load();}
    catch(err) {setMessage('Không lưu được thay đổi: '+err.message);}
    finally {setBusy(null);}
  }
  const stats=Object.fromEntries(Object.keys(STATUS).map(s=>[s,videos.filter(v=>v.status===s).length]));
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Thư viện video"} /></h1><p><AdminT vi={"Quản lý tệp đã tải lên, trạng thái xử lý và chuyển nhanh sang biên tập phụ đề hoặc thuyết minh."} /></p></div>
      <button type="button" className="btn btn-sm" onClick={load} disabled={loading||busy!==null}><AdminT vi={"Làm mới"} /></button></div>
    <AdminActiveFilter params={params} base="/admin/videos"/>
    {viewing&&<SavedVideo video={viewing} onClose={()=>setViewing(null)}/>}
    <div className="ops-kpis"><div className="ops-kpi"><strong>{videos.length}</strong><span><AdminT vi={"Video trong danh sách"} /></span></div>
      <div className="ops-kpi"><strong>{stats.processing||0}</strong><span><AdminT vi={"Đang xử lý"} /></span></div>
      <div className="ops-kpi"><strong>{stats.failed||0}</strong><span><AdminT vi={"Cần kiểm tra lỗi"} /></span></div></div>
    <section className="panel"><div className="adm-toolbar">
      <label className="adm-field adm-field-search"><AdminT vi={"Tìm video"} /><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr("Mã, tiêu đề, email hoặc tệp…")} /></label>
      <label className="adm-field"><AdminT vi={"Trạng thái"} /><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{tr("Tất cả")}</option>
        {Object.entries(STATUS).map(([key,label])=><option key={key} value={key}>{tr(label)}</option>)}</select></label></div>
      <p className="adm-table-meta"><AdminT vi={"Hiện"} /> {shown.length}/{videos.length} <AdminT vi={"video · Đổi trạng thái rồi chọn “Lưu” để xác nhận thay đổi."} /></p>
      {message&&<p role="alert" className="ops-notice">{tr(message)}</p>}
      {loading&&<p role="status"><AdminT vi={"Đang tải video…"} /></p>}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr>
        <th><AdminT vi={"Mã"} /></th><th><AdminT vi={"Tiêu đề / Tệp"} /></th><th><AdminT vi={"Người tải"} /></th><th><AdminT vi={"Ngôn ngữ"} /></th><th><AdminT vi={"Ngày tải (VN)"} /></th><th><AdminT vi={"Trạng thái"} /></th><th><AdminT vi={"Thao tác"} /></th>
      </tr></thead><tbody>{shown.map(v=>{
        const selected=pending[v.id]??v.status;
        return <tr key={v.id}>
          <td><strong>#{v.id}</strong></td><td><strong>{v.title}</strong><p className="fine">{v.fileName}</p></td>
          <td>{v.userName}<p className="fine">{v.userEmail}</p><Link className="adm-inline-link" to={adminHref('/admin/users',{email:v.userEmail})}><AdminT vi={"Xem khách hàng →"} /></Link></td><td>{v.originalLanguage||'—'}</td><td>{fmtDate(v.createdAt)}</td>
          <td><span className="adm-status" data-state={v.status}>{tr(STATUS[v.status]||v.status)}</span>
            <select style={{marginTop:6,maxWidth:178}} aria-label={`${tr("Chọn trạng thái video")} ${v.id}`} value={selected} disabled={busy===v.id}
              onChange={e=>setPending(old=>{const next={...old};if(e.target.value===v.status)delete next[v.id];else next[v.id]=e.target.value;return next;})}>
              {Object.entries(STATUS).map(([key,label])=><option key={key} value={key}>{tr(label)}</option>)}
            </select>
            {selected!==v.status&&<div className="adm-actions" style={{marginTop:6}}>
              <button type="button" className="btn btn-sm btn-primary" disabled={busy===v.id}
                onClick={()=>act(v.id,()=>manageApi.updateVideo(v.id,selected))}>{tr(busy===v.id?'Đang lưu…':'Lưu')}</button>
              <button type="button" className="btn btn-sm" onClick={()=>setPending(old=>{const next={...old};delete next[v.id];return next;})}><AdminT vi={"Hủy"} /></button>
            </div>}
          </td>
          <td><div className="adm-video-actions">
            <button type="button" className="btn btn-sm" onClick={()=>setViewing(v)}>{tr("Xem video")}</button>
            <button type="button" className="btn btn-sm" onClick={()=>setContextVideo(contextVideo===v.id?null:v.id)}><AdminT vi={"Liên kết"} /></button>
            <Link className="btn btn-sm" to={`/admin/narrations?videoId=${v.id}`}><AdminT vi={"Thuyết minh"} /></Link>
            <Link className="btn btn-sm" to={`/admin/subtitles?videoId=${v.id}`}><AdminT vi={"Phụ đề"} /></Link>
            <button type="button" className="btn btn-sm danger" disabled={busy===v.id} onClick={()=>{
              if(window.confirm(`${tr('Xóa video')} #${v.id} ${tr('và dữ liệu phụ đề/thuyết minh liên quan? Thao tác này không thể hoàn tác.')}`))act(v.id,()=>manageApi.deleteVideo(v.id));
            }}><AdminT vi={"Xóa"} /></button>
          </div></td>
        </tr>;
      })}</tbody></table></div>
      {contextVideo&&videos.some(v=>v.id===contextVideo)&&<div className="adm-record-detail" role="region" aria-label={`${tr("Liên kết video")} ${contextVideo}`}>
        {videos.filter(v=>v.id===contextVideo).map(v=><div key={v.id}><div className="adm-work-head"><h3><AdminT vi={"Video #"} />{v.id} — {v.title}</h3><button type="button" className="btn btn-sm" onClick={()=>setContextVideo(null)}><AdminT vi={"Đóng"} /></button></div>
          <div className="adm-context-links"><Link to={adminHref('/admin/subtitles',{videoId:v.id})}><AdminT vi={"Biên tập phụ đề"} /></Link><Link to={adminHref('/admin/narrations',{videoId:v.id})}><AdminT vi={"Biên tập thuyết minh"} /></Link></div>
          <AdminCustomerContext email={v.userEmail}/>
        </div>)}
      </div>}
      {!loading&&!shown.length&&<div className="adm-empty-state">{videos.length?'Không có video phù hợp bộ lọc.':'Chưa có video tải lên trong SQL Server.'}</div>}
    </section>
  </>;
}
