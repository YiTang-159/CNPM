import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { trackScan } from '../api/qr.js';

/** Trang đích của mã QR: ghi một lượt quét rồi mời khách vào trải nghiệm, không cần đăng nhập. */
export default function Guest() {
  const { t, lang } = useI18n();
  usePageTitle('pt_guest');

  // Chỉ ghi khi mở trang (không ghi lại khi đổi ngôn ngữ); trackScan tự bỏ qua lần tải lại trong cùng phiên.
  useEffect(() => {
    trackScan(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hero">
      <div className="wrap hero-center">
        <h1>{t('gu_title')}</h1>
        <p className="lead">{t('gu_sub')}</p>
        <div className="cta-row">
          <Link className="btn btn-primary" to="/demo">{t('gu_go')}</Link>
          <Link className="btn" to="/features">{t('h_cta2')}</Link>
          <Link className="btn" to="/register">{t('gu_signup')}</Link>
        </div>
      </div>
    </div>
  );
}
