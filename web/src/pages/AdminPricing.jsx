import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { manageApi } from '../api/workflows.js';
import usePricingPolicy from '../hooks/usePricingPolicy.js';
import { formatMinorMoney } from '../shared/format.js';

const names={VND:'Việt Nam (VND)',USD:'Đô la Mỹ (USD) — hiển thị tham khảo',CNY:'Nhân dân tệ (CNY) — hiển thị tham khảo'};
const fields=[['uploadMinor','Giá / video tải lên (đơn vị nhỏ nhất)'],
 ['translationMinor','Giá / video dịch ra (đơn vị nhỏ nhất)'],['maxVideos','Giới hạn video / lượt'],
 ['maxTranslations','Tối đa bản dịch / video'],['annualDiscountPct','Giảm giá năm (%)']];

export default function AdminPricing(){
 const {pricing,error:loadError,refresh}=usePricingPolicy();
 const [currency,setCurrency]=useState('VND');
 const row=pricing?.currencies?.find(x=>x.currency===currency);
 const [draft,setDraft]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[history,setHistory]=useState([]);
 const loadHistory=()=>manageApi.pricingHistory().then(x=>setHistory(x.history||[])).catch(()=>setError('Chưa tải được lịch sử giá.'));
 // Polling must not erase an Admin's unsaved edits every ten seconds.
 useEffect(()=>{if(row) setDraft({...row});},[currency,row?.version]);
 useEffect(()=>{loadHistory();},[]);
 const changed=draft&&row&&fields.some(([k])=>Number(draft[k])!==row[k]);
 const reset=()=>{setDraft(row?{...row}:null);setReason('');setError('');};
 async function save(e){
   e.preventDefault();if(!changed||busy)return;
   const next=Object.fromEntries(fields.map(([k])=>[k,Number(draft[k])]));
   if(!reason.trim())return setError('Cần ghi lý do thay đổi giá.');
   if(!window.confirm('Giá mới sẽ áp dụng cho đơn MỚI từ bây giờ. Bạn xác nhận lưu?'))return;
   setBusy(true);setError('');setMessage('');
   try{
     await manageApi.updatePricing({currency,version:row.version,...next,reason:reason.trim()});
     await refresh();await loadHistory();setMessage('Đã cập nhật SQL Server. Đơn cũ giữ nguyên giá đã chụp.');setReason('');
   }catch(e){setError(e.code==='price_changed'?'Có Admin khác vừa sửa giá. Tải giá mới trước khi lưu.':e.code||'Không lưu được giá.');await refresh();}
   finally{setBusy(false);}
 }
 return <>
  <div className="adm-head"><div><h1>Quản lý giá</h1><p>Giá đơn hàng lấy từ SQL Server, không lấy số tiền client gửi.</p></div>
  <Link to="/pricing" className="btn btn-sm">Xem trước bảng giá người dùng</Link></div>
  <section className="panel"><h2>Đơn giá và giới hạn sử dụng</h2>
    <p className="fine">payOS chỉ thu VND; USD/CNY để hiển thị tham khảo khi demo.</p>
    {loadError && <p role="alert" className="err">{loadError}</p>}
    <label className="adm-field">Tiền tệ
      <select value={currency} onChange={e=>{setCurrency(e.target.value);setMessage('');setError('');}}>
       {Object.entries(names).map(([k,v])=><option value={k} key={k}>{v}</option>)}
      </select></label>
    {draft && <form onSubmit={save} aria-label="Cập nhật giá" style={{display:'grid',gap:12,marginTop:16}}>
      <p role="status">Phiên bản giá: {row.version} · Cập nhật: {new Date(row.updatedAt).toLocaleString('vi-VN')}</p>
      {fields.map(([key,label])=><label key={key} className="adm-field">{label}
        <input type="number" required min={key==='maxVideos'||key==='maxTranslations'?1:0}
          max={key==='maxTranslations'?3:key==='maxVideos'?5000:key==='annualDiscountPct'?90:100000000}
          step="1" value={draft[key]} onChange={e=>setDraft(old=>({...old,[key]:e.target.value}))}/>
      </label>)}
      <p className="fine">Giá hiện tại: {formatMinorMoney(row.uploadMinor,currency)} / tải lên · {formatMinorMoney(row.translationMinor,currency)} / dịch ra</p>
      <label className="adm-field">Lý do thay đổi giá <textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} rows={2}/></label>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button className="btn btn-primary" disabled={busy||!changed||!reason.trim()} type="submit">{busy?'Đang lưu...':'Lưu giá'}</button>
        <button className="btn" type="button" disabled={busy} onClick={reset}>Hủy</button>
        <button className="btn" type="button" disabled={busy} onClick={()=>refresh()}>Tải giá mới</button>
      </div>
      {error&&<p role="alert" className="err">{error}</p>}{message&&<p role="status">{message}</p>}
    </form>}
  </section>
  <section className="panel"><h2>Gói đang hiển thị</h2>
    <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Tên gói</th><th>Video đăng</th><th>Video dịch</th><th>Hiển thị</th></tr></thead>
    <tbody>{(pricing?.packs||[]).map(pack=><tr key={pack.id}><td>{pack.name}</td><td>{pack.uploads}</td><td>{pack.outs}</td><td>{pack.enabled?'Có':'Ẩn'}</td></tr>)}</tbody></table></div>
    <p className="fine">Gói hiện đọc từ SQL; chức năng thêm/sửa/ẩn gói vẫn chưa có API ghi.</p>
  </section>
  <section className="panel"><h2>Lịch sử sửa giá</h2><div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Thời điểm</th><th>Tiền tệ</th><th>Phiên bản</th><th>Người sửa</th><th>Lý do</th></tr></thead>
    <tbody>{history.map(h=><tr key={h.id}><td>{new Date(h.changedAt).toLocaleString('vi-VN')}</td><td>{h.currency}</td><td>{h.previousVersion} → {h.version}</td><td>{h.changedBy}</td><td>{h.reason}</td></tr>)}</tbody></table></div>
  </section>
 </>;
}
