import { describe, expect, it } from 'vitest';
import { toSrt } from '../utils/subtitles.js';

describe('Xuất phụ đề SRT', () => {
  it('giữ đúng ngôn ngữ và thời gian, bỏ đoạn thiếu mốc thay vì tự bịa', () => {
    const result = toSrt([
      { vi: 'Chào bạn', start: 1.25, end: 3.5 },
      { vi: 'Không có mốc', start: null, end: null },
      { en: 'Only English', start: 4, end: 6 },
      { vi: 'Sai thứ tự', start: 10, end: 9 },
    ], 'vi');
    expect(result).toBe('1\n00:00:01,250 --> 00:00:03,500\nChào bạn\n');
  });
});
