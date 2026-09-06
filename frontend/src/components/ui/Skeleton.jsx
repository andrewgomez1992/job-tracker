import styles from './Skeleton.module.css';

export const Skeleton = ({ width = '100%', height = 16, radius }) => (
  <div className={styles.skeleton} style={{ width, height, borderRadius: radius }} />
);

export const SkeletonStack = ({ rows = 3, height = 62 }) => (
  <div className={styles.stack}>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} height={height} radius="var(--radius-lg)" />
    ))}
  </div>
);
