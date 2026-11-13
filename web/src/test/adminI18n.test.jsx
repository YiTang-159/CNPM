import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from '../context/I18nContext.jsx';
import AdminT, { translateAdmin } from '../components/AdminTranslation.jsx';
import { ADMIN_TRANSLATIONS } from '../shared/i18n.js';

function LanguageProbe() {
  const { setL } = useI18n();
  return <div>
    <h1><AdminT vi="Tổng quan điều hành" /></h1>
    <span><AdminT vi="Đối soát thanh toán" /></span>
    <button onClick={() => setL(0)}>VI</button>
    <button onClick={() => setL(1)}>EN</button>
    <button onClick={() => setL(2)}>中文</button>
  </div>;
}

describe('Dubchef Admin i18n', () => {
  beforeEach(() => { window.localStorage.removeItem('dubchef-lang'); });
  it('switches headings and workflow labels without leaving the page', () => {
    render(<I18nProvider><LanguageProbe /></I18nProvider>);
    expect(screen.getByRole('heading', { name: 'Tổng quan điều hành' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('heading', { name: 'Operations overview' })).toBeTruthy();
    expect(screen.getByText('Payment reconciliation')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(screen.getByRole('heading', { name: '运营总览' })).toBeTruthy();
    expect(screen.getByText('付款对账')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'VI' }));
    expect(screen.getByText('Đối soát thanh toán')).toBeTruthy();
  });
  it('preserves customer-provided text and internal codes', () => {
    expect(translateAdmin('Hướng dẫn luộc gà trong 30s nhé!', 2)).toBe('Hướng dẫn luộc gà trong 30s nhé!');
    expect(translateAdmin('pending', 1)).toBe('Pending');
    expect(translateAdmin('paid', 2)).toBe('已付款');
    expect(translateAdmin('Không đọc được dữ liệu: timeout', 1)).toBe('Could not read data: timeout');
  });
  it('has both English and Chinese translations for every localized Admin label', () => {
    expect(Object.keys(ADMIN_TRANSLATIONS).length).toBeGreaterThan(400);
    for (const translations of Object.values(ADMIN_TRANSLATIONS)) {
      expect(translations).toHaveLength(2);
      expect(translations[0]?.length).toBeGreaterThan(0);
      expect(translations[1]?.length).toBeGreaterThan(0);
    }
  });
});
