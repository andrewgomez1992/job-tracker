import { useEffect } from 'react';

const isTypingTarget = (target) =>
  target instanceof HTMLElement
  && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * useHotkey('k', handler, { meta: true }) - ignores keystrokes typed into fields
 * unless allowInInput is set.
 */
export function useHotkey(key, handler, { meta = false, allowInInput = false } = {}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (meta && !(event.metaKey || event.ctrlKey)) return;
      if (!meta && (event.metaKey || event.ctrlKey)) return;
      if (!allowInInput && isTypingTarget(event.target)) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, meta, allowInInput]);
}
