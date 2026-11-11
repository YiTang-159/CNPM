import { useEffect, useRef } from 'react';
export function useAutoRefresh(load, enabled = true, milliseconds = 15000) {
  const latest = useRef(load);
  useEffect(() => { latest.current = load; }, [load]);
  useEffect(() => {
    if (!enabled) return undefined;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try { await latest.current(); } catch { /* page displays its own error */ }
      finally { pending = false; }
    };
    const timer = window.setInterval(refresh, milliseconds);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [enabled, milliseconds]);
}
