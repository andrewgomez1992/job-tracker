import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Copy, ExternalLink, PartyPopper, Search, Send, SkipForward, X } from 'lucide-react';
import clsx from 'clsx';
import {
  contactMutations, useAddNote, useApplications, useContacts, useReminders, useUpdateApplication,
} from '../../api/queries.js';
import { NOTE_LIMIT, buildTemplates, peopleSearches } from '../../lib/outreach.js';
import { formatDueLabel, formatRelative } from '../../lib/format.js';
import { Avatar, Badge, Button, Card, EmptyState, SkeletonStack, StatusBadge, useToast } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import styles from './ReachOut.module.css';

const FOLLOW_UP = 'Follow up if no reply yet';
const RELATIONSHIPS = [
  { id: 'recruiter', label: 'Recruiter' },
  { id: 'hiring_manager', label: 'Manager' },
  { id: 'peer', label: 'Engineer' },
  { id: 'other', label: 'Other' },
];
const TEMPLATE_FOR = { recruiter: 'recruiter', hiring_manager: 'manager', peer: 'engineer', other: 'note' };

/**
 * Reach-out mode: steps through today's follow-ups one at a time.
 * Find a person, copy a message, send it yourself on LinkedIn, hit Sent.
 * Sent logs the contact + a note and clears the reminder (the backend then
 * queues the day-7 follow-up). Nothing is ever sent automatically.
 */
const WAITING = 'applied,screening,interviewing,offer';

/** Every job you've applied to, with who you've reached out to and what's next. */
function AllApplied({ onReachOut }) {
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useApplications({ status: WAITING, limit: 500, sort: 'applied', direction: 'asc' });
  const { data: contacts = [] } = useContacts({});

  const byApp = useMemo(() => {
    const map = new Map();
    for (const c of contacts) {
      if (!c.applicationId) continue;
      map.set(c.applicationId, [...(map.get(c.applicationId) ?? []), c]);
    }
    return map;
  }, [contacts]);

  const rows = useMemo(() => {
    const list = apps.map((a) => ({ app: a, people: byApp.get(a.id) ?? [] }));
    // Nobody contacted yet goes first, oldest application first within each group.
    return list.sort((x, y) => (x.people.length > 0) - (y.people.length > 0)
      || String(x.app.appliedAt).localeCompare(String(y.app.appliedAt)));
  }, [apps, byApp]);

  const todo = rows.filter((r) => r.people.length === 0).length;

  if (isLoading) return <Card><div style={{ padding: 'var(--space-5)' }}><SkeletonStack rows={4} height={44} /></div></Card>;
  if (!rows.length) return <Card><EmptyState icon={Send} title="Nothing applied yet" description="Apply to something and it shows up here." /></Card>;

  return (
    <Card>
      <div className={styles.listHead}>
        <span>{rows.length} applied</span>
        <Badge tone={todo ? 'rejected' : 'offer'}>{todo ? `${todo} with nobody contacted` : 'Everyone contacted'}</Badge>
      </div>
      <div className={styles.list}>
        {rows.map(({ app, people }) => (
          <div key={app.id} className={styles.item}>
            <button type="button" className={styles.itemMain} onClick={() => navigate(`/applications/${app.id}`)}>
              <Avatar name={app.company.name} size={34} />
              <span className={styles.itemText}>
                <span className={styles.itemTitle}>{app.company.name} <StatusBadge status={app.status} size="sm" /></span>
                <span className={styles.itemMeta}>{app.role}</span>
                <span className={styles.itemMeta}>
                  {app.appliedAt ? `Applied ${formatRelative(app.appliedAt)}` : 'Applied'}
                  {' · '}
                  {people.length
                    ? <span className={styles.ok}>Reached out: {people.map((p) => p.name).join(', ')}</span>
                    : <span className={styles.warn}>Nobody contacted yet</span>}
                </span>
                {app.nextAction && (
                  <span className={styles.itemMeta}>Next: {app.nextAction} · {formatDueLabel(app.nextActionAt)}</span>
                )}
              </span>
            </button>
            <Button variant={people.length ? 'secondary' : 'primary'} size="sm" icon={Send} onClick={() => onReachOut(app)}>
              {people.length ? 'Follow up' : 'Reach out'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ReachOutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: reminders, isLoading } = useReminders();
  const update = useUpdateApplication();
  const addNote = useAddNote();
  const createContact = contactMutations.useCreate();

  // Snapshot the queue once so finishing items doesn't reshuffle it under you.
  const [queue, setQueue] = useState(null);
  useEffect(() => {
    if (!queue && reminders) setQueue([...(reminders.overdue ?? []), ...(reminders.today ?? [])]);
  }, [reminders, queue]);

  const [view, setView] = useState('due');
  const [index, setIndex] = useState(0);
  const startOne = (one) => { setQueue([one]); setIndex(0); setSent(0); setView('due'); window.scrollTo(0, 0); };
  const [sent, setSent] = useState(0);
  const [name, setName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [rel, setRel] = useState('recruiter');
  const [tab, setTab] = useState('note');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const app = queue?.[index];
  const isFollowUp = app?.nextAction === FOLLOW_UP;

  useEffect(() => {
    setName(''); setLinkedin(''); setRel('recruiter'); setCopied(false);
    setTab(isFollowUp ? 'followup' : 'note');
  }, [index, isFollowUp]);

  const templates = useMemo(
    () => (app ? buildTemplates({ company: app.company.name, role: app.role, applied: app.status !== 'saved' }) : []),
    [app],
  );
  const current = templates.find((t) => t.id === tab) ?? templates[0];
  const firstName = name.trim().split(/\s+/)[0];
  const text = current ? current.text.replaceAll('{name}', firstName || '{name}') : '';
  const over = current?.id === 'note' && text.length > NOTE_LIMIT;

  const next = () => setIndex((i) => i + 1);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error('Could not copy', 'Select the text and copy it by hand.'); }
  };

  const finish = async (mode) => {
    if (!app) return;
    setBusy(true);
    try {
      const who = name.trim();
      const relLabel = RELATIONSHIPS.find((r) => r.id === rel)?.label.toLowerCase();
      if (mode === 'sent' && who) {
        await createContact.mutateAsync({
          applicationId: app.id, companyId: app.company.id, name: who, relationship: rel,
          linkedinUrl: linkedin.trim() || null, lastContactedAt: new Date().toISOString(),
        });
      }
      const note = mode === 'sent'
        ? `${isFollowUp ? 'Followed up with' : 'Reached out to'} ${who ? `${who} (${relLabel})` : 'someone on the team'} on LinkedIn.`
        : 'Couldn’t find anyone good to reach out to. Skipped.';
      await addNote.mutateAsync({ applicationId: app.id, message: note });
      await update.mutateAsync({ id: app.id, nextAction: null, nextActionAt: null });
      if (mode === 'sent') setSent((n) => n + 1);
      next();
    } catch (error) {
      toast.error('Could not save', error.message);
    } finally {
      setBusy(false);
    }
  };

  const total = queue?.length ?? 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reach out"
        subtitle={view === 'all' ? 'Every job you applied to, and who you’ve contacted' : total ? `${Math.min(index + 1, total)} of ${total} · ${sent} sent` : 'Today’s follow-ups, one at a time'}
        onBack={() => navigate('/')} backLabel="Today"
      />

      <div className={styles.views} role="tablist">
        <button type="button" role="tab" aria-selected={view === 'due'}
          className={clsx(styles.pill, view === 'due' && styles.pillOn)}
          onClick={() => { if (view !== 'due') { setQueue(null); setIndex(0); setSent(0); } setView('due'); }}>
          Due now{reminders ? ` (${(reminders.overdue?.length ?? 0) + (reminders.today?.length ?? 0)})` : ''}
        </button>
        <button type="button" role="tab" aria-selected={view === 'all'}
          className={clsx(styles.pill, view === 'all' && styles.pillOn)} onClick={() => setView('all')}>
          All applied
        </button>
      </div>

      {view === 'all' ? <AllApplied onReachOut={startOne} /> : <>
      {total > 0 && (
        <div className={styles.progress} aria-hidden>
          <span style={{ width: `${(Math.min(index, total) / total) * 100}%` }} />
        </div>
      )}

      {isLoading || !queue ? (
        <Card><div style={{ padding: 'var(--space-5)' }}><SkeletonStack rows={4} height={40} /></div></Card>
      ) : !app ? (
        <Card>
          <EmptyState
            icon={PartyPopper}
            title={total ? `Done. ${sent} message${sent === 1 ? '' : 's'} out.` : 'Nothing due right now'}
            description={total ? 'Follow-ups for each are queued for day 7. Now go apply to a few.' : 'When a reach-out comes due it shows up here.'}
          />
          <div className={styles.doneActions}>
            <Button variant="secondary" onClick={() => setView('all')}>See all applied</Button>
            <Button variant="primary" icon={ArrowRight} onClick={() => navigate('/')}>Back to Today</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className={styles.body}>
            <div className={styles.head}>
              <Avatar name={app.company.name} size={40} />
              <div className={styles.headText}>
                <div className={styles.company}>{app.company.name}</div>
                <div className={styles.role}>
                  {app.role}{app.appliedAt ? ` · applied ${formatRelative(app.appliedAt)}` : ''}
                </div>
              </div>
              <span className={clsx(styles.kind, isFollowUp && styles.kindFollow)}>
                {isFollowUp ? 'Follow-up' : 'First reach-out'}
              </span>
            </div>

            <section>
              <div className={styles.label}>1 · Find someone</div>
              <div className={styles.searches}>
                {peopleSearches(app.company.name).map((s) => (
                  <a key={s.id} href={s.href} target="_blank" rel="noreferrer" className={styles.search}
                    onClick={() => { if (TEMPLATE_FOR[s.id]) { setRel(s.id); if (!isFollowUp) setTab(TEMPLATE_FOR[s.id]); } }}>
                    <Search size={13} aria-hidden />
                    <span><b>{s.label}</b><small>{s.hint}</small></span>
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ))}
              </div>
            </section>

            <section>
              <div className={styles.label}>2 · Who are you messaging?</div>
              <div className={styles.whoRow}>
                <input className={styles.input} placeholder="Their name (optional)" value={name}
                  onChange={(e) => setName(e.target.value)} aria-label="Their name" />
                <input className={styles.input} placeholder="LinkedIn URL (optional)" value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)} aria-label="Their LinkedIn URL" />
                <div className={styles.pills} role="radiogroup" aria-label="Their role">
                  {RELATIONSHIPS.map((r) => (
                    <button key={r.id} type="button" role="radio" aria-checked={rel === r.id}
                      className={clsx(styles.pill, rel === r.id && styles.pillOn)}
                      onClick={() => { setRel(r.id); if (!isFollowUp) setTab(TEMPLATE_FOR[r.id]); }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className={styles.label}>3 · Copy, paste, send it yourself</div>
              <div className={styles.pills}>
                {templates.map((t) => (
                  <button key={t.id} type="button" className={clsx(styles.pill, tab === t.id && styles.pillOn)}
                    onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <pre className={styles.message}>{text}</pre>
              <div className={styles.msgFoot}>
                <span className={clsx(styles.count, over && styles.countOver)}>
                  {text.length}{current?.id === 'note' ? ` / ${NOTE_LIMIT}` : ''} chars
                  {over ? ' · too long for a connect note, trim it' : ''}
                </span>
                <Button variant="soft" size="sm" icon={copied ? Check : Copy} onClick={copy}>
                  {copied ? 'Copied' : 'Copy message'}
                </Button>
              </div>
            </section>

            <div className={styles.actions}>
              <Button variant="ghost" icon={SkipForward} onClick={next} disabled={busy}>Later</Button>
              <Button variant="ghost" icon={X} onClick={() => finish('skip')} disabled={busy}>Nobody to message</Button>
              <Button variant="primary" icon={Check} onClick={() => finish('sent')} loading={busy}>Sent, next</Button>
            </div>
          </div>
        </Card>
      )}
      </>}
    </div>
  );
}
