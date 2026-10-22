import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { HAS_API } from '../api/client.js';
import { stats as statsApi, change } from '../api/analytics.js';
import { adminApi } from '../api/admin.js';

const RANGES = [7, 14, 30];

/** Định dạng số theo ngôn ngữ đang chọn (1.234 / 1,234). */
const num = (L, n) => new Intl.NumberFormat(['vi-VN', 'en-US', 'zh-CN'][L]).format(n);
/** 2026-10-22 -> 22/10 */
const shortDate = (key) => key.slice(8) + '/' + key.slice(5, 7);

/** Mũi tên và phần trăm thay đổi (không chỉ dựa vào màu). */
function Trend({ cur, prev, label, id }) {
  const pct = change(cur, prev);
  if (pct === null) return <span className="trend flat" data-testid={id}>–</span>;
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '■';
  return (
    <span className={'trend ' + dir} data-testid={id}>
      {arrow} {pct > 0 ? '+' : ''}{pct}% <span className="trend-l">{label}</span>
    </span>
  );
}

function Kpi({ label, value, id, children }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-num" data-testid={id}>{value}</p>
      <p className="kpi-note">{children}</p>
    </div>
  );
}

/** Biểu đồ đường + vùng tô: người truy cập (nét liền) và lượt xem (nét đứt). */
function Chart({ series, L, t }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 260, padL = 44, padR = 12, padT = 16, padB = 30;
  const top = Math.max(4, ...series.map((d) => d.views));
  const niceTop = Math.ceil(top / 4) * 4;
  const x = (i) => padL + (series.length === 1 ? 0 : (i * (W - padL - padR)) / (series.length - 1));
  const y = (v) => padT + (1 - v / niceTop) * (H - padT - padB);
  const line = (key) => series.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d[key]).toFixed(1)).join(' ');
  const area = line('visitors') + ` L${x(series.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => (niceTop * k) / 4);
  const every = Math.ceil(series.length / 8);
  const h = hover === null ? null : series[hover];

  return (
    <div className="chart">
      <div className="legend" aria-hidden="true">
        <span><i className="sw v" />{t('ad_legend_v')}</span>
        <span><i className="sw p" />{t('ad_legend_p')}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('ad_chart')} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} />
            <text className="axis" x={padL - 8} y={y(v) + 4} textAnchor="end">{num(L, Math.round(v))}</text>
          </g>
        ))}
        <path className="area" d={area} />
        <path className="ln-p" d={line('views')} />
        <path className="ln-v" d={line('visitors')} />
        {series.map((d, i) => (
          i % every === 0 || i === series.length - 1 ? (
            <text key={d.date} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{shortDate(d.date)}</text>
          ) : null
        ))}
        {h ? (
          <g>
            <line className="cross" x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} />
            <circle className="dot" cx={x(hover)} cy={y(h.visitors)} r="5" />
          </g>
        ) : null}
        {series.map((d, i) => (
          <rect key={d.date} x={x(i) - (W - padL - padR) / series.length / 2} y={padT} width={(W - padL - padR) / series.length} height={H - padT - padB} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      <p className="tip" aria-live="polite">
        {h ? <><strong>{shortDate(h.date)}</strong> · {num(L, h.visitors)} {t('ad_people')} · {num(L, h.views)} {t('ad_views')}</> : ' '}
      </p>
      <table className="sr-only">
        <caption>{t('ad_chart')}</caption>
        <thead><tr><th scope="col">{t('ad_date')}</th><th scope="col">{t('ad_people')}</th><th scope="col">{t('ad_views')}</th></tr></thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.date}><th scope="row">{shortDate(d.date)}</th><td>{d.visitors}</td><td>{d.views}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
