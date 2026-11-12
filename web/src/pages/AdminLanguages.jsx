import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { manageApi } from '../api/workflows.js';

export default function AdminLanguages() {
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
    <div className="adm-head"><div><h1>Quản lý ngôn ngữ</h1><p>Thêm, cập nhật tên và bật/tắt ngôn ngữ trong SQL Server. Bộ xử lý video hiện hỗ trợ tiếng Việt, Anh và Trung; thêm danh mục chưa tự cài mô hình dịch mới.</p></div></div>
    <div className="ops-kpis"><div className="ops-kpi"><strong>{langs.length}</strong><span>Ngôn ngữ trong danh mục</span></div>
      <div className="ops-kpi"><strong>{langs.filter(x=>x.status==='active').length}</strong><span>Đang hoạt động</span></div>
      <div className="ops-kpi"><strong>{langs.filter(x=>x.status==='inactive').length}</strong><span>Đã tạm ngưng</span></div></div>
    <section className="panel"><details className="adm-add-language"><summary>+ Thêm ngôn ngữ mới</summary>
      <form onSubmit={submit} className="adm-form">
        <label>Mã (vd: vi)<input maxLength={8} value={form.code} onChange={e => setForm(v => ({ ...v, code: e.target.value }))} required pattern="[a-zA-Z]{2,8}" /></label>
        <label>Tên tiếng Việt<input maxLength={80} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required /></label>
        <label>Tên tiếng Anh<input maxLength={80} value={form.englishName} onChange={e => setForm(v => ({ ...v, englishName: e.target.value }))} required /></label>
        <button className="btn btn-primary" type="submit">Thêm</button>
      </form>
      </details>
      <div className="adm-toolbar" style={{marginTop:20}}>
        <label className="adm-field adm-field-search">Tìm ngôn ngữ<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mã hoặc tên ngôn ngữ"/></label>
        <label className="adm-field">Trạng thái<select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">Tất cả</option><option value="active">Đang hoạt động</option><option value="inactive">Tạm ngưng</option></select></label>
        <button className="btn btn-sm" onClick={load}>Làm mới</button>
      </div>
      {info ? <p role="alert" className="ops-notice">{info}</p> : null}
      <p className="adm-table-meta">Hiện {filtered.length}/{langs.length} ngôn ngữ. Chỉnh sửa trạng thái phải bấm Lưu để cập nhật SQL Server.</p>
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã</th><th>Tên tiếng Việt</th><th>Tên tiếng Anh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.map(row => <tr key={row.code}><td>{row.code}</td>
          <td>{editing?.code === row.code ? <input aria-label="Tên tiếng Việt" value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} /> : row.name}</td>
          <td>{editing?.code === row.code ? <input aria-label="Tên tiếng Anh" value={editing.englishName} onChange={e => setEditing(v => ({ ...v, englishName: e.target.value }))} /> : row.englishName}</td>
          <td><select aria-label={`Trạng thái ${row.code}`} value={editing?.code === row.code ? editing.status : row.status}
            onChange={e => setEditing({ ...(editing?.code === row.code ? editing : row), status: e.target.value })}>
            <option value="active">Đang hoạt động</option><option value="inactive">Tạm ngưng</option></select></td>
          <td className="adm-actions">{editing?.code === row.code ? <>
            <button className="btn btn-sm" onClick={() => save(editing)}>Lưu</button>
            <button className="btn btn-sm" onClick={() => setEditing(null)}>Hủy</button>
          </> : <button className="btn btn-sm" onClick={() => setEditing({ ...row })}>Sửa</button>}</td>
        </tr>)}</tbody></table></div>
      {!filtered.length&&<div className="adm-empty-state">Không có ngôn ngữ phù hợp bộ lọc.</div>}
    </section>
  </>;
}
