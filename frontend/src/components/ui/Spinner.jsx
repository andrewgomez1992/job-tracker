import clsx from 'clsx';
import styles from './Spinner.module.css';

export const Spinner = ({ size = 18, center = false }) => (
  <div
    className={clsx(styles.spinner, center && styles.center)}
    style={{ '--size': `${size}px` }}
    role="status"
    aria-label="Loading"
  />
);
