import { Card } from '../../components/ui/index.js';
import styles from './Dashboard.module.css';

export const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <Card className={styles.stat}>
    <div className={styles.statLabel}>
      {Icon && <Icon size={13} strokeWidth={2} style={tone ? { color: `var(--${tone})` } : undefined} />}
      {label}
    </div>
    <div className={styles.statValue} style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
    {hint && <div className={styles.statHint}>{hint}</div>}
  </Card>
);
