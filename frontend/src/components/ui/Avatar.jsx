import clsx from 'clsx';
import { hueFromString, initials } from '../../lib/format.js';
import styles from './Avatar.module.css';

export const Avatar = ({ name, size = 34, round = false, className }) => (
  <div
    className={clsx(styles.avatar, round && styles.round, className)}
    style={{ '--avatar-size': `${size}px`, '--avatar-hue': hueFromString(name || '') }}
    aria-hidden
  >
    {initials(name)}
  </div>
);
