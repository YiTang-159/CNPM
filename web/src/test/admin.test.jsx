import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { I } from '../shared/i18n.js';
import { ADMIN_EMAIL } from '../api/client.js';
import { addVisit, sampleData, summarize } from '../api/analytics.js';

const at = (d, h = 10) => new Date(2026, 9, d, h, 0);

describe('thống kê truy cập', () => {
  it('đếm người truy cập duy nhất và lượt xem theo ngày', () => {
    const data = { visitors: {}, days: {} };
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: at(22) });
    addVisit(data, { id: 'a', path: '/pricing', lang: 'vi', at: at(22, 11) });
    addVisit(data, { id: 'b', path: '/', lang: 'en', at: at(22, 12) });
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: at(21) });
    const s = summarize(data, at(22, 12));
    expect(s.today).toEqual({ visitors: 2, views: 3 });
    expect(s.week).toEqual({ visitors: 2, views: 4 });
    expect(s.total).toEqual({ visitors: 2, views: 4 });
    expect(s.series).toHaveLength(7);
    expect(s.topPages[0]).toEqual({ path: '/', views: 3 });
    expect(s.langs).toEqual({ vi: 3, en: 1, zh: 0 });
  });

  it('"đang truy cập" chỉ tính người hoạt động trong 5 phút', () => {
    const data = { visitors: {}, days: {} };
    addVisit(data, { id: 'a', path: '/', lang: 'vi', at: new Date(2026, 9, 22, 12, 0) });
    addVisit(data, { id: 'b', path: '/', lang: 'vi', at: new Date(2026, 9, 22, 12, 8) });
    expect(summarize(data, new Date(2026, 9, 22, 12, 10)).activeNow).toBe(1);
  });

  it('dữ liệu mẫu có số liệu hợp lý', () => {
    const s = summarize(sampleData(at(22)), at(22));
    expect(s.total.visitors).toBeGreaterThan(0);
    expect(s.week.views).toBeGreaterThanOrEqual(s.week.visitors);
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

  it('quản trị viên thấy số người truy cập sau khi nạp dữ liệu mẫu', async () => {
    const user = userEvent.setup();
    localStorage.setItem('dubchef-session', JSON.stringify({ name: 'Admin', email: ADMIN_EMAIL }));
    renderApp('/admin');
    expect(await screen.findByTestId('ad-total')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: I.ad_seed[0] }));
    await waitFor(() => expect(screen.getByTestId('ad-total').textContent).not.toBe('0'));
    expect(screen.getByRole('link', { name: I.nav_admin[0] })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: I.ad_reset[0] }));
    await waitFor(() => expect(screen.getByTestId('ad-total')).toHaveTextContent('0'));
  });
});
