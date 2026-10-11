import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom chưa có các hàm cuộn trang
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

beforeEach(() => {
  localStorage.clear(); // mỗi bài test bắt đầu với trình duyệt "sạch"
});

afterEach(() => {
  cleanup();
});
