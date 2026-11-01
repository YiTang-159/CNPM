import { useState } from 'react';
/** Hai ô mật khẩu có nút hiện/ẩn riêng, luôn giữ giá trị khi đổi ô hay đổi chế độ. */
export default function PasswordInput({ id, value, onChange, autoComplete = 'new-password', invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-control">
      <input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete}
        value={value} onChange={onChange} aria-invalid={invalid ? 'true' : undefined} />
      <button type="button" className="password-toggle" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Ẩn' : 'Hiện'}</button>
    </div>
  );
}
