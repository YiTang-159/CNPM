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

export function stopSpeech() {
  if (hasSpeech) {
    try { window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ }
  }
}

export const reduceMotion =
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
