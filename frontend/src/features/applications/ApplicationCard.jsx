import { forwardRef } from 'react';
import { CalendarClock, FileText, MessageSquare, Users } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '../../components/ui/index.js';
import { WORK_MODE_LABELS } from '../../lib/constants.js';
import { daysUntil, formatDate, formatDueLabel, formatSalary } from '../../lib/format.js';
import styles from './ApplicationCard.module.css';

const PRIORITY_CLASS = { 3: styles.priorityHigh, 2: styles.priorityMedium, 1: styles.priorityLow };
const PRIORITY_TITLE = { 3: 'High priority', 2: 'Medium priority', 1: 'Low priority' };

/**
 * The board card. Kept presentational and ref-forwarding so dnd-kit can attach
 * to it and so the same markup can render inside a DragOverlay.
 */
export const ApplicationCard = forwardRef(function ApplicationCard(
  { application, dragging, overlay, className, onOpen, ...props }, ref,
) {
  const salary = formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency);
  const due = application.nextActionAt ? daysUntil(application.nextActionAt) : null;
  const { interviews, contacts, documents } = application.counts;

  return (
    <div
      ref={ref}
      className={clsx(styles.card, dragging && styles.dragging, overlay && styles.overlay, className)}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen(); } : undefined}
      {...props}
    >
      <div className={styles.head}>
        <Avatar name={application.company.name} size={30} />
        <div className={styles.headText}>
          <div className={styles.role}>{application.role}</div>
          <div className={styles.company}>{application.company.name}</div>
        </div>
        <span
          className={clsx(styles.priority, PRIORITY_CLASS[application.priority])}
          title={PRIORITY_TITLE[application.priority]}
        />
      </div>

      {(salary || application.workMode || application.location) && (
        <div className={styles.meta}>
          {salary && <span className={styles.tag}>{salary}</span>}
          {application.workMode && <span className={styles.tag}>{WORK_MODE_LABELS[application.workMode]}</span>}
          {application.location && !application.workMode && <span className={styles.tag}>{application.location}</span>}
        </div>
      )}

      {(application.nextActionAt || application.nextInterviewAt
        || interviews > 0 || contacts > 0 || documents > 0 || application.notes) && (
        <div className={styles.footer}>
          {application.nextInterviewAt ? (
            <span className={styles.due}>
              <CalendarClock size={12} aria-hidden />
              {formatDate(application.nextInterviewAt)}
            </span>
          ) : application.nextActionAt ? (
            <span className={clsx(styles.due, due < 0 && styles.dueOverdue, due === 0 && styles.dueSoon)}>
              <CalendarClock size={12} aria-hidden />
              {formatDueLabel(application.nextActionAt)}
            </span>
          ) : null}

          <span className={styles.counts}>
            {interviews > 0 && <span className={styles.count}><CalendarClock size={12} />{interviews}</span>}
            {contacts > 0 && <span className={styles.count}><Users size={12} />{contacts}</span>}
            {documents > 0 && <span className={styles.count}><FileText size={12} />{documents}</span>}
            {application.notes && <span className={styles.count}><MessageSquare size={12} /></span>}
          </span>
        </div>
      )}
    </div>
  );
});
