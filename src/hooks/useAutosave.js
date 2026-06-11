import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAutosave(key, data, { delay = 1500, enabled = true } = {}) {
  const { user } = useAuth();
  const [restored, setRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);
  const storageKey = user ? `eccp_draft_${user.id}_${key}` : null;

  useEffect(() => {
    if (!storageKey || restored) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data) setRestored(parsed);
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, [storageKey, restored]);

  useEffect(() => {
    if (!storageKey || !enabled || !data || Object.keys(data).length === 0) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ data, savedAt: Date.now() }));
        setLastSaved(new Date());
      } catch { /* ignore */ }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [data, storageKey, delay, enabled]);

  const clearDraft = () => {
    if (storageKey) localStorage.removeItem(storageKey);
  };

  return { draft: restored?.data, lastSaved, clearDraft, hasDraft: !!restored?.data };
}
