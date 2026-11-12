import { describe, expect, it } from 'vitest';
import { mediaClock, subtitleFileText, wordsIn } from './adminMediaFormats.js';

describe('Admin media export', () => {
  const lines = [
    { start: 0, end: 3, text: 'Xin chào' },
    { start: 3.5, end: 6, text: 'Cho gà vào nồi' },
  ];
  it('formats valid editor lines as a numbered SRT timeline', () => {
    expect(subtitleFileText(lines, 'srt')).toContain('1\n00:00:00,000 --> 00:00:03,000\nXin chào');
    expect(subtitleFileText(lines, 'srt')).toContain('2\n00:00:03,500 --> 00:00:06,000');
  });
  it('exports a WEBVTT file without inventing timing for invalid segments', () => {
    expect(subtitleFileText([...lines, { start: null, end: null, text: 'Không có giờ' }], 'vtt'))
      .toBe('WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nXin chào\n\n00:00:03.500 --> 00:00:06.000\nCho gà vào nồi\n');
  });
  it('counts words and formats long timecodes', () => {
    expect(wordsIn('Cho gà vào nồi')).toBe(4);
    expect(mediaClock(3661.246)).toBe('01:01:01,246');
  });
});
