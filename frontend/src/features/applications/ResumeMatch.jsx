import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { matchResume, readResume } from '../../lib/resume.js';
import styles from './ResumeMatch.module.css';

export function ResumeMatch({ application }) {
  const result = useMemo(
    () => matchResume(`${application.jobDescription ?? ''}\n${application.summary ?? ''}`, readResume()),
    [application],
  );
  const tone = result.score >= 75 ? 'good' : result.score >= 50 ? 'ok' : 'low';
  const verdict = tone === 'good' ? 'Strong match' : tone === 'ok' ? 'Decent match' : 'Stretch';

  if (result.matched.length + result.missing.length === 0) {
    return <p className={styles.empty}>No recognisable skills in the posting yet. Paste the job description to score it.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={clsx(styles.ring, styles[tone])} style={{ '--p': `${result.score}%` }}>
          <span>{result.score}</span>
        </div>
        <div>
          <div className={styles.verdict}>{verdict}</div>
          <div className={styles.sub}>{result.matched.length} of {result.matched.length + result.missing.length} skills they mention</div>
        </div>
      </div>

      <div className={styles.chips}>
        {result.matched.map((s) => <span key={s.key} className={clsx(styles.chip, styles.have)}>✓ {s.label}</span>)}
        {result.missing.map((s) => (
          <span key={s.key} className={clsx(styles.chip, styles.miss)} title={result.weight.get(s.key) < 1 ? 'Nice to have' : 'Required'}>
            {s.label}{result.weight.get(s.key) < 1 ? ' (bonus)' : ''}
          </span>
        ))}
      </div>

      {result.tips.length > 0 && (
        <ul className={styles.tips}>{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      )}
      <Link to="/tools#resume" className={styles.edit}>Edit the resume text this compares against →</Link>
    </div>
  );
}
