import AdminT, { useAdminT } from '../components/AdminTranslation.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { workApi } from '../api/workflows.js';
import PasswordInput from '../components/PasswordInput.jsx';

/** Hồ sơ Admin dùng API /api/me hiện có; không dùng trang Account của khách. */
export default function AdminProfile() {
  const tr = useAdminT();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function saveProfile(event) {
    event.preventDefault();
    setError(''); setStatus('');
    if (!name.trim() || name.trim().length > 100) { setError('Tên hiển thị phải từ 1 đến 100 ký tự.'); return; }
    setBusy(true);
    try {
      const result = await workApi.updateProfile(name.trim());
      updateUser(result.user);
      setStatus('Đã cập nhật thông tin quản trị viên trong SQL Server.');
    } catch (e) { setError('Không thể cập nhật hồ sơ. Hãy kiểm tra kết nối hoặc đăng nhập lại.'); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError(''); setStatus('');
    if (passwords.next.length < 8 || passwords.next.length > 200 || passwords.next !== passwords.confirm) {
      setError('Mật khẩu mới cần từ 8 đến 200 ký tự và phải trùng với ô xác nhận.'); return;
    }
    if (!passwords.current) { setError('Nhập mật khẩu hiện tại trước khi thay đổi.'); return; }
    setBusy(true);
    try {
      await workApi.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setStatus('Đổi mật khẩu thành công. Hãy dùng mật khẩu mới trong lần đăng nhập sau.');
    } catch (e) { setError('Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại và kết nối API.'); }
    finally { setBusy(false); }
  }

  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Hồ sơ & bảo mật"} /></h1><p><AdminT vi={"Cập nhật thông tin đăng nhập quản trị. Thay đổi được lưu qua API và SQL Server."} /></p></div>
      <Link to="/admin/dashboard" className="btn btn-sm"><AdminT vi={"Về tổng quan"} /></Link></div>
    {status && <p className="adm-profile-success" role="status">{tr(status)}</p>}
    {error && <p className="adm-profile-error" role="alert">{tr(error)}</p>}
    <div className="adm-profile-grid">
      <section className="panel adm-profile-card"><h2><AdminT vi={"Thông tin tài khoản"} /></h2><p className="fine-i"><AdminT vi={"Bạn đang đăng nhập với vai trò quản trị viên."} /></p>
        <form onSubmit={saveProfile}>
          <label htmlFor="admin-profile-name"><AdminT vi={"Tên hiển thị"} /></label>
          <input id="admin-profile-name" value={name} maxLength={100} required onChange={e => setName(e.target.value)} />
          <label htmlFor="admin-profile-email"><AdminT vi={"Email đăng nhập"} /></label>
          <input id="admin-profile-email" value={user?.email || ''} readOnly />
          <p className="fine-i"><AdminT vi={"Email và vai trò quản trị không thể thay đổi tại đây."} /></p>
          <button type="submit" className="btn btn-primary" disabled={busy}><AdminT vi={"Lưu thông tin"} /></button>
        </form>
      </section>
      <section className="panel adm-profile-card"><h2><AdminT vi={"Đổi mật khẩu"} /></h2><p className="fine-i"><AdminT vi={"Chỉ thay đổi mật khẩu của tài khoản đang đăng nhập."} /></p>
        <form onSubmit={savePassword}>
          <label htmlFor="admin-pass-current"><AdminT vi={"Mật khẩu hiện tại"} /></label>
          <PasswordInput id="admin-pass-current" autoComplete="current-password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          <label htmlFor="admin-pass-next"><AdminT vi={"Mật khẩu mới"} /></label>
          <PasswordInput id="admin-pass-next" autoComplete="new-password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} />
          <label htmlFor="admin-pass-confirm"><AdminT vi={"Xác nhận mật khẩu mới"} /></label>
          <PasswordInput id="admin-pass-confirm" autoComplete="new-password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          <button type="submit" className="btn btn-primary" disabled={busy}><AdminT vi={"Cập nhật mật khẩu"} /></button>
        </form>
      </section>
    </div>
  </>;
}
