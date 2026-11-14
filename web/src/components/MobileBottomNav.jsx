import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin } from '../api/client.js';

/** Mobile-only bottom navigation; never visible with desktop header or Admin screens. */
export default function MobileBottomNav() {
  const { user } = useAuth();
  if (isAdmin(user)) return null;
  const links = [
    ['/', '⌂', 'Trang chủ'],
    ['/demo', '▶', 'Thử'],
    ['/pricing', '₫', 'Bảng giá'],
    [user ? '/account' : '/login', '◉', 'Tài khoản'],
  ];
  return <nav className="mobile-bottom-tabs" aria-label="Điều hướng dưới cùng cho điện thoại">
    {links.map(([to,symbol,label])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>isActive?'active':''}>
      <span aria-hidden="true">{symbol}</span><span>{label}</span>
    </NavLink>)}
  </nav>;
}
