import { afterEach, describe, expect, it, vi } from 'vitest';
import { qrStats, trackScan } from './qr.js';

vi.hoisted(() => { vi.stubEnv('VITE_API_URL', 'https://api.example.test'); });
afterEach(() => vi.unstubAllGlobals());

describe('QR dùng Backend SQL (giả lập HTTP)', () => {
  it('chỉ đánh dấu phiên sau khi API xác nhận thành công', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    expect(await trackScan('vi')).toEqual({ success: true, alreadyScanned: false });
    expect(await trackScan('vi')).toEqual({ success: true, alreadyScanned: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.example.test/api/qr-scan', expect.objectContaining({
      method: 'POST', body: expect.stringContaining('"lang":"vi"'),
    }));
    expect(localStorage.getItem('dubchef-qr-scans')).toBeNull();
  });

  it('API lỗi không ghi thành công giả và cho phép thử lại', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetch);
    await expect(trackScan('vi')).rejects.toThrow('Không thể lưu lượt quét');
    expect(sessionStorage.getItem('dubchef-qr-seen')).toBeNull();
    expect(await trackScan('vi')).toEqual({ success: true, alreadyScanned: false });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('tải thống kê qua API với token quản trị và đúng số ngày', async () => {
    const payload = { stats: { total: { visitors: 2, views: 3 } } };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', fetch);
    expect(await qrStats.load({ email: 'admin@example.com', token: 'admin-token' }, 30)).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith('https://api.example.test/api/admin/qr?days=30', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
    }));
  });
});
