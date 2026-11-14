/** This is PUBLIC metadata bundled into the browser, never a place for secrets. */
const email = String(import.meta.env.VITE_CONTACT_EMAIL || '').trim();
export const CONTACT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith('.example') ? email : '';
