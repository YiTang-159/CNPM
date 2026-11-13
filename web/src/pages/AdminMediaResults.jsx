import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';
import { SubtitleEditor, NarrationEditor } from '../components/AdminMediaEditors.jsx';
import { adminHref } from '../utils/adminLinks.js';
import AdminActiveFilter from '../components/AdminActiveFilter.jsx';

const LABELS = { draft:'Bản nháp', reviewing:'Chờ duyệt', published:'Đã xuất bản' };
const BLANK = () => ({ start:0, end:3, text:'' });
const errorText = e => ({ conflict:'Bản ghi đã được người khác sửa. Hãy tải lại trước khi lưu.',
  review_required:'Cần chuyển sang Chờ duyệt trước khi xuất bản.',
  reopen_required:'Nội dung đã xuất bản cần được chuyển về Bản nháp trước khi sửa.' }[e?.code] || e?.message || 'Có lỗi xảy ra');
function parseLines(value) {
  try {
    const rows = JSON.parse(value);
    if (!Array.isArray(rows)) return [BLANK()];
    let end = 0;
    return rows.map(r => {
      const start = Number.isFinite(Number(r.start)) && r.start != null ? Number(r.start) : end;
      const finish = Number.isFinite(Number(r.end)) && r.end != null && Number(r.end) > start ? Number(r.end) : start + 3;
      end = finish;
      return { start, end:finish, text:String(r.text ?? '') };
    });
  } catch { return [BLANK()]; }
}

/** Một trang cho thuyết minh/phụ đề: danh sách -> biên tập -> kiểm duyệt -> lịch sử. */
export default function AdminMediaResults({kind}) {
  const [params] = useSearchParams();
  const isSubtitle = kind === 'subtitles';
  const label = isSubtitle ? 'Phụ đề' : 'Thuyết minh';
  const summary = isSubtitle
    ? 'Biên tập câu chữ, đồng bộ mốc thời gian và xuất SRT/VTT. Phiên bản và trạng thái kiểm duyệt lưu trong SQL Server.'
    : 'Quản lý kịch bản lời đọc, nghe thử giọng đọc trình duyệt và kiểm duyệt nội dung. Phiên bản kịch bản lưu trong SQL Server.';
  const [videos,setVideos] = useState([]);
  const [items,setItems] = useState([]);
  const [languages,setLanguages] = useState(['vi','en','zh']);
  const [filter,setFilter] = useState({query:params.get('videoId')||'', status:params.get('status')||'all', language:'all'});
  const [editor,setEditor] = useState(null);
  const [newData,setNewData] = useState({videoId:params.get('videoId')||'',language:'vi'});
  const [history,setHistory] = useState([]);
  const [message,setMessage] = useState('');
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vids, langs] = await Promise.all([manageApi.mediaIndex(kind),manageApi.videos(),manageApi.languages()]);
      setItems(list.items || []); setVideos(vids.videos || []);
      setLanguages((langs.languages || []).filter(x => x.status === 'active').map(x => x.code));
      setMessage('');
    } catch(e) { setMessage('Không tải được dữ liệu SQL: ' + errorText(e)); }
    finally { setLoading(false); }
  },[kind]);
  useEffect(() => { setEditor(null); load(); },[load]);
  useEffect(() => {const videoId=params.get('videoId')||''; setFilter(v=>({...v,query:videoId,status:params.get('status')||'all'}));setNewData(v=>({...v,videoId}));},[params]);
  useAutoRefresh(load, !editor && !saving);
  const visible = useMemo(() => items.filter(x => {
    const s = filter.query.toLowerCase().trim();
    return (filter.status === 'all' || x.status === filter.status) &&
      (filter.language === 'all' || x.language === filter.language) &&
      (!s || `${x.videoId} ${x.title} ${x.userEmail} ${x.language}`.toLowerCase().includes(s));
  }),[items,filter]);
  const counts = useMemo(() => Object.fromEntries(['draft','reviewing','published'].map(s=>[s,items.filter(x=>x.status===s).length])),[items]);
  async function selectItem(row) {
    setMessage('');setHistory([]);
    try {
      const d = await manageApi.mediaDetail(kind,row.videoId,row.language);
      setEditor({videoId:row.videoId,language:row.language, version:d.item.version, originalStatus:d.item.status,
        status:d.item.status, title:row.title, lines:parseLines(d.item.content)});
      const r = await manageApi.mediaHistory(kind,row.videoId,row.language);
      setHistory(r.history || []);
    } catch(e) { setMessage('Không mở được nội dung: ' + errorText(e)); }
  }
  function newEditor() {
    const video = videos.find(v=>String(v.id)===String(newData.videoId));
    if (!video || !languages.includes(newData.language)) { setMessage('Hãy chọn video và ngôn ngữ hợp lệ.');return; }
    if (items.some(x=>String(x.videoId)===String(video.id) && x.language===newData.language)) {
      setMessage('Video đã có bản ngôn ngữ này. Hãy chọn bản ghi để chỉnh sửa.');return;
    }
    setHistory([]);setMessage('');setEditor({videoId:Number(video.id),language:newData.language,
      version:0,originalStatus:'draft',status:'draft',title:video.title,lines:[BLANK()]});
  }
  function patchRow(i,field,value) {
    setEditor(old=>({...old,lines:old.lines.map((r,j)=>j===i?{...r,[field]:field==='text'?value:Number(value)}:r)}));
  }
  function addRow() {
    setEditor(old=>{const last=old.lines.at(-1);const start=Number(last?.end)||0;
      return {...old,lines:[...old.lines,{start,end:start+3,text:''}]};});
  }
  function removeRow(index) {
    setEditor(old => ({...old, lines:old.lines.filter((_, i) => i !== index)}));
  }
  async function save() {
    if (!editor) return;
    if (!editor.lines.length || editor.lines.some((x,i)=>!x.text.trim() || !Number.isFinite(x.start) ||
      !Number.isFinite(x.end) || x.start<0 || x.end<=x.start || (i>0 && x.start<editor.lines[i-1].end))) {
      setMessage('Kiểm tra các dòng: phải có nội dung; thời gian bắt đầu không âm, kết thúc lớn hơn bắt đầu và không chồng lấn.');return;
    }
    setSaving(true);
    try {
      await manageApi.saveMedia(kind,editor.videoId,editor.language,{
        version:editor.version,status:editor.status,lines:editor.lines.map(x=>({
          start:x.start,end:x.end,text:x.text.trim()}))});
      setEditor(null);setHistory([]);await load();
      setMessage(`Đã lưu ${label.toLowerCase()} #${editor.videoId} (${editor.language}) vào SQL, có ghi lịch sử phiên bản.`);
    } catch(e) { setMessage('Không lưu được: '+errorText(e)); }
    finally { setSaving(false); }
  }
  return <>
    <div className={`adm-head media-page-heading ${isSubtitle ? 'media-page-subtitles' : 'media-page-narrations'}`}><div>
      <span className="media-page-kicker">{isSubtitle ? 'VĂN BẢN TRÊN VIDEO' : 'KỊCH BẢN GIỌNG ĐỌC'}</span>
      <h1>Quản lý {label.toLowerCase()}</h1>
      <p>{summary}</p>
    </div><div className="adm-tools"><Link className="btn btn-sm" to={isSubtitle ? adminHref('/admin/narrations',{videoId:params.get('videoId')}) : adminHref('/admin/subtitles',{videoId:params.get('videoId')})}>{isSubtitle ? 'Qua thuyết minh' : 'Qua phụ đề'}</Link><button className="btn btn-sm" type="button" onClick={load} disabled={loading}>Làm mới</button></div></div>
    <AdminActiveFilter params={params} base={isSubtitle ? "/admin/subtitles" : "/admin/narrations"}/>
    <div className={`media-flow-guide ${isSubtitle ? 'media-flow-subtitles' : 'media-flow-narrations'}`}>
      <div><strong>{isSubtitle ? 'Quy trình phụ đề' : 'Quy trình thuyết minh'}</strong>
        <span>{isSubtitle ? 'Đầu ra: văn bản có thời gian (.srt / .vtt)' : 'Đầu ra hiện tại: kịch bản lời đọc; nghe thử bằng trình duyệt'}</span></div>
      <ol>{(isSubtitle
        ? ['Chọn video và ngôn ngữ', 'Sửa câu chữ, kiểm tra mốc thời gian', 'Duyệt và xuất tệp phụ đề']
        : ['Chọn video và ngôn ngữ', 'Soạn kịch bản, nghe thử giọng đọc', 'Duyệt và lưu phiên bản nội dung']).map(step => <li key={step}>{step}</li>)}</ol>
    </div>
    <div className="ops-kpis">{Object.entries(LABELS).map(([state,name])=><div className="ops-kpi" key={state}>
      <strong>{counts[state]||0}</strong><span>{name}</span></div>)}</div>
    <section className="panel ops-panel">
      <div className="ops-head"><h2>{isSubtitle ? 'Danh sách phụ đề theo video' : 'Danh sách kịch bản thuyết minh'}</h2><span className="fine">Hiện {visible.length}/{items.length} bản ghi (tối đa 500 bản gần nhất)</span></div>
      <div className="ops-toolbar">
        <label>Tìm video / email<input value={filter.query} placeholder="Tên video, email hoặc mã video" onChange={e=>setFilter(v=>({...v,query:e.target.value}))}/></label>
        <label>Trạng thái<select value={filter.status} onChange={e=>setFilter(v=>({...v,status:e.target.value}))}>
          <option value="all">Tất cả</option>{Object.entries(LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <label>Ngôn ngữ<select value={filter.language} onChange={e=>setFilter(v=>({...v,language:e.target.value}))}>
          <option value="all">Tất cả</option>{languages.map(l=><option key={l}>{l}</option>)}</select></label>
      </div>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Video</th><th>Khách hàng</th><th>Ngôn ngữ</th><th>Trạng thái</th><th>Phiên bản</th><th>Cập nhật</th><th>Thao tác</th></tr></thead>
        <tbody>{visible.map(row=><tr key={row.id}><td><Link className="adm-inline-link" to={adminHref('/admin/videos',{videoId:row.videoId})}>#{row.videoId}</Link> {row.title}</td><td>{row.userEmail}<Link className="adm-inline-link" to={adminHref('/admin/users',{email:row.userEmail})}>Khách hàng →</Link></td><td>{row.language}</td>
          <td><span className={`ops-state ops-state-${row.status}`}>{LABELS[row.status]||row.status}</span></td><td>v{row.version}</td>
          <td>{row.updatedAt?new Date(row.updatedAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'}):'—'}</td><td><button className="btn btn-sm" onClick={()=>selectItem(row)}>{isSubtitle ? 'Biên tập phụ đề' : 'Mở kịch bản'}</button></td></tr>)}</tbody>
      </table>{!loading && !visible.length?<p className="fine">Chưa có kết quả phù hợp. Hãy xử lý video từ trang User hoặc tạo bản mới bên dưới.</p>:null}</div>
    </section>
    <section className="panel ops-panel"><h2>{isSubtitle ? 'Tạo phụ đề cho video đã tải lên' : 'Tạo kịch bản thuyết minh cho video đã tải lên'}</h2>
      <p className="fine">{isSubtitle ? 'Khởi tạo bộ câu chữ cần hiển thị trên video và thời gian xuất hiện.' : 'Khởi tạo kịch bản sẽ được dùng để thuyết minh bằng giọng nói. Chưa tạo tệp âm thanh.'}</p>
      <div className="ops-toolbar"><label>Video<select value={newData.videoId} onChange={e=>setNewData(v=>({...v,videoId:e.target.value}))}>
        <option value="">-- Chọn video --</option>{videos.map(v=><option key={v.id} value={v.id}>#{v.id} – {v.title} ({v.userEmail})</option>)}</select></label>
        <label>Ngôn ngữ<select value={newData.language} onChange={e=>setNewData(v=>({...v,language:e.target.value}))}>
          {languages.map(l=><option key={l} value={l}>{l}</option>)}</select></label>
        <button className="btn" onClick={newEditor}>Tạo bản nháp</button></div>
      {!videos.length?<p className="fine">Chưa có video trong SQL Server. Khách hàng cần tải video trước khi biên tập nội dung.</p>:null}
    </section>
    {message?<p className="ops-notice" role="status">{message}</p>:null}
    {editor && <section className="panel ops-panel" aria-label="Biên tập nội dung">
      <div className="ops-head"><div><h2>Biên tập {label.toLowerCase()} – #{editor.videoId} / {editor.language}</h2>
        <p className="fine">{editor.title} · Phiên bản hiện tại: v{editor.version}{editor.originalStatus==='published'?' · Nếu sửa bản đã xuất bản, hãy chuyển về Bản nháp.':''}</p></div>
        <button className="btn btn-sm" onClick={()=>{setEditor(null);setHistory([])}}>Đóng</button></div>
      <div className="ops-toolbar"><label>Trạng thái kiểm duyệt<select value={editor.status} onChange={e=>setEditor(v=>({...v,status:e.target.value}))}>
        {Object.entries(LABELS).map(([s,t])=><option value={s} key={s}>{t}</option>)}</select></label>
        <p className="fine">Xuất bản chỉ khi bản ghi đang ở trạng thái Chờ duyệt. Mọi lần lưu đều ghi lịch sử.</p></div>
      {isSubtitle ? <SubtitleEditor key={`${editor.videoId}-${editor.language}`} editor={editor} patchRow={patchRow}
        addRow={addRow} removeRow={removeRow} onNotice={setMessage} />
        : <NarrationEditor key={`${editor.videoId}-${editor.language}`} editor={editor} patchRow={patchRow}
          addRow={addRow} removeRow={removeRow} onNotice={setMessage} />}
      <div className="adm-actions ops-gap"><button className="btn btn-primary" disabled={saving} onClick={save}>{saving?'Đang lưu…':'Lưu vào SQL Server'}</button></div>
      <h3>Lịch sử chỉnh sửa</h3>
      {history.length?<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Người sửa</th><th>Thời gian</th></tr></thead>
        <tbody>{history.map(h=><tr key={h.id}><td>v{h.version}</td><td>{LABELS[h.status]||h.status}</td><td>{h.editor}</td>
          <td>{new Date(h.changedAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'})}</td></tr>)}</tbody></table></div>:<p className="fine">Chưa có lịch sử chỉnh sửa bằng Admin.</p>}
    </section>}
  </>;
}
