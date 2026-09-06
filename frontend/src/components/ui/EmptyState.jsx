import clsx from 'clsx';
import styles from './EmptyState.module.css';

export const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={clsx(styles.empty, compact && styles.compact)}>
    {Icon && <div className={styles.icon}><Icon size={22} strokeWidth={1.7} /></div>}
    <div className={styles.title}>{title}</div>
    {description && <p className={styles.description}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);
