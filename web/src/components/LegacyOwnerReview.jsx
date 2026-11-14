import { useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';
import AdminT, {useAdminT} from './AdminTranslation.jsx';

const evidenceOptions = [
  ['payment_reference', 'Mã giao dịch đã đối chiếu'],
  ['signed_receipt', 'Biên nhận có xác nhận'],
  ['support_ticket', 'Phiếu hỗ trợ đã xác minh'],
];

const messages = {
  invalid: 'Thông tin xác minh không hợp lệ. Hãy kiểm tra lại chứng từ và ghi chú.',
  not_found: 'Không tìm thấy đơn hàng này. Hãy tải lại danh sách.',
  already_linked: 'Đơn này đã được liên kết bởi một quản trị viên khác. Hãy tải lại.',
  ambiguous_owner: 'Có nhiều tài khoản phù hợp. Không thể tự xác định chủ đơn.',
  email_mismatch: 'Tài khoản không còn khớp với email đơn hàng. Hãy kiểm tra lại.',
  auth: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  forbidden: 'Chỉ quản trị viên có quyền xác minh chủ đơn.',
  net: 'Không kết nối được Backend. Kiểm tra API và SQL Server.',
};
/** Manual review only. A matching email is a candidate, not proof of ownership/payment. */
export default function LegacyOwnerReview({ order, onLinked }) {
  const tr = useAdminT();
  const [lookup,setLookup] = useState(null);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [evidenceType,setEvidenceType] = useState('payment_reference');
  const [evidenceRef,setEvidenceRef] = useState('');
  const [note,setNote] = useState('');
  const [confirmed,setConfirmed] = useState(false);
  const [success,setSuccess] = useState(false);
  useEffect(() => {
    let live = true;
    setLookup(null);setError('');setLoading(true);setConfirmed(false);setSuccess(false);
    setEvidenceRef('');setNote('');
    manageApi.orderOwnerCandidates(order.id)
      .then(data=>{if(live)setLookup(data);})
      .catch(e=>{if(live)setError(e.message||'server');})
      .finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;};
  },[order.id]);
  const candidates=lookup?.candidates||[];
  const candidate=candidates.length===1?candidates[0]:null;
  const canSave=!!candidate&&lookup?.order?.userId==null&&confirmed&&
    evidenceRef.trim().length>=4&&note.trim().length>=15&&!busy&&!success;
  async function save(ev) {
    ev.preventDefault();
    if(!canSave)return;
    setBusy(true);setError('');
    try {
      await manageApi.linkOrderOwner(order.id,{
        userId:candidate.id,evidenceType,evidenceRef:evidenceRef.trim(),note:note.trim(),confirmed:true,
      });
      setSuccess(true);
      setLookup(null);
      try { await onLinked?.(); } catch { /* Linked in SQL; a refresh failure does not undo it. */ }
    } catch(e) {setError(e.message||'server');}
    finally {setBusy(false);}
  }
  return <section className="panel" style={{marginTop:16,padding:16}}>
    <h4><AdminT vi="Xác minh chủ đơn hàng cũ" /></h4>
    <p className="fine"><AdminT vi="Email giống nhau chỉ là gợi ý, không đủ chứng minh quyền sở hữu. Admin phải kiểm tra chứng từ độc lập trước khi liên kết." /></p>
    {loading&&<p role="status"><AdminT vi="Đang kiểm tra tài khoản phù hợp…" /></p>}
    {lookup?.order&&<p className="fine"><AdminT vi="Đơn hàng:" /> <strong>#{lookup.order.id}</strong> · <strong>{lookup.order.name||'—'}</strong> · {lookup.order.email||'—'} · {tr(lookup.order.status||'—')}</p>}
    {error&&<p role="alert" className="ops-notice">{tr('Không thể liên kết đơn: ')}{tr(messages[error]||error)}</p>}
    {success&&<p role="status" className="ops-notice">{tr('Đã liên kết tài khoản thành công. Không tự xác nhận thanh toán hoặc cấp lượt sử dụng.')}</p>}
    {!loading&&lookup?.order?.userId!=null&&<p role="status">{tr('Đơn hàng đã có tài khoản sở hữu. Không thể liên kết lại.')}</p>}
    {!loading&&!error&&!success&&lookup?.order?.userId==null&&!candidate&&<p role="alert"><AdminT vi="Không tìm thấy đúng một tài khoản khách có email trùng khớp. Không tự liên kết; cần xử lý thủ công bên ngoài hệ thống." /></p>}
    {candidate&&<form onSubmit={save} className="adm-form" style={{display:'grid',gap:12}}>
      <p><AdminT vi="Tài khoản đề xuất:" /> <strong>#{candidate.id} — {candidate.name} ({candidate.email})</strong></p>
      <label className="adm-field"><AdminT vi="Loại bằng chứng đã kiểm tra" />
        <select value={evidenceType} onChange={e=>setEvidenceType(e.target.value)}>{evidenceOptions.map(([value,label])=><option value={value} key={value}>{tr(label)}</option>)}</select>
      </label>
      <label className="adm-field"><AdminT vi="Mã chứng từ hoặc mã hồ sơ xác minh" />
        <input value={evidenceRef} maxLength={120} onChange={e=>setEvidenceRef(e.target.value)} placeholder={tr('Nhập mã chứng từ đã kiểm tra')} required minLength={4}/>
      </label>
      <label className="adm-field"><AdminT vi="Ghi chú căn cứ xác minh (ít nhất 15 ký tự)" />
        <textarea value={note} maxLength={500} onChange={e=>setNote(e.target.value)} required minLength={15} rows={3}/>
      </label>
      <label style={{display:'flex',gap:8,alignItems:'start'}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />
        <span><AdminT vi="Tôi đã đối chiếu chứng từ độc lập, xác nhận đúng chủ đơn; thao tác này không xác minh tiền thật hoặc cấp thêm lượt sử dụng." /></span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={!canSave}>{busy?tr('Đang lưu…'):tr('Xác nhận liên kết tài khoản')}</button>
    </form>}
  </section>;
}
