import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlarmClock, Briefcase, CalendarClock, CheckCircle2, ChevronRight, Clock,
  Check, FileText, MessageSquare, Plus, Send, Sparkles, TrendingUp, UserPlus,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useActivities, useAnalytics, useReminders, useUpdateApplication } from '../../api/queries.js';
import { ACTIVITY_META } from '../../lib/constants.js';
import { formatDate, formatDateTime, formatDueLabel, formatRelative, pluralize } from '../../lib/format.js';
import {
  Avatar, Badge, Card, CardHeader, EmptyState, SkeletonStack, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from './StatCard.jsx';
import { HypeBanner } from '../hype/HypeBanner.jsx';
import { GoalCard } from './GoalCard.jsx';
import styles from './Dashboard.module.css';

const ACTIVITY_ICONS = {
  created: Plus,
  status_change: TrendingUp,
  note: MessageSquare,
  reminder_set: AlarmClock,
  contact_added: UserPlus,
  interview_scheduled: CalendarClock,
  interview_outcome: CheckCircle2,
  document_added: FileText,
  archived: Briefcase,
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

function ApplicationRow({ application, right, onClick }) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <Avatar name={application.company.name} size={32} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{application.role}</span>
        <span className={styles.rowMeta}>
          {application.company.name}
          {application.nextAction ? ` · ${application.nextAction}` : ''}
        </span>
      </span>
      <span className={styles.rowRight}>{right}</span>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: reminders, isLoading: remindersLoading } = useReminders();
  const { data: analytics } = useAnalytics(12);
  const { data: activities = [] } = useActivities(12);
  const update = useUpdateApplication();
  const toast = useToast();
  const markDone = async (application) => {
    try {
      const next = await update.mutateAsync({ id: application.id, nextAction: null, nextActionAt: null });
      toast.success(`Done: ${application.company.name}`, next?.nextActionAt ? `Next up: ${next.nextAction}` : undefined);
    } catch (error) { toast.error('Could not update', error.message); }
  };

  const needsYou = useMemo(
    () => [...(reminders?.overdue ?? []), ...(reminders?.today ?? [])],
    [reminders],
  );

  const appliedThisWeek = analytics?.weekly?.at(-1)?.count ?? 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={
          <span className={styles.greeting}>
            {greeting()}
            <span className={styles.date}>{format(new Date(), 'EEEE d MMMM')}</span>
          </span>
        }
        subtitle={
          needsYou.length > 0
            ? `${pluralize(needsYou.length, 'follow-up')} waiting on you.`
            : 'Nothing overdue. Nice place to be.'
        }
      />

      <HypeBanner />

      <GoalCard />

      <div className={styles.stats}>
        <StatCard icon={Briefcase} label="Active" value={analytics?.totals.active ?? '—'} hint="in the pipeline" />
        <StatCard icon={Send} label="Applied this week" value={appliedThisWeek} hint={`${analytics?.totals.applied ?? 0} all time`} />
        <StatCard
          icon={CalendarClock} label="Interviews" value={reminders?.counts.interviews ?? '—'}
          hint="coming up" tone={reminders?.counts.interviews ? 'accent' : undefined}
        />
        <StatCard
          icon={TrendingUp} label="Response rate"
          value={analytics ? `${analytics.rates.response}%` : '—'}
          hint={analytics?.avgResponseDays ? `~${analytics.avgResponseDays} days to reply` : 'no replies yet'}
        />
      </div>

      <div className={styles.columns}>
        <div className={styles.stack}>
          <Card>
            <CardHeader
              title="Needs you"
              subtitle={needsYou.length ? 'Overdue and due today' : undefined}
              actions={needsYou.length > 0 && <Badge tone="rejected">{needsYou.length}</Badge>}
            />
            {remindersLoading ? (
              <div style={{ padding: 'var(--space-5)' }}><SkeletonStack rows={2} height={44} /></div>
            ) : needsYou.length === 0 ? (
              <EmptyState
                compact icon={Sparkles} title="You're all caught up"
                description="Set a follow-up date on an application and it will show up here."
              />
            ) : (
              <div className={styles.list}>
                {needsYou.map((application) => {
                  const overdue = new Date(application.nextActionAt) < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <div key={application.id} className={styles.rowWrap}>
                      <ApplicationRow
                        application={application}
                        onClick={() => navigate(`/applications/${application.id}`)}
                        right={
                          <span className={clsx(styles.rowMeta, overdue ? styles.overdue : styles.soon)}>
                            {formatDueLabel(application.nextActionAt)}
                          </span>
                        }
                      />
                      <button type="button" className={styles.doneBtn} onClick={() => markDone(application)}
                        aria-label={`Mark ${application.company.name} follow-up done`} title="Done">
                        <Check size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Upcoming interviews" subtitle="Next 20 scheduled rounds" />
            {(reminders?.upcomingInterviews.length ?? 0) === 0 ? (
              <EmptyState
                compact icon={CalendarClock} title="No interviews booked"
                description="Add one from an application and it will appear here with its prep notes."
              />
            ) : (
              <div className={styles.list}>
                {reminders.upcomingInterviews.map((interview) => (
                  <button
                    key={interview.id}
                    type="button"
                    className={styles.row}
                    onClick={() => navigate(`/applications/${interview.applicationId}?tab=interviews`)}
                  >
                    <Avatar name={interview.companyName} size={32} />
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{interview.stage}</span>
                      <span className={styles.rowMeta}>
                        {interview.companyName} · {interview.applicationRole}
                      </span>
                    </span>
                    <span className={styles.rowRight}>
                      <span className={styles.rowMeta}>{formatDateTime(interview.scheduledAt)}</span>
                      <ChevronRight size={15} color="var(--text-subtle)" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {(reminders?.stale.length ?? 0) > 0 && (
            <Card>
              <CardHeader
                title="Going quiet"
                subtitle="Applied a while ago, still no reply — worth a nudge"
                actions={<Badge tone="offer">{reminders.stale.length}</Badge>}
              />
              <div className={styles.list}>
                {reminders.stale.slice(0, 6).map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    onClick={() => navigate(`/applications/${application.id}`)}
                    right={
                      <>
                        <span className={styles.rowMeta}>
                          <Clock size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                          applied {formatRelative(application.appliedAt)}
                        </span>
                        <ChevronRight size={15} color="var(--text-subtle)" />
                      </>
                    }
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Recent activity" subtitle="Everything you have logged" />
          {activities.length === 0 ? (
            <EmptyState compact icon={Activity} title="Nothing logged yet" description="Add your first application to start the trail." />
          ) : (
            <div className={styles.timeline}>
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? Activity;
                return (
                  <div key={activity.id} className={styles.event}>
                    <div className={styles.eventDot}><Icon size={13} strokeWidth={2} /></div>
                    <div className={styles.eventBody}>
                      <div className={styles.eventTitle}>
                        <span className={styles.eventStrong}>
                          {ACTIVITY_META[activity.type]?.label ?? activity.type}
                        </span>
                        {' — '}
                        {activity.message}
                      </div>
                      <div className={styles.eventMeta}>
                        {activity.application
                          ? `${activity.application.companyName} · ${formatDate(activity.occurredAt)}`
                          : formatDate(activity.occurredAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

