import { Flame } from 'lucide-react';
import clsx from 'clsx';
import { useHype } from './HypeProvider.jsx';
import styles from './Hype.module.css';

const NEXT = { unhinged: 'clean', clean: 'off', off: 'unhinged' };
const LABEL = { unhinged: 'Hype: unhinged', clean: 'Hype: clean', off: 'Hype: off' };

export function HypeToggle() {
  const { mode, setMode } = useHype();
  return (
    <button
      type="button"
      className={clsx(styles.toggle, styles[`toggle_${mode}`])}
      onClick={() => setMode(NEXT[mode] ?? 'unhinged')}
      title={`${LABEL[mode]} (click to change)`}
      aria-label={LABEL[mode]}
    >
      <Flame size={13} strokeWidth={2.2} />
      <span>{mode === 'unhinged' ? 'Unhinged' : mode === 'clean' ? 'Clean' : 'Off'}</span>
    </button>
  );
}
