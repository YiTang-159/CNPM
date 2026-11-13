import { useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
/** Hai ô mật khẩu có nút hiện/ẩn riêng, luôn giữ giá trị khi đổi ô hay đổi chế độ. */
export default function PasswordInput({ id, value, onChange, autoComplete = 'new-password', invalid }) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  return (
    <div className="password-control">
      <input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete}
        value={value} onChange={onChange} aria-invalid={invalid ? 'true' : undefined} />
      <button type="button" className="password-toggle" aria-label={visible ? t('pwd_hide') : t('pwd_show')}
        aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? t('pwd_hide_short') : t('pwd_show_short')}</button>
    </div>
  );
}
