/** Tạo deep link giữa các nghiệp vụ Admin, không tự thay đổi dữ liệu. */
export function adminHref(path, values = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && String(value).trim() !== '' && value !== 'all') q.set(key, String(value));
  }
  return path + (q.size ? `?${q.toString()}` : '');
}
export function matchesText(value, query) {
  return String(value || '').toLocaleLowerCase('vi').includes(String(query || '').trim().toLocaleLowerCase('vi'));
}
