import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../api/client.js';
import { I } from '../shared/i18n.js';

describe('Điều hướng theo vai trò', () => {
  it('Admin không thấy menu Tính năng / Bảng giá / Trải nghiệm khi mở trang công khai', () => {
    localStorage.setItem('dubchef-session', JSON.stringify({ name: 'Admin', email: ADMIN_EMAIL, role: 'admin' }));
    renderApp('/features');
    const nav = within(screen.getByRole('navigation', { name: I.navlabel[0] }));
    expect(nav.getByRole('link', { name: I.nav_admin[0] })).toHaveAttribute('href', '/admin/dashboard');
    for (const key of ['nav_features', 'nav_demo', 'nav_pricing', 'nav_about', 'nav_contact']) {
      expect(nav.queryByRole('link', { name: I[key][0] })).not.toBeInTheDocument();
    }
    expect(nav.queryByRole('link', { name: /Hồ sơ/ })).not.toBeInTheDocument();
  });

  it('Đăng nhập Admin đưa thẳng vào Dashboard quản trị', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(screen.getByLabelText(I.f_email[0]), ADMIN_EMAIL);
    await user.type(screen.getByLabelText(I.f_pass[0]), ADMIN_PASSWORD);
    await user.click(screen.getByRole('button', { name: I.nav_login[0] }));
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Điều hướng quản trị' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: I.nav_pricing[0] })).not.toBeInTheDocument();
  });
});
