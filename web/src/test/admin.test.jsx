import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { I } from '../shared/i18n.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD, api, errorKey } from '../api/client.js';
import { addVisit, change, sampleData, summarize } from '../api/analytics.js';
import { adminApi } from '../api/admin.js';
import { filterUsers, toCsv } from '../pages/AdminUsers.jsx';

const at = (d, h = 10) => new Date(2026, 9, d, h, 0);
const loginAsAdmin = () => localStorage.setItem('dubchef-session', JSON.stringify({ name: 'Admin', email: ADMIN_EMAIL, role: 'admin' }));

describe('thống kê truy cập', () => {
  it('đếm người truy cập duy nhất, lượt xem, kỳ trước và ngày cao nhất', () => {
    const data = { visitors: {}, days: {} };
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: at(22) });
    addVisit(data, { id: 'a', path: '/pricing', lang: 'vi', at: at(22, 11) });
    addVisit(data, { id: 'b', path: '/', lang: 'en', at: at(22, 12) });
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: at(21) });
    addVisit(data, { id: 'c', path: '/', lang: 'vi', at: at(10) }); // thuộc kỳ trước (7 ngày)
    const s = summarize(data, at(22, 12), 7);
    expect(s.today).toEqual({ visitors: 2, views: 3 });
    expect(s.yesterday).toEqual({ visitors: 1, views: 1 });
    expect(s.period).toEqual({ visitors: 2, views: 4 });
    expect(s.prev.visitors).toBe(1);
    expect(s.total).toEqual({ visitors: 3, views: 5 });
    expect(s.series).toHaveLength(7);
    expect(s.peak).toEqual({ date: '2026-10-22', visitors: 2 });
    expect(summarize(data, at(22, 12), 30).series).toHaveLength(30);
  });

  it('"đang truy cập" chỉ tính người hoạt động trong 5 phút', () => {
    const data = { visitors: {}, days: {} };
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: new Date(2026, 9, 22, 12, 0) });
    addVisit(data, { id: 'b', path: '/', lang: 'vi', at: new Date(2026, 9, 22, 12, 8) });
    expect(summarize(data, new Date(2026, 9, 22, 12, 10)).activeNow).toBe(1);
  });

  it('phần trăm thay đổi', () => {
    expect(change(15, 10)).toBe(50);
    expect(change(5, 10)).toBe(-50);
    expect(change(5, 0)).toBeNull();
  });

  it('dữ liệu mẫu có số liệu hợp lý', () => {
    const s = summarize(sampleData(at(22)), at(22), 30);
    expect(s.total.visitors).toBeGreaterThan(0);
    expect(s.period.views).toBeGreaterThanOrEqual(s.period.visitors);
    expect(s.prev.visitors).toBeGreaterThan(0);
  });
});

describe('quản lý người dùng (hàm thuần)', () => {
  const users = [
    { name: 'Lê An', email: 'an@x.com', at: '2026-10-01', status: 'active' },
    { name: 'Bùi Bình', email: 'binh@x.com', at: '2026-10-05', status: 'locked' },
  ];
  it('tìm theo tên hoặc email và sắp xếp', () => {
    expect(filterUsers(users, 'BINH', 'new').map((u) => u.email)).toEqual(['binh@x.com']);
    expect(filterUsers(users, '', 'new')[0].email).toBe('binh@x.com');
    expect(filterUsers(users, '', 'name')[0].name).toBe('Bùi Bình');
  });
  it('xuất CSV đúng dấu ngoặc kép', () => {
    const csv = toCsv([{ name: 'A "B", C', email: 'a@x.com', at: null, status: 'active' }]);
    expect(csv.split('\n')[1]).toBe('"A ""B"", C","a@x.com","","active"');
  });
});

describe('đăng nhập admin và tài khoản bị khóa', () => {
  it('đăng nhập bằng tài khoản admin có sẵn, không cần đăng ký', async () => {
    const res = await api.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.user.role).toBe('admin');
    await expect(api.login({ email: ADMIN_EMAIL, password: 'sai-mat-khau' })).rejects.toMatchObject({ code: 'invalid' });
    await expect(api.register({ name: 'X', email: ADMIN_EMAIL, password: 'matkhau123' })).rejects.toMatchObject({ code: 'exists' });
  });

  it('tài khoản bị khóa không đăng nhập được', async () => {
    await api.register({ name: 'An', email: 'an@example.com', password: 'matkhau123' });
    await adminApi.setStatus({ email: ADMIN_EMAIL }, 'an@example.com', 'locked');
    const err = await api.login({ email: 'an@example.com', password: 'matkhau123' }).catch((e) => e);
    expect(err.code).toBe('locked');
    expect(errorKey(err)).toBe('e_locked');
    await adminApi.setStatus({ email: ADMIN_EMAIL }, 'an@example.com', 'active');
    expect((await api.login({ email: 'an@example.com', password: 'matkhau123' })).user.name).toBe('An');
  });
});

describe('Trang /admin', () => {
  it('chưa đăng nhập thì yêu cầu đăng nhập', () => {
    renderApp('/admin');
    expect(screen.getByRole('alert')).toHaveTextContent(I.ad_need_login[0]);
  });

  it('tài khoản thường bị từ chối và không thấy mục Quản trị', () => {
    localStorage.setItem('dubchef-session', JSON.stringify({ name: 'An', email: 'an@example.com' }));
    renderApp('/admin');
    expect(screen.getByRole('alert')).toHaveTextContent(I.ad_denied[0]);
    expect(screen.queryByRole('link', { name: I.nav_admin[0] })).toBeNull();
  });

  it('trang quản trị không hiện menu của trang chính', async () => {
    loginAsAdmin();
    renderApp('/admin');
    await screen.findByTestId('ad-total');
    expect(screen.queryByRole('link', { name: I.nav_pricing[0] })).toBeNull();
    expect(screen.getByRole('link', { name: I.ad_nav_users[0] })).toBeInTheDocument();
  });

  it('thấy số người truy cập, so sánh kỳ trước và đổi khoảng thời gian', async () => {
    const user = userEvent.setup();
    loginAsAdmin();
    renderApp('/admin');
    expect(await screen.findByTestId('ad-total')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: I.ad_seed[0] }));
    await waitFor(() => expect(screen.getByTestId('ad-total').textContent).not.toBe('0'));
    expect(screen.getByTestId('ad-period-trend').textContent).toMatch(/%/);
    expect(screen.getAllByRole('row')).toHaveLength(8); // 7 ngày + hàng tiêu đề (bảng cho trình đọc màn hình)
    await user.click(screen.getByRole('button', { name: I.ad_r30[0] }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(31));
    await user.click(screen.getByRole('button', { name: I.ad_reset[0] }));
    await waitFor(() => expect(screen.getByTestId('ad-total')).toHaveTextContent('0'));
  });
});

describe('Trang /admin/users', () => {
  async function open() {
    const user = userEvent.setup();
    loginAsAdmin();
    adminApi.seed();
    renderApp('/admin/users');
    await screen.findByTestId('us-total');
    return user;
  }

  it('hiện số người dùng, tìm kiếm và phân trang', async () => {
    const user = await open();
    expect(screen.getByTestId('us-total')).toHaveTextContent('12');
    expect(screen.getByTestId('us-locked')).toHaveTextContent('1');
    expect(screen.getAllByRole('row')).toHaveLength(9); // 8 người + tiêu đề
    await user.click(screen.getByRole('button', { name: I.ad_next[0] }));
    expect(screen.getAllByRole('row')).toHaveLength(5);
    await user.type(screen.getByRole('searchbox'), 'thịnh');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'không-có-ai');
    expect(screen.getByText(I.ad_no_match[0])).toBeInTheDocument();
  });

  it('khóa, mở khóa và xóa (có hỏi xác nhận)', async () => {
    const user = await open();
    await user.type(screen.getByRole('searchbox'), 'demo-1@');
    const row = () => screen.getAllByRole('row')[1];
    await user.click(within(row()).getByRole('button', { name: new RegExp(I.ad_lock[0]) }));
    await waitFor(() => expect(screen.getByTestId('us-locked')).toHaveTextContent('2'));
    expect(within(row()).getByText(I.ad_locked[0])).toBeInTheDocument();
    await user.click(within(row()).getByRole('button', { name: new RegExp(I.ad_unlock[0]) }));
    await waitFor(() => expect(screen.getByTestId('us-locked')).toHaveTextContent('1'));

    await user.click(within(row()).getByRole('button', { name: new RegExp(I.ad_delete[0]) }));
    await user.click(within(row()).getByRole('button', { name: I.ad_cancel[0] }));
    expect(screen.getByTestId('us-total')).toHaveTextContent('12');
    await user.click(within(row()).getByRole('button', { name: new RegExp(I.ad_delete[0]) }));
    await user.click(within(row()).getByRole('button', { name: I.ad_delete[0] }));
    await waitFor(() => expect(screen.getByTestId('us-total')).toHaveTextContent('11'));
  });
});
