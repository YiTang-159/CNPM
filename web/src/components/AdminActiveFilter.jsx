import { Link } from 'react-router-dom';
/** Báo rõ ngữ cảnh khi đi từ một trang nghiệp vụ sang trang khác. */
export default function AdminActiveFilter({ params, base }) {
  const email = params.get('email');
  const videoId = params.get('videoId');
  const orderId = params.get('orderId');
  if (!email && !videoId && !orderId) return null;
  const parts = [email && `Khách hàng: ${email}`, videoId && `Video #${videoId}`, orderId && `Đơn #${orderId}`].filter(Boolean);
  return <div className="adm-active-filter" role="status"><span>Đang tra cứu theo {parts.join(' · ')}.</span>
    <Link to={base}>Xem toàn bộ danh sách</Link></div>;
}
