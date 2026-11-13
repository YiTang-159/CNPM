import { formatMinorMoney } from '../shared/format.js';
import SavedVideo from '../components/SavedVideo.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { workApi } from '../api/workflows.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { orders } from '../api/orders.js';

export default function Account() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ old: '', next: '', confirm: '' });
  const [videos, setVideos] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ message: '', videoId: '' });
  const [viewing,setViewing] = useState(null);
  const [exportChoices, setExportChoices] = useState({});
  const [exporting, setExporting] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!user?.token) return;
    try {
      const [v, f, o] = await Promise.all([workApi.videos(), workApi.feedback(), orders.list(user.email)]);
      setVideos(v.videos || []); setFeedback(f.feedback || []); setMyOrders(o || []);
    } catch (e) { setMsg('Không tải được dữ liệu từ SQL Server: ' + e.message); }
  }, [user?.token, user?.email]);
  useEffect(() => { refresh(); }, [refresh]);
  async function updateProfile(e) {
    e.preventDefault(); setBusy(true);
    try { const d = await workApi.updateProfile(name); updateUser(d.user); setMsg('Hồ sơ đã được lưu vào SQL Server.'); }
    catch (err) { setMsg('Không lưu được hồ sơ: ' + err.message); }
    finally { setBusy(false); }
  }
  async function changePassword(e) {
    e.preventDefault();
    if (passwords.next.length < 8 || passwords.next !== passwords.confirm) { setMsg('Mật khẩu mới ít nhất 8 ký tự và phải trùng với ô nhập lại.'); return; }
    setBusy(true);
    try { await workApi.changePassword(passwords.old, passwords.next);
      setPasswords({ old: '', next: '', confirm: '' }); setMsg('Đã đổi mật khẩu thành công.'); }
    catch (err) { setMsg('Không đổi được mật khẩu. Kiểm tra mật khẩu hiện tại. ' + err.message); }
    finally { setBusy(false); }
  }
  async function sendFeedback(e) {
    e.preventDefault(); setBusy(true);
    try { await workApi.sendFeedback(form.message, form.videoId ? Number(form.videoId) : null);
      setForm({ message: '', videoId: '' }); await refresh(); setMsg('Phản hồi đã được gửi đến Admin và lưu trên SQL Server.'); }
    catch (err) { setMsg('Gửi phản hồi thất bại: ' + err.message); }
    finally { setBusy(false); }
  }
  async function download(id, fileName) {
    try { const blob = await workApi.downloadVideo(id); const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = fileName || 'video'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) { setMsg('Không tải được video: ' + err.message); }
  }
  async function showExports(id) {
    try {
      const data = await workApi.exportOptions(id);
      setExportChoices(old => ({...old, [id]: data}));
      if (!data.languages?.length) setMsg('Video này chưa có kịch bản thuyết minh đã xuất bản.');
    } catch (error) { setMsg('Không tra cứu được tệp đã xuất bản: ' + error.message); }
  }
  async function saveVoiceover(id, language, format) {
    setExporting(`${id}-${language}-${format}`);
    try {
      const blob = await workApi.exportVoiceover(id, language, format);
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a'); el.href = url;
      el.download = `dubchef-video-${id}-${language}.${format}`;
      document.body.appendChild(el); el.click(); el.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setMsg(`Đã tạo tệp ${format.toUpperCase()} giọng ${language.toUpperCase()}.`);
    } catch (err) { setMsg('Không xuất được tệp: ' + err.message + ' (kiểm tra kịch bản đã xuất bản và thời gian từng câu).'); }
    finally { setExporting(''); }
  }
  if (!user) return <div className="wrap page-head"><h1>Tài khoản</h1><p><Link to="/login" state={{ from: '/account' }}>Đăng nhập để xem dữ liệu của bạn.</Link></p></div>;
  return <div className="wrap"><div className="page-head"><h1>Tài khoản của tôi</h1><p>Dữ liệu được quản lý từ SQL Server – DubchefDB.</p></div>
    {msg ? <p role="status" className="adm-note">{msg}</p> : null}
    {viewing ? <SavedVideo video={viewing} onClose={() => setViewing(null)} /> : null}
    <div className="account-grid">
      <section className="panel"><h2>Thông tin hồ sơ</h2><form onSubmit={updateProfile}>
        <label>Họ và tên<input value={name} maxLength={100} required onChange={e => setName(e.target.value)} /></label>
        <label>Email<input value={user.email} readOnly /></label>
        <button className="btn btn-primary" disabled={busy}>Cập nhật hồ sơ</button></form></section>
      <section className="panel"><h2>Đổi mật khẩu</h2><form onSubmit={changePassword}>
        <label htmlFor="old-pass">Mật khẩu hiện tại</label><PasswordInput id="old-pass" autoComplete="current-password" value={passwords.old} onChange={e => setPasswords(v => ({ ...v, old: e.target.value }))} />
        <label htmlFor="new-pass">Mật khẩu mới</label><PasswordInput id="new-pass" value={passwords.next} onChange={e => setPasswords(v => ({ ...v, next: e.target.value }))} />
        <label htmlFor="confirm-pass">Nhập lại mật khẩu mới</label><PasswordInput id="confirm-pass" value={passwords.confirm} onChange={e => setPasswords(v => ({ ...v, confirm: e.target.value }))} />
        <button className="btn btn-primary" disabled={busy}>Lưu mật khẩu</button></form></section>
      <section className="panel"><h2>Video của tôi</h2><p><Link to="/demo" className="btn btn-sm">Tải lên và xử lý video</Link></p>
        <button className="btn btn-sm" onClick={refresh}>Làm mới</button>
        <ul className="list">{videos.map(v => <li key={v.id}><strong>#{v.id} {v.title}</strong>
          <p>Trạng thái: {v.status} · {v.originalLanguage} · {new Date(v.createdAt).toLocaleString('vi-VN')}</p>
          {v.videoUrl ? <><button className="btn btn-sm" onClick={() => setViewing(v)}>Xem kết quả</button><button className="btn btn-sm" onClick={() => download(v.id, v.fileName)}>Tải video gốc</button></> : <small>Chưa lưu xong tệp video</small>}
          <button type="button" className="btn btn-sm" onClick={() => showExports(v.id)}>Tệp lồng tiếng đã duyệt</button>
          {exportChoices[v.id] && <div className="adm-actions ops-gap">{exportChoices[v.id].languages?.map(language => <span key={language}>
            <button type="button" className="btn btn-sm" disabled={Boolean(exporting)} onClick={() => saveVoiceover(v.id,language,'mp3')}>MP3 {language.toUpperCase()}</button>
            {exportChoices[v.id].hasVideo && <button type="button" className="btn btn-sm" disabled={Boolean(exporting)} onClick={() => saveVoiceover(v.id,language,'mp4')}>MP4 {language.toUpperCase()}</button>}
          </span>)}</div>}
        </li>)}</ul>{!videos.length ? <p>Chưa có video.</p> : null}</section>
      <section className="panel"><h2>Đơn hàng của tôi</h2><p><Link to="/pricing" className="btn btn-sm">Bảng giá</Link></p>
        <ul className="list">{myOrders.map(o => <li key={o.id}>
          <strong>Đơn #{o.id}</strong><p>{formatMinorMoney(o.amountMinor,o.currency)} · {o.status}</p>
          <small>{new Date(o.createdAt).toLocaleString('vi-VN')}</small>
        </li>)}</ul>{!myOrders.length ? <p>Chưa có đơn hàng.</p> : null}
      </section>
      <section className="panel"><h2>Gửi phản hồi cho Admin</h2><form onSubmit={sendFeedback}>
        <label>Video liên quan (không bắt buộc)<select value={form.videoId} onChange={e => setForm(v => ({ ...v, videoId: e.target.value }))}>
          <option value="">Phản hồi chung</option>{videos.map(v => <option key={v.id} value={v.id}>#{v.id} – {v.title}</option>)}
        </select></label>
        <label>Nội dung<textarea required maxLength={2000} rows={4} value={form.message} onChange={e => setForm(v => ({ ...v, message: e.target.value }))} /></label>
        <button className="btn btn-primary" disabled={busy || !form.message.trim()}>Gửi phản hồi</button>
      </form><h3>Lịch sử phản hồi</h3><ul className="list">{feedback.map(f => <li key={f.id}>
        <strong>{f.message}</strong><p>{f.status} · {new Date(f.createdAt).toLocaleString('vi-VN')}</p>
        {f.reply ? <p><strong>Admin trả lời:</strong> {f.reply}</p> : null}
      </li>)}</ul>{!feedback.length ? <p>Chưa có phản hồi.</p> : null}</section>
    </div>
  </div>;
}
