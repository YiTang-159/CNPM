import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD, HAS_API, isAdmin } from '../api/client.js';
import { stats as statsApi } from '../api/analytics.js';

/** Định dạng số theo ngôn ngữ đang chọn (1.234 / 1,234). */
const num = (L, n) => new Intl.NumberFormat(['vi-VN', 'en-US', 'zh-CN'][L]).format(n);
/** 2026-10-22 -> 22/10 */
const shortDate = (key) => key.slice(8) + '/' + key.slice(5, 7);

function Kpi({ label, value, note, id }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-num" data-testid={id}>{value}</p>
      <p className="kpi-note">{note}</p>
    </div>
  );
}

export default function Admin() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  usePageTitle('ad_title');
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const allowed = isAdmin(user);

  const load = useCallback(() => {
    if (!allowed) return;
    setFailed(false);
    statsApi.load(user).then(setData).catch(() => setFailed(true));
  }, [allowed, user]);

  useEffect(load, [load]);

  const head = (
    <div className="wrap page-head">
      <h1>{t('ad_title')}</h1>
      <p>{t('ad_sub')}</p>
    </div>
  );

  if (!user) {
    return (
      <>
        {head}
        <div className="wrap" style={{ paddingBottom: 96 }}>
          <p role="alert">{t('ad_need_login')}</p>
          <p className="fine">{t('ad_hint')} <strong>{ADMIN_EMAIL}</strong>{!HAS_API ? <> {t('ad_pass')} <strong>{ADMIN_PASSWORD}</strong></> : null}</p>
          <p style={{ marginTop: 20 }}><Link className="btn btn-primary" to="/login">{t('nav_login')}</Link></p>
        </div>
      </>
    );
  }
  if (!allowed) {
    return (
      <>
        {head}
        <div className="wrap" style={{ paddingBottom: 96 }}>
          <p role="alert">{t('ad_denied')}</p>
          <p className="fine">{t('ad_hint')} <strong>{ADMIN_EMAIL}</strong>{!HAS_API ? <> {t('ad_pass')} <strong>{ADMIN_PASSWORD}</strong></> : null}</p>
        </div>
      </>
    );
  }

  const st = data && data.stats;
  const max = st ? Math.max(1, ...st.series.map((d) => d.visitors)) : 1;

  return (
    <>
      {head}
      <div className="wrap" style={{ paddingBottom: 96 }}>
        <div className="admin-tools">
          <button type="button" className="btn btn-sm" onClick={load}>{t('ad_refresh')}</button>
          {!HAS_API ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => { statsApi.seed(); load(); }}>{t('ad_seed')}</button>
              <button type="button" className="btn btn-sm" onClick={() => { statsApi.reset(); load(); }}>{t('ad_reset')}</button>
            </>
          ) : null}
        </div>
        {!HAS_API ? <p className="fine" style={{ marginTop: 0 }}>{t('ad_local')}</p> : null}

        {failed ? <p role="alert">{t('ad_fail')}</p> : null}
        {!st && !failed ? <p role="status">{t('ad_loading')}</p> : null}

        {st ? (
          <>
            <div className="kpis">
              <Kpi id="ad-now" label={t('ad_now')} value={num(L, st.activeNow)} note={t('ad_now_d')} />
              <Kpi id="ad-today" label={t('ad_today')} value={num(L, st.today.visitors)} note={num(L, st.today.views) + ' ' + t('ad_views')} />
              <Kpi id="ad-week" label={t('ad_week')} value={num(L, st.week.visitors)} note={num(L, st.week.views) + ' ' + t('ad_views')} />
              <Kpi id="ad-total" label={t('ad_total')} value={num(L, st.total.visitors)} note={num(L, st.total.views) + ' ' + t('ad_views')} />
            </div>

            <h2 className="sec sub">{t('ad_chart')}</h2>
            <div className="bars" aria-hidden="true">
              {st.series.map((d) => (
                <div className="bar-col" key={d.date}>
                  <span className="bar-val">{num(L, d.visitors)}</span>
                  <span className="bar-fill" style={{ height: Math.round((d.visitors / max) * 100) + '%' }} />
                  <span className="bar-day">{shortDate(d.date)}</span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>{t('ad_chart')}</caption>
              <thead><tr><th scope="col">{t('ad_date')}</th><th scope="col">{t('ad_people')}</th><th scope="col">{t('ad_views')}</th></tr></thead>
              <tbody>
                {st.series.map((d) => (
                  <tr key={d.date}><th scope="row">{shortDate(d.date)}</th><td>{d.visitors}</td><td>{d.views}</td></tr>
                ))}
              </tbody>
            </table>

            <h2 className="sec sub">{t('ad_users')} ({data.users.length})</h2>
            {data.users.length ? (
              <table className="quote tbl">
                <thead><tr><th scope="col">{t('ad_name')}</th><th scope="col">{t('ad_email')}</th></tr></thead>
                <tbody>
                  {data.users.map((u) => <tr key={u.email}><th scope="row">{u.name}</th><td>{u.email}</td></tr>)}
                </tbody>
              </table>
            ) : <p className="fine">{t('ad_none')}</p>}
          </>
        ) : null}
      </div>
    </>
  );
}
