/** Export only valid, timed editor segments; no timestamps are guessed. */
const valid = row => row && Number.isFinite(row.start) && Number.isFinite(row.end) &&
  row.start >= 0 && row.end > row.start && row.end <= 86400 && String(row.text || '').trim();
const pad = (n, length = 2) => String(n).padStart(length, '0');
export function mediaClock(seconds, separator = ',') {
  const ms = Math.round(seconds * 1000);
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${separator}${pad(ms % 1000, 3)}`;
}
export function subtitleFileText(lines, format = 'srt') {
  const rows = (lines || []).filter(valid);
  if (format === 'vtt') return 'WEBVTT\n\n' + rows.map(row =>
    `${mediaClock(row.start, '.')} --> ${mediaClock(row.end, '.')}\n${row.text.trim()}\n`).join('\n');
  return rows.map((row, index) =>
    `${index + 1}\n${mediaClock(row.start)} --> ${mediaClock(row.end)}\n${row.text.trim()}\n`).join('\n');
}
export function saveMediaExport(text, filename, mime = 'text/plain;charset=utf-8') {
  if (!text) return false;
  const blob = new Blob(['\uFEFF', text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 100);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export const wordsIn = value => String(value || '').trim().split(/\s+/u).filter(Boolean).length;
