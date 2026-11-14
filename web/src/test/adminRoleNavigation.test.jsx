import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../api/client.js';
import { I } from '../shared/i18n.js';

const adminSession = () => localStorage.setItem('dubchef-session', JSON.stringify({
  name: 'Admin', email: ADMIN_EMAIL, role: 'admin',
}));

describe('Tách không gian quản trị và website công khai', () => {
  it('Admin xem website có nhãn xem trước và đường về Dashboard, không có menu mua dịch vụ', () => {
    adminSession();
    renderApp('/features');
    expect(screen.getByText('Chế độ xem công khai')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Về trang quản trị' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Về trang quản trị' })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.queryByText(/không phải khu vực quản lý/)).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: I.navlabel[0] })).not.toBeInTheDocument();
  });

  it('Admin có thể mở menu tài khoản và vào Hồ sơ & bảo mật', async () => {
    adminSession();
    const user = userEvent.setup();
    renderApp('/admin/profile');
    expect(screen.getByRole('heading', { name: 'Hồ sơ & bảo mật' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: I.navlabel[0] })).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Admin Quản trị viên/ }));
    const menu = screen.getByRole('link', { name: /Hồ sơ & bảo mật/ });
    expect(menu).toHaveAttribute('href','/admin/profile');
    expect(screen.getByRole('button', { name: /Đăng xuất/ })).toBeInTheDocument();
  });

  it('Admin vào đường dẫn hồ sơ khách được chuyển về hồ sơ quản trị', () => {
    adminSession();
    renderApp('/account');
    expect(screen.getByRole('heading', { name: 'Hồ sơ & bảo mật' })).toBeInTheDocument();
    expect(screen.queryByText('Đơn hàng của tôi')).not.toBeInTheDocument();
  });

  it('Đăng nhập Admin đưa thẳng vào Dashboard quản trị', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText(I.f_email[0]), ADMIN_EMAIL);
    await user.type(screen.getByLabelText(I.f_pass[0]), ADMIN_PASSWORD);
    await user.click(screen.getByRole('button', { name: I.nav_login[0] }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Điều hướng quản trị' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: I.nav_pricing[0] })).not.toBeInTheDocument();
  });

  it('Admin không thể mở màn hình thanh toán khi xem bảng giá', () => {
    adminSession();
    renderApp('/pricing');
    expect(screen.getByText('Bảng giá dành cho khách hàng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quản lý chính sách giá' })).toHaveAttribute('href','/admin/pricing');
    expect(screen.queryByRole('button', { name: I.co_btn[0] })).not.toBeInTheDocument();
  });

  it('Tài khoản khách vẫn có menu Tính năng và Bảng giá', () => {
    renderApp('/features');
    const nav = within(screen.getByRole('navigation', { name: I.navlabel[0] }));
    expect(nav.getByRole('link', { name: I.nav_pricing[0] })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: I.nav_features[0] })).toBeInTheDocument();
  });
});
