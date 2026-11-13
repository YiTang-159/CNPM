import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { HAS_API } from '../api/client.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { trackVisit } from '../api/analytics.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin } from '../api/client.js';
import { Link } from 'react-router-dom';

export default function Layout() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  const adminPreview = isAdmin(user);
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // Mỗi lần đổi trang: cuộn lên đầu và đưa tiêu điểm vào nội dung (hỗ trợ đọc màn hình)
  useEffect(() => {
    window.scrollTo(0, 0);
    if (mainRef.current) mainRef.current.focus({ preventScroll: true });
  }, [pathname]);

  // Ghi một lượt xem cho trang Admin mỗi lần mở trang mới (không ghi lại khi chỉ đổi ngôn ngữ).
  const lang = ['vi', 'en', 'zh'][L];
  const langRef = useRef(lang);
  langRef.current = lang;
  useEffect(() => {
    trackVisit(pathname, langRef.current);
  }, [pathname]);

  const skip = (e) => {
    e.preventDefault();
    if (mainRef.current) mainRef.current.focus();
  };

  return (
    <>
      <a className="skip" href="#main" onClick={skip}>{t('skip')}</a>
      <Header />
      <main id="main" tabIndex={-1} ref={mainRef}>
        {adminPreview && <div className="admin-preview-banner" role="status"><div className="wrap admin-preview-banner-inner"><span>Bạn đang xem giao diện công khai, không phải khu vực quản lý.</span><Link to="/admin/dashboard">Quay về Dashboard</Link></div></div>}
        {import.meta.env.PROD && !HAS_API ? <p className="wrap note" role="note" style={{ paddingTop: 16 }}>
          {[
            'Website đang mở ở chế độ xem và trải nghiệm trên thiết bị. Đăng nhập, lưu dữ liệu và quản trị sẽ hoạt động khi kết nối máy chủ được cấu hình.',
            'You can browse and try video processing on this device. Sign-in, saving and administration require a configured server connection.',
            '您可以浏览网站并在设备上体验视频处理。登录、保存数据和管理功能需要配置服务器连接。',
          ][L]}
        </p> : null}
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

