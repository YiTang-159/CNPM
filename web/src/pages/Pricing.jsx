import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { formatMoney, planPrice } from '../shared/format.js';

const PLANS = [1, 2, 3];

export default function Pricing() {
  const { t, L } = useI18n();
  const [yearly, setYearly] = useState(false);
  usePageTitle('pr_title');

  return (
    <>
      <div className="wrap page-head">
        <h1>{t('pr_title')}</h1>
        <p>{t('pr_sub')}</p>
        <div className="toggle" role="group" aria-label={t('pr_title')}>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>{t('pr_monthly')}</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>{t('pr_yearly')}</button>
        </div>
      </div>
      <div className="wrap">
        <div className="plans">
          {PLANS.map((n, p) => {
            const pick = p === 1;
            return (
              <div className={'plan' + (pick ? ' pick' : '')} key={n}>
                <h3>
                  {t('pl' + n)}
                  {pick ? <span className="badge">{t('pl_pick')}</span> : null}
                </h3>
                <div className="price">
                  {formatMoney(L, planPrice(L, p, yearly))} <small>{t('pr_per')}</small>
                </div>
                <ul>
                  <li>{t('pl' + n + '_1')}</li>
                  <li>{t('pl' + n + '_2')}</li>
                  <li>{t('pl' + n + '_3')}</li>
                </ul>
                <Link className={'btn' + (pick ? ' btn-primary' : '')} to="/register">
                  {p === 0 ? t('pl_c1') : t('pl_c')}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="fine"><Link to="/faq">{t('pr_faq')}</Link></p>
        <div style={{ height: 84 }} />
      </div>
    </>
  );
}
