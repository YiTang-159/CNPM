import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import App from '../../App';
import { CUES, I } from '../shared/i18n';

const vi = (key) => I[key][0]; // bản tiếng Việt (ngôn ngữ mặc định)

// Không gọi dịch vụ dịch thật khi chạy test — giả lập kết quả dịch
jest.mock('../shared/translate', () => ({
  ...jest.requireActual('../shared/translate'),
  translateLines: jest.fn(async (lines) =>
    lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ vi: l, en: 'EN: ' + l, zh: '中文: ' + l }))
  ),
}));

// Không chạy whisper.rn thật khi test — mặc định giả lập "chưa khả dụng" (giống Expo Go/chưa build native);
// từng test có thể gọi lại mockReturnValueOnce/mockResolvedValueOnce để giả lập trường hợp đã build native.
jest.mock('../utils/sttNative', () => {
  const actual = jest.requireActual('../utils/sttNative');
  return {
    ...actual,
    isNativeSTTAvailable: jest.fn(() => false),
    transcribeVideoFile: jest.fn(),
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
  DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true });
});

describe('Ứng dụng di động Dubchef', () => {
  it('trang chủ hiện tiêu đề và 3 dòng lồng tiếng Việt / Anh / Trung', () => {
    render(<App />);
    expect(screen.getByText(vi('h_title'))).toBeTruthy();
    expect(screen.getByText(CUES[0].vi)).toBeTruthy();
    expect(screen.getByText(CUES[0].en)).toBeTruthy();
    expect(screen.getByText(CUES[0].zh)).toBeTruthy();
  });

  it('đổi ngôn ngữ giao diện sang tiếng Anh', async () => {
    render(<App />);
    fireEvent.press(screen.getByRole('radio', { name: 'EN' }));
    expect(await screen.findByText(I.h_title[1])).toBeTruthy();
  });

  it('bảng giá: chọn thanh toán theo năm thì giá giảm 20%', async () => {
    render(<App />);
    fireEvent.press(screen.getByText(vi('nav_pricing')));
    expect(await screen.findByText(/250\.000/)).toBeTruthy();

    fireEvent.press(screen.getByText(vi('pr_yearly')));
    expect(await screen.findByText(/200\.000/)).toBeTruthy();
  });

  it('trải nghiệm: bấm dịch khi chưa chọn video thì báo lỗi', async () => {
    render(<App />);
    fireEvent.press(screen.getByText(vi('nav_demo')));
    fireEvent.press(await screen.findByRole('button', { name: vi('d_translate_btn') }));
    expect(await screen.findByText(vi('d_need'))).toBeTruthy();
  });

  it('trải nghiệm: có video nhưng chưa nhập lời thoại thì tự nhận diện (báo chưa khả dụng khi build chưa có whisper.rn)', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'video.mp4', uri: 'file:///video.mp4' }],
    });
    render(<App />);
    fireEvent.press(screen.getByText(vi('nav_demo')));
    fireEvent.press(await screen.findByText(vi('m_pick')));
    fireEvent.press(await screen.findByRole('button', { name: vi('d_translate_btn') }));
    // Trong môi trường test (và trong Expo Go), whisper.rn/ffmpeg-kit chưa được build native vào app
    // nên tính năng tự nhận diện báo "chưa khả dụng" thay vì chạy thật.
    expect(await screen.findByText(vi('d_stt_unavailable'))).toBeTruthy();
  });

  it('trải nghiệm: đủ video và lời thoại thì dịch thật và hiện kết quả', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'mon-an.mp4', uri: 'file:///mon-an.mp4' }],
    });
    render(<App />);
    fireEvent.press(screen.getByText(vi('nav_demo')));
    fireEvent.press(await screen.findByText(vi('m_pick')));
    fireEvent.changeText(await screen.findByLabelText(vi('d_script_label')), 'Đập trứng vào bát.\nXào cùng cà chua.');
    fireEvent.press(screen.getByRole('button', { name: vi('d_translate_btn') }));

    expect(await screen.findByText(vi('d_done'))).toBeTruthy();
    expect(screen.getByText('Đập trứng vào bát.')).toBeTruthy();
    expect(screen.getByTestId('mock-video')).toBeTruthy();
  });

  it('trải nghiệm: có video + đã build whisper.rn native thì tự nhận diện và dịch luôn', async () => {
    const sttNative = require('../utils/sttNative');
    sttNative.isNativeSTTAvailable.mockReturnValue(true);
    sttNative.transcribeVideoFile.mockResolvedValue([
      { text: 'Đập trứng vào bát.', start: 0, end: 2 },
      { text: 'Xào cùng cà chua.', start: 2, end: 4.5 },
    ]);

    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'mon-an.mp4', uri: 'file:///mon-an.mp4' }],
    });
    render(<App />);
    fireEvent.press(screen.getByText(vi('nav_demo')));
    fireEvent.press(await screen.findByText(vi('m_pick')));
    fireEvent.press(await screen.findByRole('button', { name: vi('d_translate_btn') }));

    expect(await screen.findByText(vi('d_done'))).toBeTruthy();
    expect(screen.getByText('Đập trứng vào bát.')).toBeTruthy();
    expect(sttNative.transcribeVideoFile).toHaveBeenCalledWith('file:///mon-an.mp4', expect.any(String), expect.any(Function));
  });

  it('tài khoản: đăng ký báo lỗi khi để trống, đủ thông tin thì đăng ký thành công', async () => {
    render(<App />);
    fireEvent.press(screen.getByText(vi('tab_account')));
    fireEvent.press(await screen.findByText(vi('rg_title')));

    fireEvent.press(await screen.findByRole('button', { name: vi('rg_btn') }));
    for (const key of ['e_name', 'e_email', 'e_pass', 'e_pass2', 'e_agree']) {
      expect(await screen.findByText(vi(key))).toBeTruthy();
    }

    fireEvent.changeText(screen.getByLabelText(vi('f_name')), 'An');
    fireEvent.changeText(screen.getByLabelText(vi('f_email')), 'an@example.com');
    fireEvent.changeText(screen.getByLabelText(vi('f_pass')), 'matkhau123');
    fireEvent.changeText(screen.getByLabelText(vi('f_pass2')), 'matkhau123');
    fireEvent.press(screen.getByRole('checkbox'));
    fireEvent.press(screen.getByRole('button', { name: vi('rg_btn') }));

    expect(await screen.findByText(/Xin chào, An/)).toBeTruthy();
  });
});
