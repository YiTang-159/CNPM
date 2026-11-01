import { useCallback, useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';

export default function AdminMediaResults({ kind }) {
  const isSubtitle = kind === 'subtitles';
  const title = isSubtitle ? 'Quản lý phụ đề' : 'Quản lý thuyết minh';
  const [videos, setVideos] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState('');
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState('');
  const loadVideos = useCallback(() => manageApi.videos().then(d => setVideos(d.videos || [])).catch(e => setMessage(e.message)), []);
  const loadEntries = useCallback(async (id) => {
    if (!id) { setEntries([]); return; }
    try { setEntries((await manageApi.videoResults(id))[kind] || []); setMessage(''); }
    catch (e) { setMessage('Không tải được dữ liệu: ' + e.message); }
  }, [kind]);
  useEffect(() => { loadVideos(); }, [loadVideos]);
  useEffect(() => { loadEntries(selected); setEdit(null); }, [selected, loadEntries]);
  function safeParse(content) { try { return JSON.parse(content); } catch { return []; } }
  async function save() {
    try {
      const lines = JSON.parse(edit.text);
      if (!Array.isArray(lines)) throw new Error('Nội dung phải là một danh sách JSON.');
      await manageApi.saveLines(selected, kind, edit.language, lines);
      setEdit(null); await loadEntries(selected); setMessage('Đã cập nhật SQL Server.');
    } catch (e) { setMessage('Không lưu được: ' + e.message); }
  }
  return <>
    <div className="adm-head"><div><h1>{title}</h1><p>Xem và chỉnh nội dung từng ngôn ngữ theo video. Mốc thời gian được lưu cùng nội dung trong SQL Server.</p></div></div>
    <section className="panel">
      <div className="adm-form"><label>Chọn video<select value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">-- Chọn video --</option>{videos.map(v => <option key={v.id} value={v.id}>#{v.id} – {v.title} ({v.userEmail})</option>)}
      </select></label><button className="btn btn-sm" onClick={() => { loadVideos(); loadEntries(selected); }}>Làm mới</button></div>
      {message ? <p role="status">{message}</p> : null}
      {selected && !entries.length ? <p>Video chưa có {isSubtitle ? 'phụ đề' : 'thuyết minh'} được lưu.</p> : null}
      {entries.map(item => <section key={item.language} style={{ borderTop: '1px solid #ddd', padding: '16px 0' }}>
        <div className="adm-actions"><h3>Ngôn ngữ: {item.language}</h3><button className="btn btn-sm" onClick={() => setEdit({ language: item.language, text: JSON.stringify(safeParse(item.content), null, 2) })}>Chỉnh sửa</button></div>
        {edit?.language === item.language ? <>
          <p className="fine">Chỉnh sửa từng phần tử dạng {`[{ "text": "...", "start": 0, "end": 2 }]`}. Không thay đổi mốc thời gian nếu không cần thiết.</p>
          <textarea aria-label={`Nội dung ${item.language}`} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} value={edit.text} onChange={e => setEdit(v => ({ ...v, text: e.target.value }))} />
          <div className="adm-actions"><button className="btn btn-primary" onClick={save}>Lưu SQL Server</button><button className="btn" onClick={() => setEdit(null)}>Hủy</button></div>
        </> : <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Bắt đầu (s)</th><th>Kết thúc (s)</th><th>Nội dung</th></tr></thead>
          <tbody>{safeParse(item.content).map((line, i) => <tr key={i}><td>{line.start ?? '—'}</td><td>{line.end ?? '—'}</td><td className="adm-feedback-text">{line.text}</td></tr>)}</tbody>
        </table></div>}
      </section>)}
    </section>
  </>;
}
