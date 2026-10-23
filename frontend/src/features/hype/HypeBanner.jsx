import { useState } from 'react';
import { Flame, Shuffle } from 'lucide-react';
import { useHype } from './HypeProvider.jsx';
import { HYPE, pick } from './messages.js';
import styles from './Hype.module.css';

/** The rotating line on Today. Click the shuffle for another one. */
export function HypeBanner() {
  const { mode, fire } = useHype();
  const lines = (HYPE[mode] ?? HYPE.unhinged).random;
  const [line, setLine] = useState(() => pick(lines));
  const [spin, setSpin] = useState(0);
  if (mode === 'off') return null;
  const shuffle = () => {
    let next = pick(lines);
    if (lines.length > 1) while (next === line) next = pick(lines);
    setLine(next);
    setSpin((n) => n + 1);
  };
  return (
    <div className={styles.banner}>
      <Flame size={18} className={styles.bannerIcon} aria-hidden />
      <button type="button" key={spin} className={styles.bannerText} onClick={() => fire("random")} title="Hype me">{line}</button>
      <button type="button" className={styles.bannerBtn} onClick={shuffle} aria-label="Another one" title="Another one">
        <Shuffle size={14} />
      </button>
    </div>
  );
}
