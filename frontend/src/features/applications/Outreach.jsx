import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Search } from 'lucide-react';
import clsx from 'clsx';
import { NOTE_LIMIT, buildTemplates, peopleSearches } from '../../lib/outreach.js';
import styles from './Outreach.module.css';

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* ignore */ }
  };
  return (
    <button type="button" className={styles.copy} onClick={copy}>
      {done ? <Check size={13} /> : <Copy size={13} />} {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function Outreach({ application }) {
  const company = application.company.name;
  const role = application.role;
  const applied = application.status !== 'saved';
  const [tab, setTab] = useState('note');
  const [name, setName] = useState('');

  const searches = useMemo(() => peopleSearches(company), [company]);

  const templates = useMemo(() => buildTemplates({ company, role, applied }), [company, role, applied]);
  const current = templates.find((t) => t.id === tab) ?? templates[0];
  const text = current.text.replaceAll('{name}', name.trim() || '{name}');
  const over = current.id === 'note' && text.length > NOTE_LIMIT;

  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.label}>1 · Find people</div>
        <div className={styles.searches}>
          {searches.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={styles.search}>
              <Search size={13} className={styles.searchIcon} aria-hidden />
              <span className={styles.searchText}>
                <span className={styles.searchLabel}>{s.label}</span>
                <span className={styles.searchHint}>{s.hint}</span>
              </span>
              <ExternalLink size={12} className={styles.searchIcon} aria-hidden />
            </a>
          ))}
        </div>
        <p className={styles.tip}>
          Aim for 2 or 3 people: one recruiter, plus the likely manager or an engineer on the team.
          Message within 48 hours of applying. Log each person under Contacts so follow-ups show up on Today.
        </p>
      </div>

      <div>
        <div className={styles.label}>2 · Say this</div>
        <div className={styles.tabs} role="tablist">
          {templates.map((t) => (
            <button
              key={t.id} type="button" role="tab" aria-selected={t.id === tab}
              className={clsx(styles.tab, t.id === tab && styles.tabActive)} onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.who}>{current.who}</div>
        <input
          className={styles.name} placeholder="Their first name" value={name}
          onChange={(e) => setName(e.target.value)} aria-label="Their first name"
        />
        <pre className={styles.message}>{text}</pre>
        <div className={styles.footer}>
          <span className={clsx(styles.count, over && styles.countOver)}>
            {text.length}{current.id === 'note' ? ` / ${NOTE_LIMIT}` : ''} chars
          </span>
          <CopyButton text={text} />
        </div>
      </div>
    </div>
  );
}
