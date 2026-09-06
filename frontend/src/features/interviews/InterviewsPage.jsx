import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { interviewMutations, useInterviews } from '../../api/queries.js';
import { INTERVIEW_FORMAT_LABELS, INTERVIEW_OUTCOME_LABELS } from '../../lib/constants.js';
import { formatDateTime } from '../../lib/format.js';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SkeletonStack, Tabs, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { InterviewFormModal } from './InterviewFormModal.jsx';
import styles from './InterviewsPage.module.css';

const OUTCOME_TONE = {
  scheduled: 'applied', completed: 'saved', passed: 'accepted',
  failed: 'rejected', cancelled: 'withdrawn', no_show: 'withdrawn',
};

export function InterviewsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: interviews = [], isLoading } = useInterviews({ limit: 200 });
  const remove = interviewMutations.useDelete();

  const [view, setView] = useState('upcoming');
  const [modal, setModal] = useState({ open: false, interview: null });
  const [confirm, setConfirm] = useState(null);

  const { upcoming, past } = useMemo(() => {
    const withDate = [...interviews].sort((a, b) => {
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    });
    return {
      upcoming: withDate.filter(
        (i) => i.outcome === 'scheduled' && (!i.scheduledAt || !isPast(parseISO(i.scheduledAt))),
      ),
      past: withDate
        .filter((i) => i.outcome !== 'scheduled' || (i.scheduledAt && isPast(parseISO(i.scheduledAt))))
        .reverse(),
    };
  }, [interviews]);

  const list = view === 'upcoming' ? upcoming : past;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Interviews"
        subtitle="Every round, with the prep notes attached."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, interview: null })}>
            Add round
          </Button>
        }
      />

      <Tabs
        value={view}
        onChange={setView}
        items={[
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'past', label: 'Past', count: past.length },
        ]}
      />

      {isLoading ? (
        <SkeletonStack rows={3} height={92} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title={view === 'upcoming' ? 'Nothing booked' : 'No past rounds'}
            description={view === 'upcoming'
              ? 'When an interview gets scheduled, add it here with what you want to review beforehand.'
              : 'Completed rounds show up here with how they went.'}
            action={view === 'upcoming' && (
              <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, interview: null })}>
                Add a round
              </Button>
            )}
          />
        </Card>
      ) : (
        <div className={styles.group}>
          {list.map((interview) => {
            const date = interview.scheduledAt ? parseISO(interview.scheduledAt) : null;
            return (
              <Card key={interview.id} className={styles.card}>
                <div className={styles.when}>
                  {date ? (
                    <>
                      <span className={styles.whenMonth}>{format(date, 'MMM')}</span>
                      <span className={styles.whenDay}>{format(date, 'd')}</span>
                      <span className={styles.whenTime}>{format(date, 'h:mm a')}</span>
                    </>
                  ) : (
                    <span className={styles.whenMonth}>TBD</span>
                  )}
                </div>

                <div className={styles.body}>
                  <div className={styles.stage}>{interview.stage}</div>
                  <button
                    type="button"
                    className={styles.meta}
                    onClick={() => navigate(`/applications/${interview.applicationId}`)}
                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {interview.companyName} · {interview.applicationRole}
                  </button>
                  <div className={styles.badges}>
                    <Badge tone={OUTCOME_TONE[interview.outcome]} size="sm">
                      {INTERVIEW_OUTCOME_LABELS[interview.outcome]}
                    </Badge>
                    {interview.format && <Badge size="sm">{INTERVIEW_FORMAT_LABELS[interview.format]}</Badge>}
                    {interview.durationMinutes && <Badge size="sm">{interview.durationMinutes} min</Badge>}
                    {interview.interviewers && <Badge size="sm">{interview.interviewers}</Badge>}
                  </div>
                  {interview.prepNotes && <div className={styles.notes}>{interview.prepNotes}</div>}
                  {interview.notes && <div className={styles.notes}>{interview.notes}</div>}
                  {interview.location && /^https?:/.test(interview.location) && (
                    <a className={styles.link} href={interview.location} target="_blank" rel="noreferrer">
                      Join <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className={styles.actions}>
                  <IconButton label="Edit" icon={Pencil} size="sm" onClick={() => setModal({ open: true, interview })} />
                  <IconButton label="Delete" icon={Trash2} size="sm" onClick={() => setConfirm(interview)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InterviewFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, interview: null })}
        interview={modal.interview}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await remove.mutateAsync(confirm.id);
          toast.success('Round removed');
          setConfirm(null);
        }}
        loading={remove.isPending}
        title={`Delete “${confirm?.stage}”?`}
        description="The round and its notes are removed. The application stays."
      />
    </div>
  );
}
