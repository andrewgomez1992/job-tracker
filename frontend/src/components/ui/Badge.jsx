import clsx from 'clsx';
import { STATUS_META } from '../../lib/constants.js';
import styles from './Badge.module.css';

export function Badge({ children, tone, variant, size, dot = false, className, style }) {
  const toneStyle = tone
    ? { '--badge-bg': `var(--status-${tone}-soft)`, '--badge-fg': `var(--status-${tone})` }
    : undefined;
  return (
    <span
      className={clsx(styles.badge, variant && styles[variant], size === 'sm' && styles.sm, className)}
      style={{ ...toneStyle, ...style }}
    >
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ status, size, dot = true }) => (
  <Badge tone={status} size={size} dot={dot}>{STATUS_META[status]?.label ?? status}</Badge>
);
