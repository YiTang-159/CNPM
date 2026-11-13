/** Phân loại thông tin thanh toán đã ghi trong SQL, không xác nhận giao dịch ngân hàng. */
export function paymentFlag(row) {
  if (row.status === 'paid' && !row.paymentRef) return 'missing_ref';
  if (row.status === 'paid' && row.userId == null) return 'unlinked';
  if (row.status === 'pending') return 'pending';
  if (row.status === 'cancelled') return 'cancelled';
  if (row.status === 'paid' && row.paymentSource !== 'payos') return 'unverified_source';
  return row.status === 'paid' ? 'recorded' : 'other';
}
