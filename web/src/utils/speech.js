export const hasSpeech =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export const LANGCODE = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN' };

/** Tìm giọng đọc của trình duyệt cho ngôn ngữ (vi | en | zh). */
export function voiceFor(lang) {
  if (!hasSpeech) return null;
  const list = window.speechSynthesis.getVoices();
  return list.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang)) || null;
}

export function voicesLoaded() {
  return hasSpeech && window.speechSynthesis.getVoices().length > 0;
}

/** { vi: bool, en: bool, zh: bool } — true nếu máy thật sự có giọng đọc cho ngôn ngữ đó.
 *  Trả về null khi danh sách giọng chưa tải xong (tránh khoá nhầm lúc mới vào trang). */
export function availableVoiceLangs() {
  if (!hasSpeech || !voicesLoaded()) return null;
  return { vi: !!voiceFor('vi'), en: !!voiceFor('en'), zh: !!voiceFor('zh') };
}

/** Ngôn ngữ đầu tiên (ưu tiên theo thứ tự truyền vào) có giọng đọc thật trên máy, hoặc 'off' nếu không có gì. */
export function firstAvailableVoice(preferred, order = ['vi', 'en', 'zh']) {
  if (preferred && voiceFor(preferred)) return preferred;
  const found = order.find((l) => voiceFor(l));
  return found || 'off';
}

export function stopSpeech() {
  if (hasSpeech) {
    try { window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ }
  }
}

export const reduceMotion =
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
