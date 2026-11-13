import AdminT from './AdminTranslation.jsx';
import { Link } from 'react-router-dom';
import { adminHref } from '../utils/adminLinks.js';
/** Các thao tác điều hướng theo khách hàng chỉ lọc dữ liệu hiện có, không sửa bản ghi. */
export default function AdminCustomerContext({ email, title = 'Liên kết nghiệp vụ', compact = false }) {
  if (!email) return null;
  return <div className={`adm-context ${compact ? 'adm-context-compact' : ''}`}>
    {!compact && <div><strong>{title}</strong><small><AdminT vi={"Khách hàng:"} /> {email}</small></div>}
    <div className="adm-context-links">
      <Link to={adminHref('/admin/users', { email })}><AdminT vi={"Tài khoản"} /></Link>
      <Link to={adminHref('/admin/orders', { email })}><AdminT vi={"Đơn hàng"} /></Link>
      <Link to={adminHref('/admin/videos', { email })}><AdminT vi={"Video"} /></Link>
      <Link to={adminHref('/admin/feedback', { email })}><AdminT vi={"Phản hồi"} /></Link>
    </div>
  </div>;
}
