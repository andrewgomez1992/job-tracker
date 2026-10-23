import { Flame, Minus, Plus, Target, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { useDaily } from '../../api/queries.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import styles from './GoalCard.module.css';

const weekday = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });

/** Today's application goal, the streak, and the last two weeks at a glance. */
export function GoalCard() {
  const { data } = useDaily();
  const [goal, setGoal] = useLocalStorage('trail.goal', 20);
  const today = data?.today ?? 0;
  const pct = Math.min(100, Math.round((today / goal) * 100));
  const done = today >= goal;
  const last14 = data?.days?.slice(-14) ?? [];
  const max = Math.max(goal, ...last14.map((d) => d.count), 1);
  const left = Math.max(0, goal - today);

  return (
    <section className={styles.card} aria-label="Daily goal">
      <div className={styles.top}>
        <div className={styles.goal}>
          <div className={styles.label}><Target size={14} /> Today&apos;s goal</div>
          <div className={styles.count}>
            <span className={clsx(styles.today, done && styles.todayDone)}>{today}</span>
            <span className={styles.of}>/ {goal}</span>
            <span className={styles.stepper}>
              <button type="button" onClick={() => setGoal((g) => Math.max(1, g - 5))} aria-label="Lower goal"><Minus size={12} /></button>
              <button type="button" onClick={() => setGoal((g) => Math.min(200, g + 5))} aria-label="Raise goal"><Plus size={12} /></button>
            </span>
          </div>
          <div className={styles.bar}><div className={clsx(styles.fill, done && styles.fillDone)} style={{ width: `${pct}%` }} /></div>
          <div className={styles.hint}>{done ? 'Goal hit. Everything else is a bonus.' : `${left} more to hit today's goal`}</div>
        </div>

        <div className={styles.streaks}>
          <div className={styles.streak}>
            <Flame size={20} className={clsx(styles.flame, (data?.streak ?? 0) > 0 && styles.flameOn)} />
            <div><div className={styles.big}>{data?.streak ?? 0}</div><div className={styles.small}>day streak</div></div>
          </div>
          <div className={styles.streak}>
            <Trophy size={18} className={styles.trophy} />
            <div><div className={styles.big}>{data?.best ?? 0}</div><div className={styles.small}>best</div></div>
          </div>
        </div>
      </div>

      <div className={styles.chart} aria-label="Applications per day, last 14 days">
        {last14.map((d) => (
          <div key={d.date} className={styles.col} title={`${d.date}: ${d.count}`}>
            <div className={styles.track}>
              <div
                className={clsx(styles.barDay, d.count >= goal && styles.barHit, d.count === 0 && styles.barZero)}
                style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              />
            </div>
            <span className={styles.day}>{weekday(d.date)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
