import { Monitor, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../app/ThemeProvider.jsx';
import styles from './ThemeToggle.module.css';

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'Match system' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div className={styles.toggle} role="group" aria-label="Appearance">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={clsx(styles.option, preference === option.value && styles.active)}
          onClick={() => setPreference(option.value)}
          aria-pressed={preference === option.value}
          aria-label={option.label}
          title={option.label}
        >
          <option.icon size={13} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
