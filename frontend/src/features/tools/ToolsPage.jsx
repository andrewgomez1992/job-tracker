import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bookmark, Copy, Download, FileSpreadsheet, FileText, HardDriveDownload } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApplications, useContacts } from '../../api/queries.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { DEFAULT_RESUME, RESUME_KEY } from '../../lib/resume.js';
import { Button, Card, CardBody, CardHeader, Input, useToast } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { bookmarkletHref } from './bookmarklet.js';
import styles from './Tools.module.css';

const ymd = (d) => d.toLocaleDateString('en-CA');
const localDay = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : ymd(new Date(iso)));

/** EDD weeks run Sunday to Saturday. */
const eddWeek = (offset = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: ymd(start), to: ymd(end) };
};

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const RESULTS = {
  applied: 'Application submitted, waiting to hear back',
  screening: 'Recruiter screen scheduled',
  interviewing: 'Interviewing',
  offer: 'Offer received',
  accepted: 'Offer accepted',
  rejected: 'Not selected',
  withdrawn: 'I withdrew',
};

function Bookmarklet() {
  const ref = useRef(null);
  const toast = useToast();
  const href = useMemo(() => bookmarkletHref(window.location.origin), []);
  // React refuses javascript: URLs in JSX, so set it on the element directly.
  useEffect(() => { ref.current?.setAttribute('href', href); }, [href]);
  return (
    <Card>
      <CardHeader title="Save jobs from any site" subtitle="One click on LinkedIn, Indeed, Greenhouse, Lever and more" />
      <CardBody>
        <ol className={styles.steps}>
          <li>Show your bookmarks bar (<kbd>⌘</kbd> <kbd>Shift</kbd> <kbd>B</kbd> in Chrome).</li>
          <li>Drag this button onto it:
            <div className={styles.bmRow}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a ref={ref} className={styles.bookmarklet} onClick={(e) => e.preventDefault()} draggable>
                <Bookmark size={14} /> Save to Trail
              </a>
              <Button size="sm" icon={Copy} onClick={async () => {
                try { await navigator.clipboard.writeText(decodeURIComponent(href)); toast.success('Copied', 'Paste it as the URL of a new bookmark.'); } catch { /* ignore */ }
              }}>Copy code instead</Button>
            </div>
          </li>
          <li>On any job posting, click it. Trail opens with the role, company, link and description filled in.
            Highlight part of the page first to save just that part as the description.</li>
        </ol>
      </CardBody>
    </Card>
  );
}

function WorkSearchLog() {
  const [range, setRange] = useState(eddWeek(0));
  const { data: apps = [] } = useApplications({ archived: 'all', limit: 5000, sort: 'applied', direction: 'asc' });
  const { data: contacts = [] } = useContacts();
  const rows = useMemo(() => apps
    .filter((a) => a.appliedAt && localDay(a.appliedAt) >= range.from && localDay(a.appliedAt) <= range.to)
    .map((a) => {
      const person = contacts.find((c) => c.applicationId === a.id);
      return {
        date: localDay(a.appliedAt),
        employer: a.company.name,
        contact: person ? `${person.name}${person.title ? `, ${person.title}` : ''}` : '',
        method: a.source === 'Referral' ? 'Referral / online application' : 'Online application',
        where: a.jobUrl || a.company.website || a.source || '',
        position: a.role,
        result: RESULTS[a.status] ?? a.status,
      };
    }), [apps, contacts, range]);

  const exportCsv = () => {
    const head = ['Date', 'Employer', 'Person contacted', 'Method', 'Website / address', 'Type of work', 'Results'];
    const body = rows.map((r) => [r.date, r.employer, r.contact, r.method, r.where, r.position, r.result].map(csvCell).join(','));
    download(`work-search-${range.from}-to-${range.to}.csv`, [head.join(','), ...body].join('\n'), 'text/csv');
  };

  return (
    <Card>
      <CardHeader title="Work search log" subtitle="The weekly job-search record California unemployment (EDD) asks for" />
      <CardBody>
        <div className={styles.range}>
          <Input label="From" type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          <Input label="To" type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          <div className={styles.quick}>
            <Button size="sm" onClick={() => setRange(eddWeek(0))}>This week</Button>
            <Button size="sm" onClick={() => setRange(eddWeek(-1))}>Last week</Button>
          </div>
        </div>
        <div className={styles.logSummary}>
          <b>{rows.length}</b> {rows.length === 1 ? 'employer contact' : 'employer contacts'} in this range
        </div>
        {rows.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Date</th><th>Employer</th><th>Position</th><th>Result</th></tr></thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}><td>{r.date}</td><td>{r.employer}</td><td>{r.position}</td><td>{r.result}</td></tr>
                ))}
              </tbody>
            </table>
            {rows.length > 8 && <div className={styles.more}>+ {rows.length - 8} more in the download</div>}
          </div>
        )}
        <div className={styles.actions}>
          <Button variant="primary" icon={FileSpreadsheet} onClick={exportCsv} disabled={!rows.length}>Download CSV</Button>
        </div>
        <p className={styles.note}>Keep these records yourself. EDD can ask for them, so download one every week you certify.</p>
      </CardBody>
    </Card>
  );
}

function Backup() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const [applications, contacts, interviews, documents, stories] = await Promise.all([
        api.get('/applications', { params: { archived: 'all', limit: 5000 } }),
        api.get('/contacts'), api.get('/interviews'), api.get('/documents'), api.get('/stories'),
      ]);
      const data = { exportedAt: new Date().toISOString(), applications, contacts, interviews, documents, stories };
      download(`trail-backup-${ymd(new Date())}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast.success('Backup downloaded', `${applications.length} applications`);
    } catch (error) { toast.error('Backup failed', error.message); } finally { setBusy(false); }
  };
  return (
    <Card>
      <CardHeader title="Backup" subtitle="Everything in one file, in case your laptop dies" />
      <CardBody>
        <Button icon={HardDriveDownload} loading={busy} onClick={run}>Download backup (JSON)</Button>
      </CardBody>
    </Card>
  );
}

function ResumeText() {
  const [resume, setResume] = useLocalStorage(RESUME_KEY, DEFAULT_RESUME);
  return (
    <Card>
      <CardHeader title="Your resume" subtitle="Plain text. Resume match on each job compares against this." />
      <CardBody>
        <textarea id="resume-text" className={styles.resume} value={resume} onChange={(e) => setResume(e.target.value)} rows={14} />
        <div className={styles.actions}>
          <Button size="sm" icon={FileText} onClick={() => setResume(DEFAULT_RESUME)}>Reset to default</Button>
          <Button size="sm" icon={Download} onClick={() => download('resume.txt', resume, 'text/plain')}>Download .txt</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function ToolsPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  return (
    <div className={styles.page}>
      <PageHeader title="Tools" subtitle="Capture jobs faster, keep your unemployment records, and back everything up." />
      <div className={styles.grid}>
        <Bookmarklet />
        <WorkSearchLog />
        <div id="resume"><ResumeText /></div>
        <Backup />
      </div>
    </div>
  );
}
