import AdminT from './AdminTranslation.jsx';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AdminIcon from './AdminIcon.jsx';

/** Menu tài khoản dành riêng cho Admin; không dẫn tới trang hồ sơ khách hàng. */
export default function AdminAccountMenu({ compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const holder = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (!holder.current?.contains(e.target)) setOpen(false); };
    const onEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const signOut = () => { setOpen(false); logout(); navigate('/', { replace: true }); };
  return <div ref={holder} className="admin-account-menu">
    <button type="button" className="admin-account-trigger" aria-haspopup="true" aria-expanded={open}
      aria-controls="admin-account-popover" onClick={() => setOpen(v => !v)}>
      <span className="admin-avatar" aria-hidden="true">{(user?.name || 'A').trim().charAt(0).toUpperCase()}</span>
      {!compact && <span className="admin-account-trigger-label"><strong>{user?.name || 'Admin'}</strong><small><AdminT vi={"Quản trị viên"} /></small></span>}
      <AdminIcon name="chevron-down" size={15} />
    </button>
    {open && <div id="admin-account-popover" className="admin-account-popover">
      <div className="admin-account-intro">
        <strong>{user?.name || 'Admin'}</strong><span>{user?.email || ''}</span><small><AdminT vi={"Tài khoản quản trị"} /></small>
      </div>
      <Link to="/admin/profile" onClick={() => setOpen(false)}><AdminIcon name="user" /> <AdminT vi={"Hồ sơ & bảo mật"} /></Link>
      <Link to="/" onClick={() => setOpen(false)}><AdminIcon name="external" /> <AdminT vi={"Xem website công khai"} /></Link>
      <button type="button" onClick={signOut}><AdminIcon name="logout" /> <AdminT vi={"Đăng xuất"} /></button>
    </div>}
  </div>;
}
