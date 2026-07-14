import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useAutosave — Debounce-save overlays/pages after last change.
 * Uses the existing updateTemplate endpoint, no new backend needed.
 * Provides Saving/Saved/Offline status indicator.
 */
const useAutosave = ({
  templateId,
  overlays,
  pages,
  metadata,
  updateTemplateFn,
  enabled = true,
  debounceMs = 7000,
}) => {
  const [status, setStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error' | 'offline'
  const timerRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify({ overlays, pages }));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = () => { if (mountedRef.current && status === 'offline') setStatus('unsaved'); };
    const handleOffline = () => { if (mountedRef.current) setStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status]);

  // Detect changes and schedule autosave
  useEffect(() => {
    if (!enabled || !templateId) return;

    const currentData = JSON.stringify({ overlays, pages });
    if (currentData === lastSavedRef.current) return;

    setStatus('unsaved');

    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!mountedRef.current || !navigator.onLine) {
        if (mountedRef.current) setStatus('offline');
        return;
      }

      setStatus('saving');
      try {
        const payload = { overlays, metadata };
        if (pages && pages.length > 0) payload.pages = pages;

        await updateTemplateFn(templateId, payload);

        if (mountedRef.current) {
          lastSavedRef.current = currentData;
          setStatus('saved');
        }
      } catch (err) {
        if (mountedRef.current) {
          setStatus('error');
          console.error('Autosave failed:', err);
        }
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [overlays, pages, metadata, templateId, updateTemplateFn, enabled, debounceMs]);

  /** Force an immediate save (bypasses debounce) */
  const forceSave = useCallback(async () => {
    if (!templateId || !navigator.onLine) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    setStatus('saving');
    try {
      const payload = { overlays, metadata };
      if (pages && pages.length > 0) payload.pages = pages;

      await updateTemplateFn(templateId, payload);
      lastSavedRef.current = JSON.stringify({ overlays, pages });
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      console.error('Force save failed:', err);
    }
  }, [templateId, overlays, pages, metadata, updateTemplateFn]);

  /** Mark the current state as the saved baseline */
  const markAsSaved = useCallback(() => {
    lastSavedRef.current = JSON.stringify({ overlays, pages });
    setStatus('saved');
  }, [overlays, pages]);

  return {
    autosaveStatus: status,
    forceSave,
    markAsSaved,
  };
};

export default useAutosave;
