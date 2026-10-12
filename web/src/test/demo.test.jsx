import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils.jsx';
import { I } from '../shared/i18n.js';

const vi_ = (key) => I[key][0]; // bản tiếng Việt (ngôn ngữ mặc định)

// Không gọi dịch vụ dịch thật khi chạy test — giả lập kết quả dịch
vi.mock('../shared/translate.js', async () => {
  const actual = await vi.importActual('../shared/translate.js');
  return {
    ...actual,
    translateLines: vi.fn(async (lines) =>
      lines
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => ({ vi: l, en: 'EN: ' + l, zh: '中文: ' + l }))
    ),
  };
});

// Môi trường test (jsdom) không có AudioContext/Worker thật — giả lập luôn 2 bước
// trích âm thanh và nhận diện giọng nói (Whisper) để test được luồng "để trống lời thoại".
vi.mock('../utils/audio.js', async () => {
  const actual = await vi.importActual('../utils/audio.js');
  return {
    ...actual,
    fileToWhisperAudio: vi.fn(async () => ({ audio: new Float32Array(10), duration: 4 })),
  };
});

vi.mock('../utils/whisper.js', () => ({
  transcribeVideoAudio: vi.fn(async (_audio, _lang, onPhase) => {
    if (onPhase) { onPhase('model'); onPhase('listening'); }
    return {
      text: 'Đập trứng vào bát. Xào cùng cà chua.',
      chunks: [
        { text: 'Đập trứng vào bát.', timestamp: [0, 2] },
        { text: 'Xào cùng cà chua.', timestamp: [2, 4] },
      ],
    };
  }),
}));

async function fillMinimal(user) {
  const file = new File(['nội dung giả'], 'mon-an.mp4', { type: 'video/mp4' });
  const input = document.querySelector('input[type="file"]');
  await user.upload(input, file);
  await user.type(screen.getByLabelText(vi_('d_script_label')), 'Đập trứng vào bát.\nXào cùng cà chua.');
}

describe('Trang Trải nghiệm (luồng dịch thật)', () => {
  it('bấm dịch khi chưa chọn video thì báo lỗi', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));
    expect(await screen.findByText(vi_('d_need'))).toBeInTheDocument();
  });

  it('dán liên kết video nhưng chưa nhập lời thoại thì báo lỗi (liên kết không tự nhận diện giọng nói được)', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await user.type(screen.getByLabelText(vi_('d_url')), 'https://example.com/video.mp4');
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));
    expect(await screen.findByText(vi_('d_need_script'))).toBeInTheDocument();
  });

  it('tải video lên nhưng để trống lời thoại: tự nhận diện giọng nói rồi dịch xong hiện video, phụ đề', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    const file = new File(['nội dung giả'], 'mon-an.mp4', { type: 'video/mp4' });
    await user.upload(document.querySelector('input[type="file"]'), file);
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));

    expect(await screen.findByText(vi_('d_done'))).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
    const list = within(screen.getByRole('list', { name: vi_('d_steps') }));
    expect(list.getByRole('button', { name: 'Đập trứng vào bát.' })).toBeInTheDocument();
    expect(list.getByRole('button', { name: 'Xào cùng cà chua.' })).toBeInTheDocument();
  });

  it('đủ video và lời thoại tự gõ: dịch xong thì hiện video thật, phụ đề và bản dịch', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await fillMinimal(user);
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));

    expect(await screen.findByText(vi_('d_done'))).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
    // Câu này hiện cả ở phụ đề trên video lẫn trong danh sách bước, nên có thể khớp nhiều chỗ
    expect(screen.getAllByText('Đập trứng vào bát.').length).toBeGreaterThan(0);
    expect(screen.getByText(/mon-an\.mp4/)).toBeInTheDocument();
  });

  it('dịch lỗi (mất mạng) thì hiện thông báo lỗi, không hiện trình phát', async () => {
    const { translateLines } = await import('../shared/translate.js');
    translateLines.mockRejectedValueOnce(Object.assign(new Error('net'), { code: 'net' }));

    const user = userEvent.setup();
    renderApp('/demo');
    await fillMinimal(user);
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));

    expect(await screen.findByText(vi_('e_net'))).toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();
  });

  it('bật phụ đề tiếng Anh sau khi dịch xong', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await fillMinimal(user);
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));
    await screen.findByText(vi_('d_done'));

    const subsGroup = within(screen.getByRole('group', { name: vi_('d_subs') }));
    const en = subsGroup.getByRole('button', { name: 'EN' });
    await user.click(en);
    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('EN: Đập trứng vào bát.')).toBeInTheDocument();
  });

  it('bấm một đoạn trong danh sách thì chuyển sang đoạn đó', async () => {
    const user = userEvent.setup();
    renderApp('/demo');
    await fillMinimal(user);
    await user.click(screen.getByRole('button', { name: vi_('d_translate_btn') }));
    await screen.findByText(vi_('d_done'));

    const list = within(screen.getByRole('list', { name: vi_('d_steps') }));
    await user.click(list.getByRole('button', { name: 'Xào cùng cà chua.' }));
    expect(list.getByRole('button', { name: 'Xào cùng cà chua.' })).toHaveAttribute('aria-current', 'true');
  });
});
