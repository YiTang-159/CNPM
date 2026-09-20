import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';
import { CUES, I } from '../shared/i18n';

const vi = (key) => I[key][0]; // bản tiếng Việt (ngôn ngữ mặc định)

beforeEach(async () => {
  await AsyncStorage.clear();
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
    fireEvent.press(await screen.findByText(vi('d_start')));
    expect(await screen.findByText(vi('d_need'))).toBeTruthy();
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
