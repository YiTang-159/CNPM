import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../shared/format.js';
import { CURRENCIES, HAS_PAYMENT_API, METHODS, orderAmount, orders, paymentPayload } from '../api/orders.js';
import QrCode from './QrCode.jsx';
import { isAdmin } from '../api/client.js';


const PAYMENT_TEXT = {
  unavailable: ['Thanh toán chưa được cấu hình trên máy chủ. Không thể xác nhận chuyển tiền.', 'Payments are not configured on the server.', '服务器尚未配置支付，无法确认转账。'],
  gateway: ['Thanh toán qua payOS (QR / chuyển khoản ngân hàng).', 'Secure payOS bank / QR checkout.', '通过 payOS 银行转账／二维码付款。'],
  onlyVnd: ['payOS hiện chỉ hỗ trợ đơn VND. Hãy chọn VI trước khi thanh toán.', 'payOS currently accepts VND orders only. Select VI for checkout.', 'payOS 当前仅支持越南盾订单，请选择 VI。'],
  open: ['Mở trang thanh toán payOS', 'Open payOS checkout', '打开 payOS 支付页面'],
  pending: ['Đang chờ payOS xác nhận thanh toán. Không bấm nút trên web để tự xác nhận đã chuyển tiền.', 'Waiting for verified payOS confirmation. This website cannot self-confirm payment.', '正在等待 payOS 验证支付。本网站不能自行确认到账。'],
  check: ['Kiểm tra trạng thái đơn', 'Check order status', '查询订单状态'],
  wait: ['Chưa có xác nhận từ ngân hàng. Hãy thử lại sau.', 'No bank confirmation yet. Please try again later.', '银行尚未确认，请稍后重试。'],
  realUnavailable: ['Hãy kiểm tra kết nối API thanh toán.', 'Please check payment API connection.', '请检查支付 API 连接。'],
  simulation: ['CHẾ ĐỘ THỬ NGHIỆM: không chuyển tiền thật.', 'DEMO MODE: no real bank transaction.', '演示模式：不会产生真实银行交易。'],
};

/** Nút Thanh toán và khung thanh toán cho số video đang chọn ở phần tính giá. */
export default function Checkout({ uploads, outs, total, autoOpen = false }) {
  const { t, L } = useI18n();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(autoOpen);
  const [method, setMethod] = useState('card');
  const [mode, setMode] = useState(HAS_PAYMENT_API ? 'loading' : import.meta.env.MODE === 'test' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_PAYMENT_DEMO === 'true') ? 'demo' : 'unavailable');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const txt = key => PAYMENT_TEXT[key]?.[L] || PAYMENT_TEXT[key]?.[0] || ''; 
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(null);
  const [recent, setRecent] = useState([]);
  const [pending, setPending] = useState(null); // đơn đã tạo, đang chờ khách quét mã QR
  const [step, setStep] = useState('form'); // 'form' hoặc 'qr'

  const refresh = useCallback(() => {
    if (user && !isAdmin(user)) orders.list(user.email).then(setRecent).catch(() => setRecent([]));
  }, [user]);
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);
  useEffect(() => {
    let mounted = true;
    if (open) orders.config().then((config) => {
      if (!mounted) return;
      setMode(config.mode);
      if (config.mode === 'payos') setMethod('qr');
    }).catch(() => { if (mounted) setMode('unavailable'); });
    return () => { mounted = false; };
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFailed(false);
    try {
      if (mode === 'loading' || mode === 'unavailable') throw new Error('payment_unavailable');
      if (mode === 'payos') {
        if (CURRENCIES[L] !== 'VND') throw new Error('currency_unsupported');
        // Dùng lại đơn pending cùng thông số nếu có, không tự tạo thêm lần thanh toán.
        const same = pending && pending.status === 'pending' && pending.uploads === uploads && pending.outs === outs && pending.currency === CURRENCIES[L];
        const existing = !same && recent.find(o => o.status === 'pending' && o.uploads === uploads && o.outs === outs && o.currency === CURRENCIES[L]);
        const order = same ? pending : existing || await orders.create({ name:user.name, email:user.email, uploads, outs, L });
        setPending(order);
        const info = await orders.checkout(order.id);
        setCheckoutUrl(info.checkoutUrl);
        setStep('gateway');
        setStatusMessage('');
        refresh();
        return;
      }
      if (method === 'qr') {
        // Đổi phương thức rồi quay lại thì dùng lại đơn cũ nếu số video và loại tiền không đổi, tránh tạo đơn trùng.
        const same = pending && pending.uploads === uploads && pending.outs === outs && pending.currency === CURRENCIES[L];
        setPending(same ? pending : await orders.create({ name: user.name, email: user.email, uploads, outs, L }));
        setStep('qr');
        refresh();
        return;
      }
      const order = await orders.create({ name: user.name, email: user.email, uploads, outs, L });
      const res = await orders.pay(order.id, method);
      setDone(res.order);
      refresh();
    } catch (err) {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  /** Khách đã quét mã và chuyển tiền: ghi nhận thanh toán bằng QR (giả lập, chưa nối ngân hàng thật). */
  async function confirmQr() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await orders.pay(pending.id, 'qr');
      setDone(res.order);
      setPending(null);
      setStep('form');
      refresh();
    } catch (err) {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function checkPayment() {
    if (!pending) return;
    setBusy(true);
    setFailed(false);
    try {
      const updated = await orders.status(pending.id);
      if (updated?.status === 'paid') {
        setDone(updated);
        setStep('form');
        refresh();
      } else setStatusMessage(txt('wait'));
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }

  function close() {
    setOpen(false);
    setDone(null);
    setFailed(false);
    setPending(null);
    setStep('form');
    setCheckoutUrl('');
    setStatusMessage('');
  }

  if (isAdmin(user)) return <div className="admin-purchase-gate" role="note">
    <strong>Bảng giá dành cho khách hàng</strong>
    <p>Tài khoản quản trị chỉ xem trước nội dung công khai. Hãy vào khu vực Admin để kiểm tra chính sách giá, đơn hàng và giao dịch.</p>
    <Link className="btn btn-sm btn-primary" to="/admin/pricing">Quản lý chính sách giá</Link>
  </div>;

  if (!open) {
    return (
      <p style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{t('co_btn')}</button>
      </p>
    );
  }

  return (
    <section className="checkout" aria-labelledby="co-h">
      <h3 id="co-h">{t('co_title')}</h3>
      <p className="fine">{mode === 'demo' ? txt('simulation') : mode === 'payos' ? txt('gateway') : txt('unavailable')}</p>

      {!user ? (
        <>
          <p role="alert">{t('co_need_login')}</p>
          <p style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/login" state={{ from: pathname, resume: { uploads, outs } }}>{t('nav_login')}</Link>
            <button type="button" className="btn" onClick={close}>{t('co_close')}</button>
          </p>
        </>
      ) : done ? (
        <div role="status">
          <p className="co-ok">✓ {t('co_ok')}</p>
          <dl className="co-sum">
            <dt>{t('co_code')}</dt><dd data-testid="co-order">#{done.id}</dd>
            <dt>{t('co_ref')}</dt><dd data-testid="co-ref">{done.ref}</dd>
            <dt>{t('pc_amount')}</dt><dd>{formatMoney(CURRENCIES.indexOf(done.currency), orderAmount(done))}</dd>
          </dl>
          <p style={{ marginTop: 14 }}><button type="button" className="btn" onClick={close}>{t('co_close')}</button></p>
        </div>
      ) : step === 'gateway' && pending ? (
        <div className="co-qr" data-testid="co-gateway-step">
          <p className="fine">{txt('pending')}</p>
          <dl className="co-sum">
            <dt>{t('co_code')}</dt><dd>#{pending.id}</dd>
            <dt>{t('pc_amount')}</dt><dd>{formatMoney(0, orderAmount(pending))}</dd>
          </dl>
          <p style={{ marginTop: 14 }}><a className="btn btn-primary" href={checkoutUrl} target="_blank" rel="noopener noreferrer">{txt('open')}</a></p>
          {statusMessage && <p role="status">{statusMessage}</p>}
          {failed && <p role="alert" className="err">{t('co_fail')}</p>}
          <p style={{ marginTop: 14, display:'flex', gap:10, flexWrap:'wrap' }}>
            <button type="button" className="btn" disabled={busy} onClick={checkPayment}>{busy ? t('co_busy') : txt('check')}</button>
            <button type="button" className="btn" onClick={close}>{t('co_close')}</button>
          </p>
        </div>
      ) : step === 'qr' && pending ? (
        <div className="co-qr" data-testid="co-qr-step">
          <p>{t('co_qr_scan')}</p>
          <QrCode value={paymentPayload(pending)} label={t('co_qr_alt')} size={220} testId="co-qrcode" />
          <dl className="co-sum">
            <dt>{t('co_code')}</dt><dd data-testid="co-qr-order">#{pending.id}</dd>
            <dt>{t('pc_amount')}</dt><dd>{formatMoney(CURRENCIES.indexOf(pending.currency), orderAmount(pending))}</dd>
            <dt>{t('co_qr_memo')}</dt><dd>DUBCHEF{pending.id}</dd>
          </dl>
          <p className="fine" style={{ marginTop: 12 }}>{t('co_qr_demo')}</p>
          {failed ? <p className="err" role="alert">{t('co_fail')}</p> : null}
          <p style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={confirmQr} disabled={busy}>{busy ? t('co_busy') : t('co_qr_done')}</button>
            <button type="button" className="btn" onClick={() => { setStep('form'); setFailed(false); }} disabled={busy}>{t('co_qr_back')}</button>
            <button type="button" className="btn" onClick={close} disabled={busy}>{t('co_close')}</button>
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <dl className="co-sum">
            <dt>{t('co_sum')}</dt>
            <dd>{uploads} / {outs} {t('co_sum_line')}</dd>
            <dt>{t('pc_total')}</dt>
            <dd><strong data-testid="co-total">{formatMoney(L, total)}</strong></dd>
          </dl>
          <fieldset className="co-methods">
            <legend>{t('co_method')}</legend>
            {(mode === 'payos' ? ['qr','bank'] : METHODS).map((m) => (
              <label key={m}>
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
                {t('co_' + m)}
              </label>
            ))}
          </fieldset>
          <p className="fine" style={{ marginTop: 12 }}>{mode === 'demo' ? txt('simulation') : mode === 'payos' ? txt('gateway') : txt('realUnavailable')}</p>
          {mode === 'payos' && CURRENCIES[L] !== 'VND' ? <p className="err" role="alert">{txt('onlyVnd')}</p> : null}
          {!HAS_PAYMENT_API && mode !== 'demo' ? <p className="fine" style={{ marginTop: 6 }}>{txt('realUnavailable')}</p> : null}
          {failed ? <p className="err" role="alert">{t('co_fail')}</p> : null}
          <p style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={busy || !['demo','payos'].includes(mode) || (mode === 'payos' && CURRENCIES[L] !== 'VND')}>{busy ? t('co_busy') : t(method === 'qr' ? 'co_qr_make' : 'co_pay')}</button>
            <button type="button" className="btn" onClick={close} disabled={busy}>{t('co_close')}</button>
          </p>
        </form>
      )}

      {user && recent.length ? (
        <div className="co-recent">
          <h4>{t('co_orders')}</h4>
          <ul>
            {recent.map((o) => (
              <li key={o.id}>
                <span>#{o.id}</span>
                <span>{formatMoney(CURRENCIES.indexOf(o.currency), orderAmount(o))}</span>
                <span className={'chip ' + (o.status === 'paid' ? 'active' : 'locked')}>{t(o.status === 'paid' ? 'co_paid' : 'co_pending')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
