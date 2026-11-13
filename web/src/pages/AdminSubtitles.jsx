import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useState } from 'react';
import { serviceAdminApi } from '../api/services.js';
import { ServiceHeader, ServiceState, languageName, matchesSearch, useAdminRecords } from '../components/AdminServiceTools.jsx';

function SubtitleEditor({ record, user, onSaved }) {
  const tr = useAdminT();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(record.text);
  const [start, setStart] = useState(record.start ?? '');
  const [end, setEnd] = useState(record.end ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const edit = () => { setText(record.text); setStart(record.start ?? ''); setEnd(record.end ?? ''); setError(''); setSaved(false); setEditing(true); };
  const save = async (event) => {
    event.preventDefault();
    const from = start === '' ? null : Number(start);
    const to = end === '' ? null : Number(end);
    if ((from === null) !== (to === null) || (from !== null && (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from))) {
      setError('Nhập đủ thời gian bắt đầu và kết thúc; thời gian kết thúc phải lớn hơn bắt đầu.'); return;
    }
    setSaving(true); setError(''); setSaved(false);
    try { onSaved(await serviceAdminApi.saveSubtitle(user, record.id, { text: text.trim(), start: from, end: to })); setEditing(false); setSaved(true); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <article className="service-record">
    <h2>{record.title} · #{record.id}</h2>
    <div className="service-meta"><span>{record.userEmail}</span><span>{languageName(record.language)}</span><span>{record.start == null ? tr('Chưa đặt thời gian') : `${record.start} – ${record.end} ${tr('giây')}`}</span></div>
    {editing ? <form onSubmit={save}>
      <label htmlFor={`subtitle-${record.id}`}><AdminT vi={"Nội dung phụ đề"} /><textarea id={`subtitle-${record.id}`} required maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} /></label>
      <div className="service-form-row">
        <label htmlFor={`start-${record.id}`}><AdminT vi={"Bắt đầu (giây)"} /><input id={`start-${record.id}`} type="number" min="0" max="86400" step="0.001" value={start} onChange={(event) => setStart(event.target.value)} /></label>
        <label htmlFor={`end-${record.id}`}><AdminT vi={"Kết thúc (giây)"} /><input id={`end-${record.id}`} type="number" min="0" max="86400" step="0.001" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      </div>
      <p className="fine"><AdminT vi={"Có thể để trống cả hai mốc nếu chưa xác định thời gian."} /></p>
      <div className="service-actions"><button className="btn btn-primary" type="submit" disabled={saving || !text.trim()}>{tr(saving ? 'Đang lưu…' : 'Lưu phụ đề')}</button><button className="btn" type="button" disabled={saving} onClick={() => setEditing(false)}><AdminT vi={"Hủy"} /></button></div>
    </form> : <><p className="service-text">{record.text}</p><button type="button" className="btn" onClick={edit}><AdminT vi={"Chỉnh sửa phụ đề"} /></button></>}
    {error && <p role="alert" className="service-error">{tr(error)}</p>}
    {saved && <p role="status" className="service-success"><AdminT vi={"Đã lưu phụ đề vào SQL Server."} /></p>}
  </article>;
}

export default function AdminSubtitles() {
  const tr = useAdminT();
  const state = useAdminRecords(serviceAdminApi.subtitles);
  const [search, setSearch] = useState('');
  const visible = state.records.filter((record) => matchesSearch(record, search));
  return <>
    <ServiceHeader title={tr("Quản lý phụ đề")} description={tr("Chỉnh nội dung theo ngôn ngữ và thời gian hiển thị. Thay đổi được lưu cho dự án của khách hàng.")} {...state} search={search} setSearch={setSearch} />
    <ServiceState {...state} empty={!visible.length} />
    {!state.loading && !state.error && <div className="service-records">{visible.map((record) => <SubtitleEditor key={record.id} record={record} user={state.user} onSaved={state.replace} />)}</div>}
  </>;
}
