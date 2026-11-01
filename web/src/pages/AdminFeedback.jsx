import { useCallback, useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try { const rows = (await manageApi.feedback()).feedback || []; setItems(rows);
      setEdits(Object.fromEntries(rows.map(r => [r.id, { status: r.status, reply: r.reply || '' }])));
      setMessage(''); } catch (e) { setMessage('Không lấy được phản hồi: ' + e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function save(item) {
    try { await manageApi.updateFeedback(item.id, edits[item.id]); await load(); setMessage('Đã cập nhật phản hồi.'); }
    catch (e) { setMessage('Không lưu được: ' + e.message); }
  }
  return <>
    <div className="adm-head"><div><h1>Quản lý phản hồi</h1><p>Phản hồi có đăng nhập và lời nhắn từ trang Liên hệ, cập nhật trạng thái và trả lời ngay trong SQL Server.</p></div></div>
    <section className="panel"><button className="btn btn-sm" onClick={load}>Làm mới</button>
      {message ? <p role="status">{message}</p> : null}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Người gửi</th><th>Nội dung</th><th>Ngày gửi</th><th>Trạng thái</th><th>Phản hồi Admin</th><th>Thao tác</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id}><td>{item.name}<p className="fine">{item.email}</p><small>{item.source === 'contact' ? 'Liên hệ' : `Tài khoản / Video #${item.videoId || '—'}`}</small></td>
          <td className="adm-feedback-text">{item.message}</td><td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
          <td><select aria-label={`Trạng thái ${item.id}`} value={edits[item.id]?.status || item.status}
            onChange={e => setEdits(v => ({ ...v, [item.id]: { ...v[item.id], status: e.target.value } }))}>
            <option value="new">Mới</option><option value="reviewing">Đang xử lý</option><option value="resolved">Đã giải quyết</option>
          </select></td>
          <td><textarea rows={3} aria-label={`Trả lời ${item.id}`} value={edits[item.id]?.reply || ''} maxLength={2000}
            onChange={e => setEdits(v => ({ ...v, [item.id]: { ...v[item.id], reply: e.target.value } }))} /></td>
          <td><button className="btn btn-sm" onClick={() => save(item)}>Lưu</button></td></tr>)}</tbody>
      </table>{!items.length && !message ? <p>Chưa có phản hồi.</p> : null}</div>
    </section>
  </>;
}
