import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { HAS_API } from '../api/client.js';
import { stats as statsApi } from '../api/analytics.js';
import { adminApi } from '../api/admin.js';
import { Chart, Kpi, Trend, num, shortDate } from '../components/AdminWidgets.jsx';

const RANGES = [7, 14, 30];

export default function Admin() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  usePageTitle('ad_title');
  const [span, setSpan] = useState(7);
  const [st, setSt] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    statsApi.load(user, span).then((r) => setSt(r.stats)).catch(() => setFailed(true));
  }, [user, span]);
  useEffect(load, [load]);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{t('ad_title')}</h1>
          <p>{t('ad_sub')}</p>
        </div>
        <div className="adm-tools">
          <div className="seg" role="group" aria-label={t('ad_range')}>
            {RANGES.map((n) => (
              <button key={n} type="button" aria-pressed={span === n} onClick={() => setSpan(n)}>{t('ad_r' + n)}</button>
            ))}
          </div>
          <button type="button" className="btn btn-sm" onClick={load}>{t('ad_refresh')}</button>
          {!HAS_API ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => { statsApi.seed(); adminApi.seed(); load(); }}>{t('ad_seed')}</button>
              <button type="button" className="btn btn-sm" onClick={() => { statsApi.reset(); adminApi.clearSamples(); load(); }}>{t('ad_reset')}</button>
            </>
          ) : null}
        </div>
      </div>
      {!HAS_API ? <p className="adm-note">{t('ad_local')}</p> : null}

      {failed ? <p role="alert">{t('ad_fail')}</p> : null}
      {!st && !failed ? <p role="status">{t('ad_loading')}</p> : null}

      {st ? (
        <>
          <div className="kpis">
            <Kpi id="ad-now" label={t('ad_now')} value={num(L, st.activeNow)}>{t('ad_now_d')}</Kpi>
            <Kpi id="ad-today" label={t('ad_today')} value={num(L, st.today.visitors)}>
              <Trend id="ad-today-trend" cur={st.today.visitors} prev={st.yesterday.visitors} label={t('ad_vs_yday')} />
            </Kpi>
            <Kpi id="ad-period" label={t('ad_period') + ' (' + t('ad_r' + st.span) + ')'} value={num(L, st.period.visitors)}>
              <Trend id="ad-period-trend" cur={st.period.visitors} prev={st.prev.visitors} label={t('ad_vs_prev')} />
            </Kpi>
            <Kpi id="ad-total" label={t('ad_total')} value={num(L, st.total.visitors)}>
              {num(L, st.total.views)} {t('ad_views')}
            </Kpi>
          </div>

          <section className="panel" aria-labelledby="ad-chart-h">
            <div className="panel-head">
              <h2 id="ad-chart-h">{t('ad_chart')}</h2>
              <p className="fine-i">
                {t('ad_peak')}: <strong>{shortDate(st.peak.date)}</strong> ({num(L, st.peak.visitors)} {t('ad_people')})
              </p>
            </div>
            <Chart series={st.series} L={L} t={t} />
          </section>
        </>
      ) : null}
    </>
  );
}
