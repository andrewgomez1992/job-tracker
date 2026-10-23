import { Code2, FlaskConical, RotateCcw, X } from 'lucide-react';
import { BROWSER_DEMO } from '../api/client.js';
import styles from './DemoBanner.module.css';

const REPO_URL = 'https://github.com/andrewgomez1992/job-tracker';

/** Shown only in the browser demo build. */
export function DemoBanner() {
  if (!BROWSER_DEMO) return null;
  const reset = async () => { (await import('./api.js')).resetDemo(); };
  const exit = () => {
    try { sessionStorage.removeItem('trail.browserDemo'); } catch { /* ignore */ }
    window.location.href = '/';
  };
  return (
    <div className={styles.banner} role="note">
      <FlaskConical size={14} aria-hidden />
      <span className={styles.text}>Live demo with made-up data. Click around: changes stay in your browser.</span>
      <button type="button" onClick={reset}><RotateCcw size={13} /> Reset</button>
      <a href={REPO_URL} target="_blank" rel="noreferrer"><Code2 size={13} /> Code</a>
      {import.meta.env.VITE_DEMO !== '1' && (
        <button type="button" onClick={exit} aria-label="Exit demo"><X size={13} /> Exit</button>
      )}
    </div>
  );
}
