import clsx from 'clsx';
import styles from './Tabs.module.css';

/** items: [{ value, label, count? }] */
export function Tabs({ items, value, onChange, variant }) {
  return (
    <div className={clsx(styles.tabs, variant === 'underline' && styles.underline)} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={clsx(styles.tab, value === item.value && styles.active)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count != null && <span className={styles.count}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
