import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { CUES, I } from '../shared/i18n.js';

describe('Ngôn ngữ và điều hướng', () => {
  it('đổi ngôn ngữ giao diện Việt / Anh / Trung', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const h1 = () => screen.getByRole('heading', { level: 1 });

    expect(h1()).toHaveTextContent(I.h_title[0]);
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(h1()).toHaveTextContent(I.h_title[1]);
    expect(localStorage.getItem('dubchef-lang')).toBe('en');

    await user.click(screen.getByRole('button', { name: '中文' }));
    expect(h1()).toHaveTextContent(I.h_title[2]);
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('bấm menu chuyển trang, đặt tiêu đề tab và đánh dấu trang đang mở', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const nav = within(screen.getByRole('navigation', { name: I.navlabel[0] }));

    await user.click(nav.getByRole('link', { name: I.nav_pricing[0] }));

    expect(await screen.findByRole('heading', { level: 1, name: I.pr_title[0] })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(I.pr_title[0] + ' | Dubchef'));
    expect(nav.getByRole('link', { name: I.nav_pricing[0] })).toHaveAttribute('aria-current', 'page');
  });

  it('liên kết "Bỏ qua đến nội dung" đưa tiêu điểm vào nội dung chính', async () => {
    const user = userEvent.setup();
    renderApp('/features');
    await user.click(screen.getByText(I.skip[0]));
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('trang không tồn tại hiện trang 404', () => {
    renderApp('/khong-ton-tai');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(I.nf_title[0]);
  });

  it('trang chủ hiện 3 track lồng tiếng và đổi bước khi bấm thanh tiến độ', async () => {
    const user = userEvent.setup();
    renderApp('/');
    expect(screen.getByText(CUES[0].vi)).toBeInTheDocument();
    expect(screen.getByText(CUES[0].en)).toBeInTheDocument();
    expect(screen.getByText(CUES[0].zh)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: I.step[0] + ' 2' }));

    expect(screen.getByText(CUES[1].vi)).toBeInTheDocument();
    expect(screen.getByText(CUES[1].en)).toBeInTheDocument();
    expect(screen.getByText(CUES[1].zh)).toBeInTheDocument();
    expect(screen.queryByText(CUES[0].vi)).toBeNull();
  });

  it('bảng giá: chuyển sang thanh toán theo năm thì giá giảm 20%', async () => {
    const user = userEvent.setup();
    renderApp('/pricing');
    expect(screen.getByText(/250\.000/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: I.pr_yearly[0] }));

    expect(screen.getByText(/200\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/250\.000/)).toBeNull();
  });
});
