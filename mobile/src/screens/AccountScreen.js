import { formatMinorMoney } from '../shared/format.js';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Field from '../components/Field';
import { Segmented } from '../components/Controls';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useStyles, useTheme } from '../theme';
import { api, errorKey, HAS_API } from '../api/client';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Video, đơn hàng và phản hồi của tài khoản, đọc từ Backend (cần đăng nhập qua Backend). */
function MyData({ user }) {
  const { t } = useI18n();
  const c = useTheme();
  const s = useStyles();
  const [data, setData] = useState({ videos: [], orders: [], feedback: [] });
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [videos, orders, feedback] = await Promise.all([api.videos(user.token), api.orders(user.token), api.feedback(user.token)]);
      setData({ videos, orders, feedback });
    } catch (e) {
      setError(true);
    }
  }, [user.token]);
  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!msg.trim() || busy) return;
    setBusy(true);
    setSent(false);
    try {
      await api.sendFeedback(user.token, { message: msg.trim() });
      setMsg('');
      setSent(true);
      await load();
    } catch (e) {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const row = { marginBottom: 10 };
  const empty = (key) => <Text style={{ color: c.muted }}>{t(key)}</Text>;
  return (
    <View style={{ marginTop: 24 }}>
      {error ? <Text accessibilityLiveRegion="polite" style={[s.err, { marginBottom: 12 }]}>{t('acc_load_err')}</Text> : null}
      <Button variant="ghost" title={t('acc_refresh')} onPress={load} />

      <Text accessibilityRole="header" style={[s.h2, { marginTop: 20, marginBottom: 8 }]}>{t('acc_videos')}</Text>
      {data.videos.map((v) => (
        <View key={v.id} style={row}>
          <Text style={{ color: c.ink, fontWeight: '600' }}>#{v.id} {v.title}</Text>
          <Text style={{ color: c.muted }}>{v.status} · {v.originalLanguage}</Text>
        </View>
      ))}
      {data.videos.length ? null : empty('acc_no_videos')}

      <Text accessibilityRole="header" style={[s.h2, { marginTop: 20, marginBottom: 8 }]}>{t('acc_orders')}</Text>
      {data.orders.map((o) => (
        <View key={o.id} style={row}>
          <Text style={{ color: c.ink, fontWeight: '600' }}>#{o.id} · {formatMinorMoney(o.amountMinor,o.currency)}</Text>
          <Text style={{ color: c.muted }}>{o.status}</Text>
        </View>
      ))}
      {data.orders.length ? null : empty('acc_no_orders')}

      <Text accessibilityRole="header" style={[s.h2, { marginTop: 20, marginBottom: 8 }]}>{t('acc_feedback')}</Text>
      <Field label={t('acc_fb_label')} value={msg} onChangeText={setMsg} multiline />
      {sent ? <Text accessibilityLiveRegion="polite" style={{ color: c.muted, marginBottom: 8 }}>{t('acc_fb_ok')}</Text> : null}
      <Button title={t('acc_fb_send')} onPress={send} disabled={busy || !msg.trim()} />
      <View style={{ marginTop: 12 }}>
        {data.feedback.map((f) => (
          <View key={f.id} style={row}>
            <Text style={{ color: c.ink }}>{f.message}</Text>
            {f.reply ? <Text style={{ color: c.muted }}>{t('acc_reply')} {f.reply}</Text> : null}
          </View>
        ))}
        {data.feedback.length ? null : empty('acc_no_fb')}
      </View>
    </View>
  );
}

function LoginForm({ onSwitch }) {
  const { t } = useI18n();
  const c = useTheme();
  const { login } = useAuth();
  const s = useStyles();
  const [v, setV] = useState({ email: '', pass: '' });
  const [errs, setErrs] = useState({});
  const [srvErr, setSrvErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (val) => setV((prev) => ({ ...prev, [k]: val }));

  async function submit() {
    const er = {};
    if (!EMAIL.test(v.email.trim())) er.email = 'e_email';
    if (v.pass.length < 8) er.pass = 'e_pass';
    setErrs(er);
    setSrvErr('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await login({ email: v.email, password: v.pass });
    } catch (x) {
      setSrvErr(errorKey(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Text accessibilityRole="header" style={s.h1}>{t('li_title')}</Text>
      <Text style={[s.lead, { marginTop: 12, marginBottom: 24 }]}>{t('li_sub')}</Text>
      {srvErr ? <Text accessibilityLiveRegion="polite" style={[s.err, { marginBottom: 12 }]}>{t(srvErr)}</Text> : null}
      <Field label={t('f_email')} value={v.email} onChangeText={set('email')} error={errs.email && t(errs.email)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label={t('f_pass')} value={v.pass} onChangeText={set('pass')} error={errs.pass && t(errs.pass)} secureTextEntry autoCapitalize="none" autoComplete="password" />
      <Button title={t('nav_login')} onPress={submit} disabled={busy} />
      <Text style={{ marginTop: 22, color: c.muted, fontSize: 15.5 }}>
        {t('li_no')} <Text style={{ color: c.ink, fontWeight: '600' }} onPress={onSwitch} accessibilityRole="link">{t('rg_title')}</Text>
      </Text>
    </View>
  );
}

function RegisterForm({ onSwitch }) {
  const { t } = useI18n();
  const { register } = useAuth();
  const c = useTheme();
  const s = useStyles();
  const [v, setV] = useState({ name: '', email: '', pass: '', pass2: '', agree: false });
  const [errs, setErrs] = useState({});
  const [srvErr, setSrvErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (val) => setV((prev) => ({ ...prev, [k]: val }));

  async function submit() {
    const er = {};
    if (!v.name.trim()) er.name = 'e_name';
    if (!EMAIL.test(v.email.trim())) er.email = 'e_email';
    if (v.pass.length < 8) er.pass = 'e_pass';
    if (!v.pass2 || v.pass2 !== v.pass) er.pass2 = 'e_pass2';
    if (!v.agree) er.agree = 'e_agree';
    setErrs(er);
    setSrvErr('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await register({ name: v.name, email: v.email, password: v.pass });
    } catch (x) {
      setSrvErr(errorKey(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Text accessibilityRole="header" style={s.h1}>{t('rg_title')}</Text>
      <Text style={[s.lead, { marginTop: 12, marginBottom: 24 }]}>{t('rg_sub')}</Text>
      {srvErr ? <Text accessibilityLiveRegion="polite" style={[s.err, { marginBottom: 12 }]}>{t(srvErr)}</Text> : null}
      <Field label={t('f_name')} value={v.name} onChangeText={set('name')} error={errs.name && t(errs.name)} autoComplete="name" />
      <Field label={t('f_email')} value={v.email} onChangeText={set('email')} error={errs.email && t(errs.email)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label={t('f_pass')} value={v.pass} onChangeText={set('pass')} error={errs.pass && t(errs.pass)} secureTextEntry autoCapitalize="none" />
      <Field label={t('f_pass2')} value={v.pass2} onChangeText={set('pass2')} error={errs.pass2 && t(errs.pass2)} secureTextEntry autoCapitalize="none" />
      <View style={{ marginBottom: 16 }}>
        <Text
          accessibilityRole="checkbox"
          accessibilityState={{ checked: v.agree }}
          onPress={() => setV((prev) => ({ ...prev, agree: !prev.agree }))}
          style={{ color: c.ink, fontSize: 15, minHeight: 44, textAlignVertical: 'center' }}
        >
          {v.agree ? '☑' : '☐'}  {t('f_agree')} {t('tm_title')}
        </Text>
        {errs.agree ? <Text style={s.err}>{t(errs.agree)}</Text> : null}
      </View>
      <Button title={t('rg_btn')} onPress={submit} disabled={busy} />
      <Text style={{ marginTop: 22, color: c.muted, fontSize: 15.5 }}>
        {t('rg_have')} <Text style={{ color: c.ink, fontWeight: '600' }} onPress={onSwitch} accessibilityRole="link">{t('nav_login')}</Text>
      </Text>
    </View>
  );
}

export default function AccountScreen() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const s = useStyles();
  const [mode, setMode] = useState('login');

  return (
    <Screen>
      {user ? (
        <View>
          <Text accessibilityRole="header" style={s.h1}>{t('hello')}, {user.name}</Text>
          <Text style={[s.lead, { marginVertical: 12 }]}>{user.email}</Text>
          <Button variant="ghost" title={t('logout')} onPress={logout} />
          {HAS_API && user.token ? <MyData user={user} /> : null}
        </View>
      ) : (
        <View>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[{ key: 'login', label: t('nav_login') }, { key: 'register', label: t('rg_title') }]}
          />
          <View style={{ marginTop: 24 }}>{mode === 'login' ? <LoginForm onSwitch={() => setMode('register')} /> : <RegisterForm onSwitch={() => setMode('login')} />}</View>
          {!HAS_API ? <Text style={s.note}>{t('auth_demo')}</Text> : null}
        </View>
      )}
    </Screen>
  );
}
