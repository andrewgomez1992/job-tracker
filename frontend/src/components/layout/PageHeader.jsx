import { ChevronLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

export function PageHeader({ title, subtitle, actions, onBack, backLabel = 'Back' }) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            <ChevronLeft size={15} /> {backLabel}
          </button>
        )}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
