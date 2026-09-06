import clsx from 'clsx';
import styles from './Card.module.css';

export function Card({ as: Tag = 'div', padded = false, interactive = false, className, children, ...props }) {
  return (
    <Tag
      className={clsx(styles.card, padded && styles.padded, interactive && styles.interactive, className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export const CardHeader = ({ title, subtitle, actions }) => (
  <div className={styles.header}>
    <div className={styles.headerText}>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
    {actions}
  </div>
);

export const CardBody = ({ flush = false, className, children }) => (
  <div className={clsx(flush ? styles.bodyFlush : styles.body, className)}>{children}</div>
);
