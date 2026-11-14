import { useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { api, errorKey, SHARED } from '../api/client.js';
import Field from '../components/Field.jsx';
import { CONTACT_EMAIL } from '../shared/publicConfig.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', email: '', msg: '' };

export default function Contact() {
  const { t } = useI18n();
  usePageTitle('c_title');
  const [v, setV] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [ok, setOk] = useState(false);
  const [srvErr, setSrvErr] = useState('');
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (sending.current) return;
    const er = {};
    if (!v.name.trim()) er.name = 'e_name';
    if (!EMAIL.test(v.email.trim())) er.email = 'e_email';
    if (!v.msg.trim()) er.msg = 'e_msg';
    setErrs(er);
    setOk(false);
    setSrvErr('');
    const bad = Object.keys(er);
    if (bad.length) {
      const el = document.getElementById('c-' + bad[0]);
      if (el) el.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      await api.contact({ name: v.name.trim(), email: v.email.trim(), message: v.msg.trim() });
      setOk(true);
      setV(EMPTY);
    } catch (x) {
      setSrvErr(errorKey(x));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <div className="wrap page-head">
        <h1>{t('c_title')}</h1>
        <p>{t('c_sub')}</p>
      </div>
      <div className="wrap two" style={{ paddingBottom: 96 }}>
        <form onSubmit={submit} noValidate>
          {ok ? <p className="ok" role="status">{t('c_ok')}</p> : null}
          {srvErr ? <p className="err" role="alert" style={{ marginBottom: 16 }}>{t(srvErr)}</p> : null}
          <Field id="c-name" label={t('f_name')} error={errs.name && t(errs.name)}>
            <input id="c-name" autoComplete="name" value={v.name} onChange={set('name')} aria-invalid={errs.name ? 'true' : undefined} />
          </Field>
          <Field id="c-email" label={t('f_email')} error={errs.email && t(errs.email)}>
            <input id="c-email" type="email" autoComplete="email" value={v.email} onChange={set('email')} aria-invalid={errs.email ? 'true' : undefined} />
          </Field>
          <Field id="c-msg" label={t('f_msg')} error={errs.msg && t(errs.msg)}>
            <textarea id="c-msg" value={v.msg} onChange={set('msg')} aria-invalid={errs.msg ? 'true' : undefined} />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? "Đang gửi…" : t('c_send')}</button>
          {!SHARED ? <p className="auth-note">{t('auth_demo')}</p> : null}
        </form>
        <aside className="side">
          <h2>{t('c_info_t')}</h2>
          {CONTACT_EMAIL ? <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p> : <p>Vui lòng sử dụng biểu mẫu liên hệ trên trang này.</p>}
          <p>{t('c_hours')}</p>
        </aside>
      </div>
    </>
  );
}
