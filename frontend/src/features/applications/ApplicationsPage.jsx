import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight, Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { useApplications } from '../../api/queries.js';
import { BOARD_COLUMNS, STATUS_META, STATUS_ORDER } from '../../lib/constants.js';
import { daysUntil, formatDate, formatDueLabel, formatSalary } from '../../lib/format.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useIsMobile } from '../../hooks/useMediaQuery.js';
import {
  Avatar, Button, Card, EmptyState, SkeletonStack, StatusBadge,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ApplicationFormModal } from './ApplicationFormModal.jsx';
import styles from './ApplicationsPage.module.css';

const SORTS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Recently added' },
  { value: 'applied', label: 'Date applied' },
  { value: 'next_action', label: 'Next follow-up' },
  { value: 'company', label: 'Company A–Z' },
  { value: 'priority', label: 'Priority' },
];

export function ApplicationsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [sort, setSort] = useState('updated');
  const [archived, setArchived] = useState('false');
  const [addOpen, setAddOpen] = useState(false);

  const debounced = useDebouncedValue(search.trim(), 250);

  const filters = useMemo(() => ({
    search: debounced || undefined,
    status: status || undefined,
    sort,
    direction: sort === 'company' || sort === 'next_action' ? 'asc' : 'desc',
    archived,
  }), [debounced, status, sort, archived]);

  const { data: applications = [], isLoading } = useApplications(filters);
  const { data: all = [] } = useApplications({ archived: 'false', limit: 500 });

  const counts = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
    for (const application of all) map[application.status] += 1;
    return map;
  }, [all]);

  const visibleChips = useMemo(() => {
    const closed = STATUS_ORDER.filter((s) => !BOARD_COLUMNS.includes(s) && counts[s] > 0);
    return [...BOARD_COLUMNS, ...closed];
  }, [counts]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Applications"
        subtitle="Every role you are tracking, in one list."
        actions={<Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Add</Button>}
      />

      <div className={styles.filters}>
        <div className={styles.search}>
          <Search size={15} className={styles.searchIcon} aria-hidden />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, location or notes…"
            aria-label="Search applications"
          />
        </div>
        <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select className={styles.select} value={archived} onChange={(e) => setArchived(e.target.value)} aria-label="Archive filter">
          <option value="false">Active only</option>
          <option value="true">Archived only</option>
          <option value="all">Everything</option>
        </select>
      </div>

      <div className={styles.chipRow}>
        <button
          type="button"
          className={clsx(styles.chip, !status && styles.chipActive)}
          style={!status ? { '--chip-bg': 'var(--accent-soft)', '--chip-fg': 'var(--accent)' } : undefined}
          onClick={() => setStatus(null)}
        >
          All <span className={styles.chipCount}>{all.length}</span>
        </button>
        {visibleChips.map((value) => (
          <button
            key={value}
            type="button"
            className={clsx(styles.chip, status === value && styles.chipActive)}
            style={status === value
              ? { '--chip-bg': `var(--status-${value}-soft)`, '--chip-fg': `var(--status-${value})` }
              : undefined}
            onClick={() => setStatus(status === value ? null : value)}
          >
            <span className={styles.chipDot} style={{ background: `var(--status-${value})` }} />
            {STATUS_META[value].label}
            <span className={styles.chipCount}>{counts[value] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonStack rows={5} height={56} />
      ) : applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title={debounced || status ? 'Nothing matches those filters' : 'No applications yet'}
            description={debounced || status
              ? 'Try clearing the search or picking a different stage.'
              : 'Add the first role you are chasing and the pipeline builds itself from there.'}
            action={!debounced && !status && (
              <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Add application</Button>
            )}
          />
        </Card>
      ) : isMobile ? (
        <div className={styles.mobileList}>
          {applications.map((application) => (
            <Card
              key={application.id}
              as="button"
              interactive
              className={styles.mobileCard}
              onClick={() => navigate(`/applications/${application.id}`)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <div className={styles.mobileTop}>
                <Avatar name={application.company.name} size={34} />
                <div className={styles.mobileText}>
                  <div className={styles.cellStrong}>{application.role}</div>
                  <div className={styles.cellMuted}>{application.company.name}</div>
                </div>
                <ChevronRight size={16} color="var(--text-subtle)" />
              </div>
              <div className={styles.mobileMeta}>
                <StatusBadge status={application.status} size="sm" />
                {application.nextActionAt && (
                  <span className={clsx(styles.cellMuted, daysUntil(application.nextActionAt) < 0 && styles.overdue)}>
                    {formatDueLabel(application.nextActionAt)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className={styles.headRow}>
            <span />
            <span>Role</span>
            <span>Company</span>
            <span>Stage</span>
            <span>Salary</span>
            <span className={styles.cellRight}>Next up</span>
            <span />
          </div>
          <div className={styles.table}>
            {applications.map((application) => {
              const due = application.nextActionAt ? daysUntil(application.nextActionAt) : null;
              return (
                <button
                  key={application.id}
                  type="button"
                  className={styles.row}
                  onClick={() => navigate(`/applications/${application.id}`)}
                >
                  <Avatar name={application.company.name} size={30} />
                  <span className={styles.cellStrong}>{application.role}</span>
                  <span className={styles.cellMuted}>{application.company.name}</span>
                  <span><StatusBadge status={application.status} size="sm" /></span>
                  <span className={styles.cellMuted}>
                    {formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency) ?? '—'}
                  </span>
                  <span className={clsx(styles.cellMuted, styles.cellRight, due != null && due < 0 && styles.overdue)}>
                    {application.nextActionAt
                      ? formatDueLabel(application.nextActionAt)
                      : application.appliedAt ? formatDate(application.appliedAt) : '—'}
                  </span>
                  <ChevronRight size={15} color="var(--text-subtle)" />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className={styles.summary}>
        {applications.length} shown{status ? ` in ${STATUS_META[status].label}` : ''}
      </div>

      <ApplicationFormModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
