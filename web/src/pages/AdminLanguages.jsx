import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';

export default function AdminLanguages() {
  const [langs, setLangs] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', englishName: '' });
  const [info, setInfo] = useState('');
  const [editing, setEditing] = useState(null);
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
  return <>
    <div className="adm-head"><div><h1>Quản lý ngôn ngữ</h1><p>Thêm, cập nhật tên và bật/tắt ngôn ngữ trong SQL Server. Bộ xử lý video hiện hỗ trợ tiếng Việt, Anh và Trung; thêm danh mục chưa tự cài mô hình dịch mới.</p></div></div>
    <section className="panel"><h2>Thêm ngôn ngữ</h2>
      <form onSubmit={submit} className="adm-form">
        <label>Mã (vd: vi)<input maxLength={8} value={form.code} onChange={e => setForm(v => ({ ...v, code: e.target.value }))} required pattern="[a-zA-Z]{2,8}" /></label>
        <label>Tên tiếng Việt<input maxLength={80} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required /></label>
        <label>Tên tiếng Anh<input maxLength={80} value={form.englishName} onChange={e => setForm(v => ({ ...v, englishName: e.target.value }))} required /></label>
        <button className="btn btn-primary" type="submit">Thêm</button>
      </form>
      {info ? <p role="alert">{info}</p> : null}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã</th><th>Tên tiếng Việt</th><th>Tên tiếng Anh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{langs.map(row => <tr key={row.code}><td>{row.code}</td>
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
    </section>
  </>;
}
