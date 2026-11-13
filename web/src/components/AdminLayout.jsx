import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin } from '../api/client.js';
import { LANGS } from '../shared/i18n.js';
import { ADMIN_GROUPS, ADMIN_LINKS, currentAdminLink } from './AdminNavigation.js';
import AdminIcon from './AdminIcon.jsx';
import AdminAccountMenu from './AdminAccountMenu.jsx';
import './AdminUnified.css';

const LANG_LABEL = { vi: 'VI', en: 'EN', zh: '中文' };

export default function AdminLayout() {
  const { t, L, setL } = useI18n();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');
  const searchRef = useRef(null);
  const current = pathname === '/admin/profile' ? { name: 'Hồ sơ & bảo mật' } : currentAdminLink(pathname);
  const filteredLinks = ADMIN_LINKS.filter(link => `${link.name} ${link.hint}`.toLocaleLowerCase('vi').includes(jumpQuery.trim().toLocaleLowerCase('vi')));

  useEffect(() => { setMenuOpen(false); setJumpOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setJumpOpen(value => !value);
      } else if (event.key === 'Escape') { setJumpOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (jumpOpen) searchRef.current?.focus(); }, [jumpOpen]);

  if (!isAdmin(user)) return <main id="main" className="adm-gate"><div className="adm-card">
    <h1>{t('ad_brand')}</h1><p role="alert">{t(user ? 'ad_denied' : 'ad_need_login')}</p>
    <p className="fine">Chỉ tài khoản Admin hợp lệ trên SQL Server mới có quyền truy cập.</p>
    <p style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {!user && <Link className="btn btn-primary" to="/login">{t('nav_login')}</Link>}
      <Link className="btn" to="/">{t('ad_back')}</Link>
    </p></div></main>;

  return <div className="adm adm-unified">
    {menuOpen && <button type="button" aria-label="Đóng menu quản trị" className="adm-overlay" onClick={() => setMenuOpen(false)} />}
    <aside className={`adm-side ${menuOpen ? 'is-open' : ''}`}>
      <div className="adm-side-head">
        <Link className="brand" to="/admin/dashboard" aria-label="Dubchef - Tổng quan quản trị">
          <span className="mark" aria-hidden="true"><i /><i /><i /></span> Dubchef
        </Link>
        <span className="adm-side-kicker">KHÔNG GIAN QUẢN TRỊ</span>
        <button type="button" className="adm-mobile-close" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}><AdminIcon name="close" /></button>
      </div>
      <nav aria-label="Điều hướng quản trị" className="adm-nav">
        {ADMIN_GROUPS.map(group => <div className="adm-nav-group" key={group.title}>
          <span className="adm-group-label">{group.title}</span>
          {group.links.map(link => <NavLink key={link.to} to={link.to} end={link.end ?? true} title={link.hint}
            className={({ isActive }) => `adm-nav-link ${isActive ? 'is-active' : ''}`}>
            <AdminIcon name={link.icon} /><span>{link.name}</span>
          </NavLink>)}
        </div>)}
      </nav>
      <div className="adm-side-footer">
        <div className="adm-mobile-language lang" role="group" aria-label={t('langlabel')}>
          {LANGS.map((code,n)=><button key={code} type="button" lang={code==='zh'?'zh-CN':code} aria-pressed={n===L} onClick={()=>setL(n)}>{LANG_LABEL[code]}</button>)}
        </div>
        <small>Dubchef · Không gian làm việc nội bộ</small></div>
    </aside>
    <div className="adm-main">
      <header className="adm-top">
        <div className="adm-top-context">
          <button className="adm-menu-toggle" type="button" aria-label="Mở menu quản trị" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><AdminIcon name="menu" /></button>
          <div className="adm-crumb"><span>Quản trị</span><AdminIcon name="chevron" size={13}/><strong>{current.name}</strong></div>
        </div>
        <div className="adm-top-actions">
          <button type="button" className="adm-jump-button" aria-expanded={jumpOpen} aria-controls="adm-jump" onClick={() => {setJumpQuery('');setJumpOpen(v=>!v);}}>
            <AdminIcon name="search" /><span>Đi nhanh đến chức năng</span><kbd>Ctrl K</kbd>
          </button>
          <div className="lang" role="group" aria-label={t('langlabel')}>
            {LANGS.map((code,n)=><button key={code} type="button" lang={code === 'zh' ? 'zh-CN' : code} aria-pressed={n===L} onClick={() => setL(n)}>{LANG_LABEL[code]}</button>)}
          </div>
          <Link className="adm-public-link" to="/" title="Xem website dành cho khách hàng"><AdminIcon name="external" size={16} /><span>Xem website</span></Link>
          <AdminAccountMenu />
        </div>
        {jumpOpen && <div className="adm-jump-panel" id="adm-jump" role="dialog" aria-label="Đi nhanh đến chức năng">
          <label htmlFor="adm-jump-input">Tìm chức năng quản trị</label>
          <input id="adm-jump-input" ref={searchRef} type="search" value={jumpQuery} onChange={e=>setJumpQuery(e.target.value)}
            placeholder="Ví dụ: thanh toán, phụ đề, phản hồi…"
            onKeyDown={e=>{if(e.key==='Enter' && filteredLinks[0]) {navigate(filteredLinks[0].to);setJumpOpen(false);}}}/>
          <div className="adm-jump-results">{filteredLinks.map(link => <Link key={link.to} to={link.to} onClick={()=>setJumpOpen(false)}><AdminIcon name={link.icon} />
            <span><strong>{link.name}</strong><small>{link.hint}</small></span></Link>)}
            {!filteredLinks.length && <p>Không tìm thấy chức năng phù hợp.</p>}
          </div>
          <button type="button" className="adm-jump-dismiss" onClick={()=>setJumpOpen(false)}>Đóng (Esc)</button>
        </div>}
      </header>
      <main id="main" tabIndex={-1} className="adm-content"><Outlet /></main>
    </div>
  </div>;
}
