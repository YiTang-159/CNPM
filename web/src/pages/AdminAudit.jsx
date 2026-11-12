import { useCallback, useEffect, useMemo, useState } from 'react';
import { manageApi } from '../api/workflows.js';

const labels={user_status:'Trạng thái tài khoản',video_status:'Trạng thái video'};
const when=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'—';
export default function AdminAudit(){
  const [rows,setRows]=useState([]);
  const [search,setSearch]=useState('');
  const [type,setType]=useState('all');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    try{const data=await manageApi.audit();setRows(data.activities||[]);setError('');}
    catch(e){setError('Không tải được nhật ký: '+(e.message||'Lỗi API'));}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const filtered=useMemo(()=>rows.filter(x=>(type==='all'||x.type===type)&&
    (!search.trim()||`${x.target} ${x.actor} ${x.previous} ${x.current}`.toLowerCase().includes(search.trim().toLowerCase()))),[rows,search,type]);
  return <>
    <div className="adm-head"><div><h1>Nhật ký quản trị</h1><p>Tra cứu ai đã thay đổi trạng thái tài khoản hoặc video, giá trị trước/sau và thời gian ghi nhận tại SQL Server. Chỉ Admin mới được xem.</p></div>
      <button className="btn btn-sm" type="button" onClick={load} disabled={loading}>Làm mới</button></div>
    <section className="panel">
      <div className="adm-toolbar">
        <label className="adm-field adm-field-search">Tìm người thực hiện hoặc đối tượng<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Email, mã video, trạng thái…"/></label>
        <label className="adm-field">Loại thao tác<select value={type} onChange={e=>setType(e.target.value)}><option value="all">Tất cả</option><option value="user_status">Tài khoản</option><option value="video_status">Video</option></select></label>
      </div>
      <p className="adm-table-meta">Hiển thị {filtered.length}/{rows.length} thao tác gần nhất (tối đa 200). Kiểm duyệt phụ đề, thuyết minh và phản hồi có lịch sử riêng tại trang tương ứng.</p>
      {error&&<p className="ops-notice" role="alert">{error}</p>}
      {loading&&<p role="status">Đang tải nhật ký…</p>}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Thời gian (VN)</th><th>Thao tác</th><th>Đối tượng</th><th>Người thực hiện</th><th>Trước</th><th>Sau</th></tr></thead>
      <tbody>{filtered.map(row=><tr key={row.id}><td>{when(row.at)}</td><td>{labels[row.type]||row.type}</td><td>{row.target}</td><td>{row.actor}</td><td>{row.previous||'—'}</td><td>{row.current||'—'}</td></tr>)}</tbody></table></div>
      {!loading&&!filtered.length&&<div className="adm-empty-state">{rows.length?'Không tìm thấy thao tác phù hợp.':'Chưa có thay đổi được ghi nhận.'}</div>}
    </section>
  </>;
}
