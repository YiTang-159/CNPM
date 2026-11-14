import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import Field from '../components/Field.jsx';
import Checkout from '../components/Checkout.jsx';
import { formatMoney } from '../shared/format.js';
import usePricingPolicy from '../hooks/usePricingPolicy.js';




export default function Pricing() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  usePageTitle('pr_title');
  // Quay lại từ trang đăng nhập/đăng ký: khôi phục số video đã chọn và mở lại khung thanh toán.
  const { state } = useLocation();
  const resume = state && state.resume;
  const initial = (n) => (Number.isInteger(n) && n > 0 ? String(n) : '3');
  const [uploads, setUploads] = useState(() => initial(resume && resume.uploads));
  const [outs, setOuts] = useState(() => initial(resume && resume.outs));
  const [yearly, setYearly] = useState(false);
  const {pricing, error:pricingError,refresh} = usePricingPolicy();
  const row = pricing?.currencies?.find(item=>item.currency===['VND','USD','CNY'][L]);
  const packs=pricing?.packs?.filter(x=>x.enabled) || [];
  const [confirmedVersion,setConfirmedVersion] = useState(null);
  useEffect(()=>{if(row && confirmedVersion===null)setConfirmedVersion(row.version);},[row,confirmedVersion]);
  const changed=Boolean(row && confirmedVersion!==null && row.version!==confirmedVersion);
  const minorFactor=L===0?1:100;
  const parseCount=txt=> {const v=String(txt).trim();return /^\d{1,6}$/.test(v) && Number(v)<=(row?.maxVideos??0)?Number(v):null;};
  const unitPrice=kind=>row? (kind===0?row.uploadMinor:row.translationMinor)/minorFactor:0;
  const calcPrice=(uploads,outs)=>({up:uploads*unitPrice(0),out:outs*unitPrice(1),total:uploads*unitPrice(0)+outs*unitPrice(1)});

  const u = parseCount(uploads);
  const o = parseCount(outs);
  const err = u == null || o == null ? 'pc_bad' : o>u*(row?.maxTranslations??0) ? 'pc_over' : null;
  const price = err || !row ? null : calcPrice(u,o);
  // Lỗi "nhập sai số" gắn vào ô bị sai; lỗi "dịch ra quá nhiều" gắn vào ô số video dịch ra.
  const upErr = u === null ? 'pc_bad' : null;
  const outErr = o === null ? 'pc_bad' : err === 'pc_over' ? 'pc_over' : null;

  function applyPack(pack) {
    setUploads(String(pack.uploads));
    setOuts(String(pack.outs));
    const el = document.getElementById('pc-up');
    if (el) el.focus();
  }

  return (
    <>
      <div className="wrap page-head">
        <h1>{t('pr_title')}</h1>
        <p>{t('pr_sub')}</p>
      </div>

      <div className="wrap">
        <h2 className="sec">{t('pc_title')}</h2>
        <div className="calc">
          <div>
            <Field id="pc-up" label={t('pc_up')} error={upErr && t(upErr)}>
              <input
                id="pc-up"
                inputMode="numeric"
                autoComplete="off"
                value={uploads}
                onChange={(e) => setUploads(e.target.value)}
                aria-invalid={upErr ? 'true' : undefined}
              />
            </Field>
            <Field id="pc-out" label={t('pc_out')} error={outErr && t(outErr)}>
              <input
                id="pc-out"
                inputMode="numeric"
                autoComplete="off"
                value={outs}
                onChange={(e) => setOuts(e.target.value)}
                aria-invalid={outErr ? 'true' : undefined}
                aria-describedby="pc-hint"
              />
            </Field>
            <p className="fine" id="pc-hint" style={{ marginTop: 0 }}>{row ? `${row.maxVideos} video / lượt, tối đa ${row.maxTranslations} bản dịch / video` : 'Đang tải giới hạn sử dụng...'}</p>
          </div>
          <div className="plan" aria-live="polite">
            {price ? (
              <>
                <table className="quote">
                  <thead>
                    <tr>
                      <th scope="col"><span className="sr-only">{t('pc_title')}</span></th>
                      <th scope="col">{t('pc_qty')}</th>
                      <th scope="col">{t('pc_unit')}</th>
                      <th scope="col">{t('pc_amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{t('pc_row_up')}</th>
                      <td>{u}</td>
                      <td>{formatMoney(L, unitPrice(0))}</td>
                      <td>{formatMoney(L, price.up)}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t('pc_row_out')}</th>
                      <td>{o}</td>
                      <td>{formatMoney(L, unitPrice(1))}</td>
                      <td>{formatMoney(L, price.out)}</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  <span>{t('pc_total')}</span>
                  <br />
                  <strong className="price" data-testid="pc-total">{formatMoney(L, price.total)}</strong>
                </p>
              </>
            ) : (
              <p role="status" className="fine" style={{margin:0}}>{!row ? pricingError || 'Đang tải bảng giá từ SQL...' : t(err)}</p>
            )}
          </div>
        </div>
        {changed && <div className="ops-notice" role="alert">
          Giá đã được cập nhật. Vui lòng kiểm tra số tiền mới và xác nhận trước khi thanh toán.
          <button className="btn btn-sm" type="button" onClick={()=>setConfirmedVersion(row.version)}>Tôi xác nhận giá mới</button>
        </div>}
        {price && !changed ? <Checkout uploads={u} outs={o} total={price.total}
          priceVersion={row.version} onPriceChanged={()=>refresh()} autoOpen={Boolean(resume)} /> : null}
      </div>

      <div className="section">
        <div className="wrap">
          <h2 className="sec">{t('pk_title')}</h2>
          <p className="fine" style={{ marginTop: 12 }}>{t('pk_sub')} Giá gói được tính theo số lượt và đơn giá hiện hành trong SQL Server.</p>
          <div className="plans packs">
            {packs.map((pack) => (
              <section className="plan" key={pack.id} aria-labelledby={'pk-' + pack.id}>
                <h3 id={'pk-' + pack.id}>{pack.name}</h3>
                <p>Quyền sử dụng gói được khai báo trong SQL Server.</p>
                <ul>
                  <li>{pack.uploads} {t('pk_vid')}</li>
                  <li>{pack.outs} {t('pk_out')}</li>
                </ul>
                <p className="price" data-testid={'pk-price-' + pack.id}>
                  {formatMoney(L, calcPrice(pack.uploads, pack.outs).total)}
                </p>
                <button type="button" className="btn" onClick={() => applyPack(pack)}>
                  {t('pk_use')}
                  <span className="sr-only"> – {t('pk' + pack.id + '_n')}</span>
                </button>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 96 }}>
        <h2 className="sec">Gói từ bảng giá SQL Server</h2>
        <p className="fine">Bảng dưới đây chỉ ước tính gói tháng/năm. Hệ thống hiện chưa bán thuê bao tự gia hạn; số tiền chính thức hiển thị trong khung thanh toán phía trên và tính lại tại máy chủ.</p>
        <div className="toggle" role="group" aria-label={t('pl_title')}>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>{t('pr_monthly')}</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>{t('pr_yearly')}</button>
        </div>
        <div className="plans">
          {packs.slice(0,3).map((pack,p) => {
            const n=p+1;
            const pick = p === 1;
            return (
              <section className={'plan' + (pick ? ' pick' : '')} key={n} aria-labelledby={'pl-' + n}>
                <h3 id={'pl-' + n}>
                  {pack.name}
                  {pick ? <span className="badge">{t('pl_pick')}</span> : null}
                </h3>
                <p className="price">
                  {formatMoney(L,calcPrice(pack.uploads,pack.outs).total*(yearly?1-row.annualDiscountPct/100:1))} <small>{t('pr_per')}</small>
                </p>
                <ul>
                  {[1, 2, 3].map((k) => <li key={k}>{t('pl' + n + '_' + k)}</li>)}
                </ul>
                {user ? <button className={'btn' + (pick ? ' btn-primary' : '')} type="button" onClick={() => {
                  applyPack(pack);
                  document.getElementById('pc-up')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}>Tính số video của gói</button> : <Link className={'btn' + (pick ? ' btn-primary' : '')} to="/register">
                  {p === 0 ? t('pl_c1') : t('pl_c')}
                </Link>}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
