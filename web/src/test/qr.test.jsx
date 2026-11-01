import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { I } from '../shared/i18n.js';
import { ADMIN_EMAIL } from '../api/client.js';
import { orders, paymentPayload } from '../api/orders.js';
import { GUEST_PATH, guestUrl, isLocalAddress, qrStats, trackScan } from '../api/qr.js';
import { qrMatrix, qrPath, qrSvg } from '../utils/qr.js';

const loginAsAdmin = () => localStorage.setItem('dubchef-session', JSON.stringify({ name: 'Admin', email: ADMIN_EMAIL, role: 'admin' }));
const login = () => localStorage.setItem('dubchef-session', JSON.stringify({ name: 'An', email: 'An@Example.com' }));
const savedOrders = () => JSON.parse(localStorage.getItem('dubchef-orders') || '[]');

describe('bộ tạo mã QR', () => {
  it('kích thước theo phiên bản: 21 ô cho nội dung ngắn, lớn dần khi nội dung dài', () => {
    expect(qrMatrix('A')).toHaveLength(21);
    expect(qrMatrix('https://example.com/#/guest')).toHaveLength(29);
    expect(qrMatrix('x'.repeat(200)).length).toBeGreaterThan(qrMatrix('x'.repeat(20)).length);
  });

  it('có đủ ba mắt định vị ở ba góc và ô đen cố định', () => {
    const m = qrMatrix('Dubchef');
    const n = m.length;
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      expect(m[y][x]).toBe(true); // góc ngoài của mắt định vị
      expect(m[y + 3][x + 3]).toBe(true); // tâm
      expect(m[y + 1][x + 1]).toBe(false); // vòng trắng bên trong
    }
    expect(m[n - 8][8]).toBe(true); // ô đen luôn có theo chuẩn
  });

  it('cùng nội dung cho cùng ma trận; khác nội dung cho ma trận khác', () => {
    expect(qrMatrix('abc')).toEqual(qrMatrix('abc'));
    expect(qrMatrix('abc')).not.toEqual(qrMatrix('abd'));
  });

  it('nhận tiếng Việt (UTF-8) và từ chối nội dung quá dài', () => {
    expect(() => qrMatrix('Thanh toán đơn hàng ✓')).not.toThrow();
    expect(() => qrMatrix('x'.repeat(214))).toThrow('qr_too_long');
    expect(() => qrMatrix('x'.repeat(213))).not.toThrow();
  });

  it('xuất SVG hợp lệ có viền trắng', () => {
    const m = qrMatrix('A');
    const { d, size } = qrPath(m, 4);
    expect(size).toBe(m.length + 8);
    expect(d.startsWith('M')).toBe(true);
    const svg = qrSvg('A');
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 29 29"/);
    expect(svg).toContain('<path d="M');
  });
});

describe('địa chỉ trong mã QR của khách', () => {
  it('gắn #/guest vào địa chỉ trang, bỏ phần ? và # cũ', () => {
    expect(GUEST_PATH).toBe('/guest');
    expect(guestUrl('https://dubchef.vn/app/?x=1#/pricing')).toBe('https://dubchef.vn/app/#/guest');
  });
  it('nhận biết địa chỉ chỉ mở được trên máy cá nhân', () => {
    expect(isLocalAddress('http://localhost:5173/#/guest')).toBe(true);
    expect(isLocalAddress('http://127.0.0.1:5173/#/guest')).toBe(true);
    expect(isLocalAddress('file:///C:/web/index.html#/guest')).toBe(true);
    expect(isLocalAddress('https://dubchef.vn/#/guest')).toBe(false);
  });
});

describe('đếm lượt quét QR (chế độ lưu tạm)', () => {
  it('ghi một lượt mỗi phiên; người quét không trùng, lượt quét tính riêng', async () => {
    expect(trackScan('vi')).toBe(true);
    expect(trackScan('vi')).toBe(false); // tải lại trong cùng phiên không tính
    sessionStorage.clear(); // phiên mới, cùng trình duyệt
    expect(trackScan('en')).toBe(true);
    const { stats } = await qrStats.load({ email: 'a@b.co' }, 7);
    expect(stats.total).toEqual({ visitors: 1, views: 2 });
    expect(stats.today).toEqual({ visitors: 1, views: 2 });
    expect(stats.series).toHaveLength(7);
  });

  it('dữ liệu mẫu và xóa dữ liệu', async () => {
    qrStats.seed();
    expect((await qrStats.load({}, 30)).stats.total.visitors).toBeGreaterThan(50);
    qrStats.reset();
    expect((await qrStats.load({}, 30)).stats.total).toEqual({ visitors: 0, views: 0 });
  });
});

describe('trang /guest', () => {
  it('khách không đăng nhập vẫn vào được và lượt quét được ghi lại', async () => {
    renderApp('/guest');
    expect(await screen.findByRole('heading', { name: I.gu_title[0] })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: I.gu_go[0] })).toHaveAttribute('href', '/demo');
    await waitFor(async () => expect((await qrStats.load({}, 7)).stats.total.visitors).toBe(1));
  });

  it('trang chủ có mã QR dẫn tới trang khách', () => {
    renderApp('/');
    expect(screen.getByTestId('home-qr').getAttribute('data-value')).toMatch(/#\/guest$/);
  });
});

describe('trang /admin/qr', () => {
  it('tài khoản thường không vào được', () => {
    login();
    renderApp('/admin/qr');
    expect(screen.getByRole('alert')).toHaveTextContent(I.ad_denied[0]);
  });

  it('admin thấy mã QR, số người quét, lượt quét và đổi khoảng thời gian', async () => {
    const user = userEvent.setup();
    loginAsAdmin();
    trackScan('vi');
    renderApp('/admin/qr');
    expect(await screen.findByTestId('aq-total')).toHaveTextContent('1');
    expect(screen.getByTestId('aq-today')).toHaveTextContent('1');
    expect(screen.getByTestId('aq-qrcode').getAttribute('data-value')).toBe(screen.getByTestId('aq-url').textContent);
    expect(screen.getByRole('link', { name: I.ad_nav_qr[0] })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: I.ad_seed[0] }));
    await waitFor(() => expect(Number(screen.getByTestId('aq-total').textContent.replace(/\D/g, ''))).toBeGreaterThan(50));
    expect(screen.getByTestId('aq-period-trend').textContent).toMatch(/%/);
    expect(screen.getAllByRole('row')).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: I.ad_r30[0] }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(31));
    await user.click(screen.getByRole('button', { name: I.ad_reset[0] }));
    await waitFor(() => expect(screen.getByTestId('aq-total')).toHaveTextContent('0'));
  });
});

describe('thanh toán bằng mã QR', () => {
  it('nội dung mã QR gồm mã đơn, số tiền, loại tiền và nội dung chuyển khoản', () => {
    expect(paymentPayload({ id: 7, amountMinor: 90000, currency: 'VND' })).toBe('DUBCHEF-PAY|order=7|amount=90000|cur=VND|memo=DUBCHEF7');
    expect(paymentPayload({ id: 8, amountMinor: 350, currency: 'USD' })).toContain('amount=3.5|cur=USD');
  });

  it('api: thanh toán đơn bằng phương thức qr', async () => {
    const o = await orders.create({ name: 'An', email: 'an@example.com', uploads: 3, outs: 3, L: 0 });
    const res = await orders.pay(o.id, 'qr');
    expect(res.order.status).toBe('paid');
    expect(res.payment.ref).toMatch(/^QR-/);
  });

  it('tạo mã QR, xác nhận đã thanh toán và lưu đơn đã trả', async () => {
    const user = userEvent.setup();
    login();
    renderApp('/pricing');
    await user.click(screen.getByRole('button', { name: I.co_btn[0] }));
    await user.click(screen.getByRole('radio', { name: I.co_qr[0] }));
    await user.click(screen.getByRole('button', { name: I.co_qr_make[0] }));
    expect((await screen.findByTestId('co-qrcode')).getAttribute('data-value')).toBe('DUBCHEF-PAY|order=1|amount=90000|cur=VND|memo=DUBCHEF1');
    expect(savedOrders()[0].status).toBe('pending');
    await user.click(screen.getByRole('button', { name: I.co_qr_done[0] }));
    expect(await screen.findByTestId('co-ref')).toHaveTextContent(/^QR-/);
    await waitFor(() => expect(savedOrders()[0]).toMatchObject({ status: 'paid', amountMinor: 90000 }));
  });

  it('quay lại đổi phương thức rồi chọn QR lại thì không tạo đơn trùng', async () => {
    const user = userEvent.setup();
    login();
    renderApp('/pricing');
    await user.click(screen.getByRole('button', { name: I.co_btn[0] }));
    await user.click(screen.getByRole('radio', { name: I.co_qr[0] }));
    await user.click(screen.getByRole('button', { name: I.co_qr_make[0] }));
    await screen.findByTestId('co-qrcode');
    await user.click(screen.getByRole('button', { name: I.co_qr_back[0] }));
    await user.click(screen.getByRole('button', { name: I.co_qr_make[0] }));
    await screen.findByTestId('co-qrcode');
    expect(savedOrders()).toHaveLength(1);
  });
});
