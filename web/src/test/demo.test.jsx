import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { CUES, I } from '../shared/i18n.js';

const vi = (key) => I[key][0];

describe('Trang Trải nghiệm', () => {
  it('bấm dịch khi chưa chọn video thì báo lỗi', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await user.click(screen.getByRole('button', { name: vi('d_start') }));
    expect(await screen.findByText(vi('d_need'))).toBeInTheDocument();
  });

  it('dán liên kết video rồi bấm dịch thì quy trình bắt đầu chạy', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await user.type(screen.getByLabelText(vi('d_url')), 'https://example.com/video');
    await user.click(screen.getByRole('button', { name: vi('d_start') }));

    expect(await screen.findByText(vi('st_run'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: vi('d_start') })).toBeDisabled();
  });

  it('nút Phát đổi thành Tạm dừng và ngược lại', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await user.click(screen.getByRole('button', { name: vi('d_play') }));
    expect(screen.getByRole('button', { name: vi('d_pause') })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: vi('d_pause') }));
    expect(screen.getByRole('button', { name: vi('d_play') })).toBeInTheDocument();
  });

  it('bật phụ đề tiếng Anh thì hiện thêm dòng tiếng Anh trên video', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    const subs = within(screen.getByRole('group', { name: vi('d_subs') }));
    const en = subs.getByRole('button', { name: 'EN' });

    expect(en).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(CUES[0].en)).toBeNull();

    await user.click(en);

    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(CUES[0].en)).toBeInTheDocument();
  });

  it('bấm một bước trong danh sách thì chuyển sang bước đó', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    const list = within(screen.getByRole('list', { name: vi('d_steps') }));
    await user.click(list.getByRole('button', { name: CUES[2].vi }));
    expect(list.getByRole('button', { name: CUES[2].vi })).toHaveAttribute('aria-current', 'true');
  });
});
