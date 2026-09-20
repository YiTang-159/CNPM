import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để chạy được khi đặt web ở thư mục con (ví dụ GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom', // giả lập trình duyệt để test giao diện
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
  },
});
