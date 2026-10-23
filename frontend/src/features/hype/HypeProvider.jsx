import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flame, PartyPopper, Rocket, Target, Trophy, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { BROWSER_DEMO } from '../../api/client.js';
import { HYPE, MILESTONES, milestoneLine, pick } from './messages.js';
import styles from './Hype.module.css';

/** mode: 'unhinged' | 'clean' | 'off' */
const HypeContext = createContext({ mode: 'off', fire: () => {}, setMode: () => {} });

const ICONS = { applied: Rocket, screening: Zap, interviewing: Flame, offer: Trophy, milestone: PartyPopper, goal: Target, random: Flame };
const BIG = new Set(['offer', 'milestone', 'interviewing', 'goal']);
const COLORS = ['#5a5ae0', '#ff4d6d', '#ffb703', '#06d6a0', '#4cc9f0', '#f72585'];

export function HypeProvider({ children }) {
  // The public demo starts with the clean lines; your own copy starts unhinged.
  const [mode, setMode] = useLocalStorage('trail.hype.mode', BROWSER_DEMO ? 'clean' : 'unhinged');
  const [pop, setPop] = useState(null);
  const timer = useRef();

  const dismiss = useCallback(() => { clearTimeout(timer.current); setPop(null); }, []);

  /** fire('applied', { count }) | fire('screening') | fire('random') */
  const fire = useCallback((event, ctx = {}) => {
    if (mode === 'off') return;
    const set = HYPE[mode] ?? HYPE.unhinged;
    let kind = event;
    let text = pick(set[event] ?? set.random);
    if (event === 'applied' && ctx.count && MILESTONES.includes(ctx.count)) {
      kind = 'milestone';
      text = milestoneLine(ctx.count, mode);
    } else if (event === 'applied' && ctx.goalHit) {
      kind = 'goal';
      text = pick(set.goal);
    }
    clearTimeout(timer.current);
    setPop({ id: crypto.randomUUID(), kind, text, sub: event === 'applied' && ctx.count ? `#${ctx.count}` : null });
    timer.current = setTimeout(() => setPop(null), BIG.has(kind) ? 4200 : 2800);
  }, [mode]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!pop) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pop, dismiss]);

  const value = useMemo(() => ({ mode, setMode, fire }), [mode, setMode, fire]);
  const Icon = pop ? ICONS[pop.kind] ?? Flame : null;
  const big = pop && BIG.has(pop.kind);

  return (
    <HypeContext.Provider value={value}>
      {children}
      {pop && createPortal(
        <div className={clsx(styles.layer, big && styles.layerBig)} onClick={dismiss} role="status" aria-live="polite">
          {big && (
            <div className={styles.confetti} aria-hidden>
              {Array.from({ length: 36 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    '--x': `${Math.random() * 100}vw`,
                    '--d': `${Math.random() * 0.6}s`,
                    '--r': `${Math.random() * 720 - 360}deg`,
                    '--c': COLORS[i % COLORS.length],
                  }}
                />
              ))}
            </div>
          )}
          <div key={pop.id} className={clsx(styles.pop, styles[pop.kind], big && styles.popBig)}>
            <Icon size={big ? 34 : 22} strokeWidth={2.2} className={styles.popIcon} aria-hidden />
            <div className={styles.popText}>{pop.text}</div>
            {pop.sub && <div className={styles.popSub}>application {pop.sub}</div>}
          </div>
        </div>,
        document.body,
      )}
    </HypeContext.Provider>
  );
}

export const useHype = () => useContext(HypeContext);
