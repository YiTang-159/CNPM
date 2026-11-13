import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { manageApi } from '../api/workflows.js';

export default function AdminLanguages() {
  const tr = useAdminT();
  const [langs, setLangs] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', englishName: '' });
  const [info, setInfo] = useState('');
  const [editing, setEditing] = useState(null);
  const [search,setSearch] = useState('');
  const [filter,setFilter] = useState('all');
  const load = useCallback(async () => {
    try { setLangs((await manageApi.languages()).languages || []); setInfo(''); }
    catch (err) { setInfo('Không đọc được dữ liệu: ' + err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, !editing);
  async function submit(e) {
    e.preventDefault();
    try { await manageApi.addLanguage({ ...form, code: form.code.toLowerCase().trim() });
      setForm({ code: '', name: '', englishName: '' }); await load(); }
    catch (err) { setInfo('Không thêm được ngôn ngữ: ' + err.message); }
  }
  async function save(row) {
    try { await manageApi.updateLanguage(row.code, { name: row.name, englishName: row.englishName, status: row.status });
      setEditing(null); await load(); }
    catch (err) { setInfo('Không lưu được: ' + err.message); }
  }
  const filtered=useMemo(()=>langs.filter(x=>(filter==='all'||x.status===filter)&&`${x.code} ${x.name} ${x.englishName}`.toLowerCase().includes(search.toLowerCase().trim())),[langs,filter,search]);
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Quản lý ngôn ngữ"} /></h1><p><AdminT vi={"Tiếng Việt, Anh, Trung đã tích hợp. Ngôn ngữ mới chỉ được lưu vào danh mục ở trạng thái tạm ngưng cho đến khi có bộ xử lý thực tế."} /></p></div></div>
    <div className="ops-kpis"><div className="ops-kpi"><strong>{langs.length}</strong><span><AdminT vi={"Ngôn ngữ trong danh mục"} /></span></div>
      <div className="ops-kpi"><strong>{langs.filter(x=>x.status==='active').length}</strong><span><AdminT vi={"Đang hoạt động"} /></span></div>
      <div className="ops-kpi"><strong>{langs.filter(x=>x.status==='inactive').length}</strong><span><AdminT vi={"Đã tạm ngưng"} /></span></div></div>
    <section className="panel"><details className="adm-add-language"><summary><AdminT vi={"+ Thêm ngôn ngữ mới"} /></summary>
      <form onSubmit={submit} className="adm-form">
        <label><AdminT vi={"Mã (vd: vi)"} /><input maxLength={8} value={form.code} onChange={e => setForm(v => ({ ...v, code: e.target.value }))} required pattern="[a-zA-Z]{2,8}" /></label>
        <label><AdminT vi={"Tên tiếng Việt"} /><input maxLength={80} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required /></label>
        <label><AdminT vi={"Tên tiếng Anh"} /><input maxLength={80} value={form.englishName} onChange={e => setForm(v => ({ ...v, englishName: e.target.value }))} required /></label>
        <button className="btn btn-primary" type="submit"><AdminT vi={"Thêm"} /></button>
      </form>
      </details>
      <div className="adm-toolbar" style={{marginTop:20}}>
        <label className="adm-field adm-field-search"><AdminT vi={"Tìm ngôn ngữ"} /><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr("Mã hoặc tên ngôn ngữ")}/></label>
        <label className="adm-field"><AdminT vi={"Trạng thái"} /><select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">{tr("Tất cả")}</option><option value="active">{tr("Đang hoạt động")}</option><option value="inactive">{tr("Tạm ngưng")}</option></select></label>
        <button className="btn btn-sm" onClick={load}><AdminT vi={"Làm mới"} /></button>
      </div>
      {info ? <p role="alert" className="ops-notice">{tr(info)}</p> : null}
      <p className="adm-table-meta"><AdminT vi={"Hiện"} /> {filtered.length}/{langs.length} <AdminT vi={"ngôn ngữ. Chỉnh sửa trạng thái phải bấm Lưu để cập nhật SQL Server."} /></p>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th><AdminT vi={"Mã"} /></th><th><AdminT vi={"Tên tiếng Việt"} /></th><th><AdminT vi={"Tên tiếng Anh"} /></th><th><AdminT vi={"Khả năng xử lý"} /></th><th><AdminT vi={"Trạng thái"} /></th><th><AdminT vi={"Thao tác"} /></th></tr></thead>
        <tbody>{filtered.map(row => <tr key={row.code}><td>{row.code}</td>
          <td>{editing?.code === row.code ? <input aria-label={tr("Tên tiếng Việt")} value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} /> : row.name}</td>
          <td>{editing?.code === row.code ? <input aria-label={tr("Tên tiếng Anh")} value={editing.englishName} onChange={e => setEditing(v => ({ ...v, englishName: e.target.value }))} /> : row.englishName}</td>
          <td><span className="adm-status" data-state={row.processingSupported?'active':'pending'}>{tr(row.processingSupported?'Đã hỗ trợ':'Chưa tích hợp')}</span></td>
          <td><select aria-label={`${tr("Trạng thái")} ${row.code}`} value={editing?.code === row.code ? editing.status : row.status}
            onChange={e => setEditing({ ...(editing?.code === row.code ? editing : row), status: e.target.value })}>
            <option value="active" disabled={!row.processingSupported}>{tr("Đang hoạt động")}</option><option value="inactive">{tr("Tạm ngưng")}</option></select></td>
          <td className="adm-actions">{editing?.code === row.code ? <>
            <button className="btn btn-sm" onClick={() => save(editing)}><AdminT vi={"Lưu"} /></button>
            <button className="btn btn-sm" onClick={() => setEditing(null)}><AdminT vi={"Hủy"} /></button>
          </> : <button className="btn btn-sm" onClick={() => setEditing({ ...row })}><AdminT vi={"Sửa"} /></button>}</td>
        </tr>)}</tbody></table></div>
      {!filtered.length&&<div className="adm-empty-state"><AdminT vi={"Không có ngôn ngữ phù hợp bộ lọc."} /></div>}
    </section>
  </>;
}
