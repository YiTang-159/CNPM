import { formatMinorMoney } from '../shared/format.js';
import { useAutoRefresh } from '../utils/useAutoRefresh.js';
import { useCallback, useEffect, useState } from 'react';
import { manageApi } from '../api/workflows.js';
export default function AdminOrders() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    try { setRows((await manageApi.orders()).orders || []); setMsg(''); }
    catch (e) { setMsg('Không đọc được đơn hàng: ' + e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);
  return <>
    <div className="adm-head"><div><h1>Đơn hàng & giao dịch</h1><p>Tra cứu đơn hàng và giao dịch thành công đã lưu trên SQL Server (500 đơn gần nhất).</p></div></div>
    <section className="panel"><button className="btn btn-sm" onClick={load}>Làm mới</button>{msg ? <p role="alert">{msg}</p> : null}
      <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Số tiền</th><th>Trạng thái</th><th>Phương thức</th><th>Mã tham chiếu</th><th>Ngày tạo</th></tr></thead>
        <tbody>{rows.map(x => <tr key={x.id}><td>#{x.id}</td><td>{x.name}<p className="fine">{x.email}</p></td>
          <td>{formatMinorMoney(x.amount,x.currency)}</td><td>{x.status}</td><td>{x.method || '—'}</td><td>{x.paymentRef || '—'}</td>
          <td>{new Date(x.createdAt).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'})}</td></tr>)}</tbody></table>
      {!rows.length && !msg ? <p>Chưa có đơn hàng.</p> : null}</div></section>
  </>;
}
