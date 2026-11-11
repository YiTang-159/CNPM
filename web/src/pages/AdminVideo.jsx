import SavedVideo from '../components/SavedVideo.jsx';
import { useCallback, useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';

const STATUS = ['uploaded', 'processing', 'completed', 'failed', 'hidden'];
export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState('Đang tải dữ liệu...');
  const [search, setSearch] = useState('');
  const [viewing,setViewing] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    try { setVideos((await manageApi.videos()).videos || []); setStatus(''); }
    catch (err) { setStatus('Không đọc được SQL Server: ' + err.message); }
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, [load]);
  const act = async (id, run) => {
    setBusy(id);
    try { await run(); await load(); }
    catch (err) { setStatus('Không lưu được thay đổi: ' + err.message); }
    finally { setBusy(null); }
  };
  return <>
    <div className="adm-head"><div><h1>Quản lý video</h1><p>Video được khách hàng tải lên và lưu trong SQL Server (thông tin) cùng Docker volume (tệp).</p></div></div>
    {viewing ? <SavedVideo video={viewing} onClose={() => setViewing(null)} /> : null}
    <section className="panel">
      <div className="adm-actions"><input aria-label="Tìm video" placeholder="Tìm tên video, email..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-sm" onClick={load}>Làm mới</button></div>
      {status ? <p role="status">{status}</p> : null}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr>
        <th>Mã</th><th>Tiêu đề / Tệp</th><th>Người tải</th><th>Ngôn ngữ</th><th>Ngày tải</th><th>Trạng thái</th><th>Thao tác</th>
      </tr></thead><tbody>
        {videos.filter(v => `${v.title} ${v.userEmail} ${v.fileName}`.toLowerCase().includes(search.toLowerCase())).map(v => <tr key={v.id}>
          <td>#{v.id}</td><td><strong>{v.title}</strong><p className="fine">{v.fileName}</p></td>
          <td>{v.userName}<p className="fine">{v.userEmail}</p></td><td>{v.originalLanguage}</td>
          <td>{v.createdAt ? new Date(v.createdAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'}) : '—'}</td>
          <td><select aria-label={`Trạng thái video ${v.id}`} value={v.status} disabled={busy === v.id}
            onChange={e => act(v.id, () => manageApi.updateVideo(v.id, e.target.value))}>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select></td>
          <td><button className="btn btn-sm" onClick={() => setViewing(v)}>Xem video</button> <button className="btn btn-sm" disabled={busy === v.id}
            onClick={() => { if (window.confirm(`Xóa video #${v.id} và phụ đề/thuyết minh liên quan?`)) act(v.id, () => manageApi.deleteVideo(v.id)); }}>Xóa</button></td>
        </tr>)}
      </tbody></table>{!videos.length && !status ? <p>Chưa có video. Hãy đăng nhập tài khoản khách để tải video lên.</p> : null}</div>
    </section>
  </>;
}
