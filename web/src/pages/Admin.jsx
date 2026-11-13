import AdminT from '../components/AdminTranslation.jsx';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { HAS_API } from '../api/client.js';
import { stats as statsApi } from '../api/analytics.js';
import { adminApi } from '../api/admin.js';
import { Chart, Kpi, Trend, num, shortDate } from '../components/AdminWidgets.jsx';

const RANGES=[7,14,30];
/** Tránh trùng dashboard: trang này chỉ tập trung các chỉ số truy cập theo thời gian. */
export default function Admin() {
  const { t,L }=useI18n();
  const { user }=useAuth();
  usePageTitle('ad_title');
  const [span,setSpan]=useState(7);
  const [st,setSt]=useState(null);
  const [failed,setFailed]=useState(false);
  const load=useCallback(async()=>{
    setFailed(false);
    try {const res=await statsApi.load(user,span);setSt(res.stats);}catch {setFailed(true);}
  },[user,span]);
  useEffect(()=>{load();},[load]);
  useAutoRefresh(load);
  return <>
    <div className="adm-head"><div><h1><AdminT vi={"Thống kê truy cập"} /></h1>
      <p><AdminT vi={"Theo dõi người truy cập và lượt xem theo thời gian. Dữ liệu vận hành, đơn hàng và công việc nằm tại Tổng quan hệ thống."} /></p></div>
      <div className="adm-tools"><Link className="btn btn-sm" to="/admin/dashboard"><AdminT vi={"Về tổng quan"} /></Link>
        <div className="seg" role="group" aria-label={t('ad_range')}>
          {RANGES.map(n=><button key={n} type="button" aria-pressed={span===n} onClick={()=>setSpan(n)}>{t('ad_r'+n)}</button>)}
        </div><button type="button" className="btn btn-sm" onClick={load}>{t('ad_refresh')}</button>
      </div></div>
    {!HAS_API&&<p className="adm-note">{t('ad_local')} <button type="button" className="btn btn-sm" onClick={()=>{statsApi.seed();adminApi.seed();load();}}>{t('ad_seed')}</button> <button type="button" className="btn btn-sm" onClick={()=>{statsApi.reset();adminApi.clearSamples();load();}}>{t('ad_reset')}</button></p>}
    {failed&&<p role="alert" className="ops-notice"><AdminT vi={"Không tải được thống kê. Kiểm tra kết nối API hoặc đăng nhập lại."} /></p>}
    {!st&&!failed&&<p role="status">{t('ad_loading')}</p>}
    {st&&<><div className="kpis">
      <Kpi id="ad-now" label={t('ad_now')} value={num(L,st.activeNow)}>{t('ad_now_d')}</Kpi>
      <Kpi id="ad-today" label={t('ad_today')} value={num(L,st.today.visitors)}><Trend id="ad-today-trend" cur={st.today.visitors} prev={st.yesterday.visitors} label={t('ad_vs_yday')}/></Kpi>
      <Kpi id="ad-period" label={t('ad_period')+' ('+t('ad_r'+st.span)+')'} value={num(L,st.period.visitors)}><Trend id="ad-period-trend" cur={st.period.visitors} prev={st.prev.visitors} label={t('ad_vs_prev')}/></Kpi>
      <Kpi id="ad-total" label={t('ad_total')} value={num(L,st.total.visitors)}>{num(L,st.total.views)} {t('ad_views')}</Kpi>
    </div><section className="panel" aria-labelledby="ad-chart-h"><div className="panel-head"><h2 id="ad-chart-h">{t('ad_chart')}</h2>
      <p className="fine-i">{t('ad_peak')}: <strong>{shortDate(st.peak.date)}</strong> ({num(L,st.peak.visitors)} {t('ad_people')})</p></div><Chart series={st.series} L={L} t={t}/></section></>}
  </>;
}
