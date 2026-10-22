import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { I } from '../shared/i18n.js';
import { orderAmount, orders } from '../api/orders.js';

const login = () => localStorage.setItem('dubchef-session', JSON.stringify({ name: 'An', email: 'An@Example.com' }));
const saved = () => JSON.parse(localStorage.getItem('dubchef-orders') || '[]');

describe('api đơn hàng (chế độ lưu tạm)', () => {
  it('tạo đơn, thanh toán một lần, liệt kê theo email', async () => {
    const o = await orders.create({ name: 'An', email: 'An@Example.com', uploads: 3, outs: 3, L: 0 });
    expect(o).toMatchObject({ id: 1, status: 'pending', currency: 'VND', amountMinor: 90000, email: 'an@example.com' });
    const res = await orders.pay(o.id, 'momo');
    expect(res.order.status).toBe('paid');
    expect(res.payment.ref).toMatch(/^MOMO-/);
    await expect(orders.pay(o.id, 'card')).rejects.toThrow('not_payable'); // không trả hai lần
    expect(await orders.list('an@example.com')).toHaveLength(1);
    expect(await orders.list('khac@example.com')).toHaveLength(0);
  });

  it('đổi số tiền về đơn vị chính theo loại tiền', async () => {
    const o = await orders.create({ name: 'An', email: 'an@example.com', uploads: 3, outs: 3, L: 1 });
    expect(o.currency).toBe('USD');
    expect(orderAmount(o)).toBe(o.amountMinor / 100);
  });
});

describe('Nút Thanh toán ở trang Bảng giá', () => {
  it('chưa đăng nhập thì yêu cầu đăng nhập', async () => {
    const user = userEvent.setup();
    renderApp('/pricing');
    await user.click(screen.getByRole('button', { name: I.co_btn[0] }));
    expect(screen.getByRole('alert')).toHaveTextContent(I.co_need_login[0]);
    expect(saved()).toHaveLength(0);
  });

  it('đăng nhập rồi thanh toán thành công và lưu đơn đã trả', async () => {
    const user = userEvent.setup();
    login();
    renderApp('/pricing');
    await user.click(screen.getByRole('button', { name: I.co_btn[0] }));
    expect(screen.getByTestId('co-total')).toHaveTextContent('90.000');
    await user.click(screen.getByRole('radio', { name: I.co_bank[0] }));
    await user.click(screen.getByRole('button', { name: I.co_pay[0] }));
    expect(await screen.findByTestId('co-order')).toHaveTextContent('#1');
    expect(screen.getByTestId('co-ref').textContent).toMatch(/^BANK-/);
    await waitFor(() => expect(saved()[0]).toMatchObject({ status: 'paid', amountMinor: 90000, email: 'an@example.com' }));
  });

  it('không có nút thanh toán khi số video nhập sai', async () => {
    const user = userEvent.setup();
    renderApp('/pricing');
    await user.clear(screen.getByLabelText(I.pc_out[0]));
    await user.type(screen.getByLabelText(I.pc_out[0]), 'abc');
    expect(screen.queryByRole('button', { name: I.co_btn[0] })).toBeNull();
  });
});
