import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { adminHref } from '../utils/adminLinks.js';

const dt = value => value ? new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}) : '—';
const types = [
  { key:'feedback', title:'Phản hồi cần hỗ trợ', href:'/admin/feedback?status=new', description:'Yêu cầu mới hoặc đang xử lý' },
  { key:'orders', title:'Đơn đang chờ thanh toán', href:'/admin/orders?status=pending', description:'Kiểm tra giao dịch, không tự xác nhận đã thanh toán' },
  { key:'media', title:'Nội dung chờ duyệt', href:'/admin/queue#media', description:'Phụ đề và thuyết minh chờ kiểm duyệt' },
  { key:'videos', title:'Video cần kiểm tra', href:'/admin/videos?status=failed', description:'Video có trạng thái xử lý thất bại' },
];

/** Bảng công việc chỉ đọc, dựa trên API hiện hữu; không tự cập nhật trạng thái hoặc thanh toán. */
export default function AdminQueue() {
  const tr = useAdminT();
  const [data,setData] = useState({feedback:[],orders:[],media:[],videos:[]});
  const [errors,setErrors] = useState([]);
  const [loading,setLoading] = useState(true);
  const load = useCallback(async () => {
    const jobs = [manageApi.feedback(),manageApi.orders(),manageApi.mediaIndex('narrations'),manageApi.mediaIndex('subtitles'),manageApi.videos()];
    const results = await Promise.allSettled(jobs);
    const [feedback,orders,narrations,subtitles,videos] = results;
    const list = [];
    results.forEach((r,i) => {if(r.status==='rejected') list.push(['Phản hồi','Đơn hàng','Thuyết minh','Phụ đề','Video'][i]);});
    setErrors(list);
    const get = (r,key) => r.status==='fulfilled' ? (r.value?.[key] || []) : [];
    const mediaRows = [
      ...get(narrations,'items').map(item => ({...item, kind:'narrations', kindLabel:'Thuyết minh'})),
      ...get(subtitles,'items').map(item => ({...item, kind:'subtitles',kindLabel:'Phụ đề'})),
    ];
    setData({
      feedback:get(feedback,'feedback').filter(x=>x.status==='new'||x.status==='reviewing'),
      orders:get(orders,'orders').filter(x=>x.status==='pending'),
      media:mediaRows.filter(x=>x.status==='reviewing'),
      videos:get(videos,'videos').filter(x=>x.status==='failed'),
    });
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useAutoRefresh(load,true,30000);
  const lists=useMemo(()=>({
    feedback:[...data.feedback].sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')),
    orders:[...data.orders].sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')),
    media:[...data.media].sort((a,b)=>(a.updatedAt||'').localeCompare(b.updatedAt||'')),
    videos:[...data.videos].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),
  }),[data]);
  function taskDetails(key,item) {
    if (key==='feedback') return {name:`${item.name || item.email} · #${item.id}`, sub:item.message, href:adminHref('/admin/feedback',{email:item.email,status:item.status})};
    if (key==='orders') return {name:`${tr('Đơn')} #${item.id} · ${item.name || item.email}`,sub:`${item.email || ''} · ${dt(item.createdAt)}`,href:adminHref('/admin/orders',{orderId:item.id})};
    if (key==='media') return {name:`${item.kindLabel} · Video #${item.videoId} (${item.language})`, sub:item.title, href:`/admin/${item.kind}?status=reviewing&videoId=${encodeURIComponent(item.videoId)}`};
    return {name:`Video #${item.id} · ${item.title}`, sub:`${item.userEmail||''} · ${dt(item.createdAt)}`, href:adminHref('/admin/videos',{videoId:item.id})};
  }
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Việc cần xử lý"} /></h1><p><AdminT vi={"Một nơi để theo dõi việc đang chờ. Chọn từng mục để xử lý tại trang nghiệp vụ tương ứng."} /></p></div>
      <button type="button" className="btn btn-sm" onClick={load} disabled={loading}>{tr(loading?'Đang tải…':'Làm mới')}</button></div>
    {errors.length>0 && <p className="ops-notice" role="alert"><AdminT vi={"Một số dữ liệu chưa tải được:"} /> {errors.map(tr).join(', ')}<AdminT vi={". Các mục tương ứng có thể hiển thị thiếu; vui lòng thử làm mới."} /></p>}
    <p className="adm-table-meta"><AdminT vi={"Dữ liệu lấy từ các danh sách gần nhất của API, không phải tổng số toàn hệ thống. Trang này chỉ đọc, không tự thay đổi trạng thái bản ghi."} /></p>
    <div className="adm-work-summary">
      {types.map(type=><Link key={type.key} to={type.href}><strong>{loading?'—':data[type.key].length}</strong><span>{tr(type.title)}</span><small>{tr(type.description)}</small></Link>)}
    </div>
    <div className="adm-queue-grid">
      {types.map(type=><section className="panel" key={type.key} id={type.key}><div className="adm-work-head"><div><h2>{tr(type.title)}</h2><p>{tr(type.description)}</p></div>{type.key==='media'?<div className="adm-tools"><Link className="btn btn-sm" to="/admin/narrations?status=reviewing"><AdminT vi={"Thuyết minh"} /></Link><Link className="btn btn-sm" to="/admin/subtitles?status=reviewing"><AdminT vi={"Phụ đề"} /></Link></div>:
          <Link className="btn btn-sm" to={type.href}><AdminT vi={"Mở trang"} /></Link>}</div>
        {lists[type.key].length ? lists[type.key].slice(0,6).map((item,i)=>{const task=taskDetails(type.key,item);return <div className="adm-queue-item" key={item.id ?? `${item.kind}-${item.videoId}-${item.language}-${i}`}>
          <div><strong>{tr(task.name)}</strong><small>{task.sub}</small></div><Link to={task.href}><AdminT vi={"Xử lý →"} /></Link></div>}) : <div className="adm-empty-state">{tr(loading?'Đang tải dữ liệu…':'Không có công việc nào trong nhóm này.')}</div>}
        {lists[type.key].length>6&&<p className="adm-table-meta"><AdminT vi={"Còn"} /> {lists[type.key].length-6} <AdminT vi={"việc khác. Vào trang nghiệp vụ để xem tất cả."} /></p>}
      </section>)}
    </div>
  </>;
}
