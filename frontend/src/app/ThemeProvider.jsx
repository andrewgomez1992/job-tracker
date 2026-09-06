import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'trail.theme';
const ThemeContext = createContext(null);

const systemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readPreference = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch { return 'system'; }
};

/**
 * Three-state theme: light, dark, or follow the OS. The resolved value is
 * written to <html data-theme> - the same attribute index.html sets before
 * first paint, so there is never a flash.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [resolved, setResolved] = useState(() =>
    (readPreference() === 'system' ? systemTheme() : readPreference()));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setResolved(preference === 'system' ? systemTheme() : preference);
    apply();
    if (preference !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch { /* private mode - the theme just will not persist */ }
  }, [resolved, preference]);

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved]);

  const value = useMemo(
    () => ({ theme: resolved, preference, setPreference, toggle }),
    [resolved, preference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
