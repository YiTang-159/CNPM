import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { HAS_API } from '../api/client.js';
import { Kpi } from '../components/AdminWidgets.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';
const number = (n) => new Intl.NumberFormat('vi-VN').format(Number(n ?? 0));
const date = (v) => v ? new Date(v).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
const money = (n, currency) => `${number(n)} ${String(currency || '').trim()}`;
const summaryCards = [
  ['totalUsers', 'Người dùng', '/admin/users', 'Tài khoản đã tạo'],
  ['totalVideos', 'Video', '/admin/videos', 'Video đã tải lên'],
  ['totalNarrations', 'Thuyết minh', '/admin/narrations', 'Bản nội dung đã lưu'],
  ['totalSubtitles', 'Phụ đề', '/admin/subtitles', 'Bản phụ đề đã lưu'],
  ['totalFeedback', 'Phản hồi', '/admin/feedback', 'Gồm phản hồi và liên hệ'],
  ['totalOrders', 'Đơn hàng', '/admin/orders', 'Bao gồm mọi trạng thái'],
  ['totalLanguages', 'Ngôn ngữ', '/admin/languages', 'Danh mục ngôn ngữ'],
  ['totalQrScans', 'Lượt quét QR', '/admin/qr', 'Lượt quét ghi nhận'],
];

function DataTable({ heading, to, columns, rows, fields }) {
  return <section className="panel dashboard-table">
    <div className="panel-head"><h2>{heading}</h2><Link to={to}>Xem tất cả →</Link></div>
    <div className="tbl-wrap"><table className="utable">
      <thead><tr>{columns.map(c=><th scope="col" key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((r,i)=><tr key={r.id ?? i}>
        {fields.map((fn,j)=><td key={j}>{fn(r)}</td>)}
      </tr>) : <tr><td colSpan={columns.length}>Chưa có dữ liệu trong SQL Server.</td></tr>}</tbody>
    </table></div>
  </section>;
}

/** Dữ liệu thật từ DubchefDB, chỉ Admin có token mới gọi được endpoint. */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (signal) => {
    if (!HAS_API) { setLoading(false); setError('Trang tổng hợp cần kết nối Backend SQL Server.'); return; }
    if (!user?.token) { setLoading(false); setError('Vui lòng đăng nhập lại tài khoản Admin.'); return; }
    setLoading(true);setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${user.token}` }, signal
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 || res.status === 403
        ? 'Phiên Admin không hợp lệ hoặc không đủ quyền.'
        : `Không đọc được SQL Server (HTTP ${res.status}).`);
      if (!signal?.aborted) setData(result);
    } catch (e) { if (e.name !== 'AbortError') setError(e.message || 'Lỗi kết nối máy chủ.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [user?.token]);
  useEffect(() => { const controller = new AbortController();load(controller.signal);
    return () => controller.abort(); }, [load]);

  const st = data?.statistics || {};
  const latest = data?.latest || {};
  return <>
    <div className="adm-head">
      <div><h1>Tổng hợp hệ thống</h1><p>Dữ liệu thực từ DubchefDB · Cập nhật lần cuối: {date(data?.generatedAt)}</p></div>
      <button type="button" className="btn btn-sm" onClick={() => load()}>Làm mới dữ liệu</button>
    </div>
    {loading && <p role="status">Đang tải dữ liệu từ SQL Server…</p>}
    {error && <p role="alert" className="err">{error}</p>}
    {data && <>
      <div className="kpis dashboard-kpis">
        {summaryCards.map(([key,title,to,description]) =>
          <Link to={to} className="dashboard-kpi-link" key={key}>
            <Kpi label={title} value={number(st[key])}>{description}</Kpi>
          </Link>)}
      </div>
      <section className="panel">
        <div className="panel-head"><h2>Cần chú ý</h2><span className="fine-i">Tự tổng hợp từ nhiều bảng</span></div>
        <div className="dashboard-alerts">
          <Link to="/admin/feedback"><b>{number(st.openFeedback)}</b><span>Phản hồi chưa giải quyết</span></Link>
          <Link to="/admin/videos"><b>{number(st.processingVideos)}</b><span>Video đang xử lý</span></Link>
          <Link to="/admin/orders"><b>{number(st.pendingOrders)}</b><span>Đơn hàng đang chờ</span></Link>
          <Link to="/admin/narrations"><b>{number(st.pendingMediaReview)}</b><span>Thuyết minh / phụ đề chờ duyệt</span></Link>
          <Link to="/admin/feedback"><b>{number(st.urgentFeedback)}</b><span>Phản hồi ưu tiên cao cần xử lý</span></Link>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>Đơn đã đánh dấu thanh toán theo loại tiền</h2><Link to="/admin/orders">Quản lý đơn hàng →</Link></div>
        <p className="fine-i">{data.paymentNote}</p>
        <div className="dashboard-currencies">
          {data.paidOrdersByCurrency?.length ? data.paidOrdersByCurrency.map(c =>
            <div className="dashboard-currency" key={c.currency}>
              <span>{String(c.currency).trim()}</span><strong>{money(c.amount,c.currency)}</strong>
              <small>{number(c.orders)} đơn</small>
            </div>) : <p>Chưa có đơn nào được đánh dấu đã thanh toán.</p>}
        </div>
      </section>
      <div className="dashboard-tables">
        <DataTable heading="Người dùng mới" to="/admin/users" columns={['Họ tên','Email','Trạng thái','Thời điểm']}
          rows={latest.users || []} fields={[
            r=>r.name, r=>r.email, r=>r.status, r=>date(r.createdAt)]}/>
        <DataTable heading="Video mới tải" to="/admin/videos" columns={['Video','Chủ sở hữu','Trạng thái','Kết quả']}
          rows={latest.videos || []} fields={[
            r=>r.title, r=>r.email, r=>r.status, r=>`${number(r.narrations)} TM · ${number(r.subtitles)} PĐ`]}/>
        <DataTable heading="Phản hồi gần nhất" to="/admin/feedback" columns={['Người gửi','Nội dung','Trạng thái','Ngày']}
          rows={latest.feedback || []} fields={[
            r=>r.email, r=>r.message, r=>r.status, r=>date(r.createdAt)]}/>
        <DataTable heading="Đơn hàng mới nhất" to="/admin/orders" columns={['Khách hàng','Số tiền','Trạng thái','Ngày']}
          rows={latest.orders || []} fields={[
            r=>r.email, r=>money(r.amount,r.currency), r=>r.status, r=>date(r.createdAt)]}/>
      </div>
      <p className="fine-i">Mỗi thông tin có trang quản lý chi tiết. Dashboard chỉ đọc và không thay đổi bản ghi.</p>
    </>}
  </>;
}
