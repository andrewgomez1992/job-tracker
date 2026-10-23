import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Search } from 'lucide-react';
import clsx from 'clsx';
import styles from './Outreach.module.css';

const li = (q) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
const google = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/** Free LinkedIn connection notes are capped at 200 characters. */
const NOTE_LIMIT = 200;

function buildTemplates({ company, role, applied }) {
  const did = applied ? 'just applied' : 'am applying';
  return [
    {
      id: 'note',
      label: 'Connect note',
      who: 'Anyone: recruiter, manager or engineer',
      text: `Hi {name}, I ${did} for the ${role} role at ${company}. Full stack engineer (React/Node, 4 yrs shipping billing to 50k+ users). Would love to connect!`,
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      who: 'Talent / technical recruiter at the company',
      text: `Hi {name}, I ${did} for the ${role} position at ${company} and wanted to reach out directly.

I'm a full stack engineer with 4 years at Thryv, where I built a free-trial program end to end (new Node.js microservice, React checkout and Recurly billing) for a SaaS platform with 50,000+ users.

The role lines up closely with what I've been doing, so I'd love to know if I might be a fit. Happy to share more anytime. Thanks!

Drew
drew-gomez.com`,
    },
    {
      id: 'manager',
      label: 'Hiring manager',
      who: 'Engineering manager / team lead likely hiring',
      text: `Hi {name}, I saw ${company} is hiring a ${role} and I ${did}. I'd guess it's on your team, or close to it.

Quick context: I've spent 4 years shipping full stack features (React, TypeScript, Node, SQL) on a 50k-user SaaS, mostly on subscriptions and billing. [One line on why this company or product specifically.]

If you're open to a 15 minute chat about what the team is working on, I'd really appreciate it.

Drew`,
    },
    {
      id: 'engineer',
      label: 'Engineer (referral)',
      who: 'An engineer on the team. Ask about the work, not for a job.',
      text: `Hi {name}, I'm looking at the ${role} opening at ${company} and saw you're on the engineering team. Would you be up for a quick 10 minute chat about what it's like there and the stack you work in?

I'm a full stack engineer (React/Node) and want to make sure it's a real fit before I go all in. No pressure at all. Thanks!`,
    },
    {
      id: 'followup',
      label: 'Follow-up',
      who: 'Send 5 to 7 days after no reply',
      text: `Hi {name}, just bumping this in case it got buried. Still very interested in the ${role} role at ${company}. Happy to send a resume or anything else that helps. Thanks either way!`,
    },
  ];
}

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

  const searches = useMemo(() => [
    { label: 'Recruiters', hint: 'Start here', href: li(`${company} technical recruiter`) },
    { label: 'Engineering managers', hint: 'Likely the hiring manager', href: li(`${company} engineering manager`) },
    { label: 'Software engineers', hint: 'Ask for a referral', href: li(`${company} software engineer`) },
    { label: 'BloomTech alumni', hint: 'Warmest cold contact', href: li(`${company} BloomTech Lambda School`) },
    { label: 'Google X-ray', hint: 'Finds profiles LinkedIn hides', href: google(`site:linkedin.com/in "${company}" ("engineering manager" OR recruiter OR "software engineer")`) },
  ], [company]);

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
