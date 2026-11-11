import { PRICES } from './i18n.js';

const LOCALES = ['vi-VN', 'en-US', 'zh-CN'];
const CURRENCIES = ['VND', 'USD', 'CNY'];
const FALLBACK = [
  (n) => n.toLocaleString ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫' : n + ' ₫',
  (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2)),
  (n) => '¥' + (Number.isInteger(n) ? n : n.toFixed(2)),
];

/** Định dạng tiền theo ngôn ngữ giao diện (L = 0 Việt, 1 Anh, 2 Trung). Số lẻ (ví dụ 3,6 USD) hiện đủ 2 chữ số thập phân. */
export function formatMoney(L, n) {
  const digits = Number.isInteger(n) ? 0 : 2;
  try {
    return new Intl.NumberFormat(LOCALES[L], {
      style: 'currency',
      currency: CURRENCIES[L],
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  } catch (e) {
    return FALLBACK[L](n);
  }
}

/** Giá của gói p (0..2). Trả theo năm được giảm 20%. */
export function planPrice(L, p, yearly) {
  const base = PRICES[L][p];
  return yearly ? base * 0.8 : base;
}

/** SQL stores VND in dong and USD/CNY in cents/fen. Never display minor units as major currency. */
export function formatMinorMoney(amountMinor, currency, locale = 'vi-VN') {
  const code = String(currency || 'VND').trim();
  const divisor = code === 'VND' ? 1 : 100;
  const value = Number(amountMinor || 0) / divisor;
  try { return new Intl.NumberFormat(locale, { style:'currency', currency:code,
    minimumFractionDigits:code === 'VND' ? 0 : 2, maximumFractionDigits:code === 'VND' ? 0 : 2 }).format(value); }
  catch { return `${value} ${code}`; }
}
