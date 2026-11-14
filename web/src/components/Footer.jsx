import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { CONTACT_EMAIL } from '../shared/publicConfig.js';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div>
            <Link className="brand" to="/" aria-label="Dubchef">
              <span className="mark" aria-hidden="true"><i /><i /><i /></span>
              Dubchef
            </Link>
            <p>{t('ft_tag')}</p>
          </div>
          <div>
            <h2>{t('ft_product')}</h2>
            <ul>
              <li><Link to="/features">{t('nav_features')}</Link></li>
              <li><Link to="/demo">{t('nav_demo')}</Link></li>
              <li><Link to="/pricing">{t('nav_pricing')}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t('ft_company')}</h2>
            <ul>
              <li><Link to="/about">{t('nav_about')}</Link></li>
              <li><Link to="/faq">{t('nav_faq')}</Link></li>
              <li><Link to="/contact">{t('nav_contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t('ft_legal')}</h2>
            <ul>
              <li><Link to="/terms">{t('tm_title')}</Link></li>
              <li><Link to="/privacy">{t('pv_title')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="copy">
          <span>{t('ft_copy')}</span>
          {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <Link to="/contact">{t('nav_contact')}</Link>}
        </div>
      </div>
    </footer>
  );
}
