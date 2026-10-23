import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity, AlarmClock, Archive, ArchiveRestore, Briefcase, CalendarClock,
  Check, CheckCircle2, ExternalLink, FileText, Mail, MessageSquare, Pencil, Phone,
  Plus, Trash2, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import clsx from 'clsx';
import {
  contactMutations, documentMutations, interviewMutations, useAddNote, useApplication,
  useContacts, useDeleteApplication, useDocuments, useInterviews, useTimeline, useUpdateApplication,
} from '../../api/queries.js';
import {
  ACTIVITY_META, DOCUMENT_KIND_LABELS, EMPLOYMENT_TYPE_LABELS, INTERVIEW_FORMAT_LABELS,
  INTERVIEW_OUTCOME_LABELS, PRIORITY_META, RELATIONSHIP_LABELS, STATUS_META, STATUS_ORDER,
  WORK_MODE_LABELS,
} from '../../lib/constants.js';
import {
  daysUntil, formatDate, formatDateTime, formatDueLabel, formatSalary, fromInputValue,
  toLocalInputValue,
} from '../../lib/format.js';
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, IconButton,
  Input, Modal, Spinner, StatusBadge, Tabs, Textarea, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ApplicationFormModal } from './ApplicationFormModal.jsx';
import { InterviewFormModal } from '../interviews/InterviewFormModal.jsx';
import { ContactFormModal } from '../contacts/ContactFormModal.jsx';
import { DocumentFormModal } from '../documents/DocumentFormModal.jsx';
import styles from './ApplicationDetail.module.css';
import { JobSummary } from './JobSummary.jsx';
import { Outreach } from './Outreach.jsx';
import { InterviewPrep } from './InterviewPrep.jsx';
import { ResumeMatch } from './ResumeMatch.jsx';

const ACTIVITY_ICONS = {
  created: Plus, status_change: TrendingUp, note: MessageSquare, reminder_set: AlarmClock,
  contact_added: UserPlus, interview_scheduled: CalendarClock, interview_outcome: CheckCircle2,
  document_added: FileText, archived: Archive,
};

const OUTCOME_TONE = {
  scheduled: 'applied', completed: 'saved', passed: 'accepted',
  failed: 'rejected', cancelled: 'withdrawn', no_show: 'withdrawn',
};

function Fact({ label, children, muted }) {
  return (
    <div className={styles.fact}>
      <div className={styles.factLabel}>{label}</div>
      <div className={clsx(styles.factValue, muted && styles.factMuted)}>{children ?? '—'}</div>
    </div>
  );
}

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: application, isLoading, isError } = useApplication(id);
  const { data: timeline = [] } = useTimeline(id);
  const { data: interviews = [] } = useInterviews({ applicationId: id });
  const { data: contacts = [] } = useContacts({ applicationId: id });
  const { data: documents = [] } = useDocuments({ applicationId: id });

  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const addNote = useAddNote();
  const deleteInterview = interviewMutations.useDelete();
  const deleteContact = contactMutations.useDelete();
  const deleteDocument = documentMutations.useDelete();

  const tab = searchParams.get('tab') ?? 'overview';
  const setTab = (value) => setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true });

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState('');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({ nextAction: '', nextActionAt: '' });
  const [interviewModal, setInterviewModal] = useState({ open: false, interview: null });
  const [contactModal, setContactModal] = useState({ open: false, contact: null });
  const [documentModal, setDocumentModal] = useState({ open: false, document: null });
  const [showFullDescription, setShowFullDescription] = useState(false);

  const tabs = useMemo(() => [
    { value: 'overview', label: 'Overview' },
    { value: 'timeline', label: 'Timeline', count: timeline.length },
    { value: 'interviews', label: 'Interviews', count: interviews.length },
    { value: 'contacts', label: 'Contacts', count: contacts.length },
    { value: 'documents', label: 'Documents', count: documents.length },
  ], [timeline.length, interviews.length, contacts.length, documents.length]);

  if (isLoading) return <Spinner center size={26} />;
  if (isError || !application) {
    return (
      <EmptyState
        icon={Briefcase}
        title="That application is gone"
        description="It may have been deleted."
        action={<Button variant="primary" onClick={() => navigate('/applications')}>Back to applications</Button>}
      />
    );
  }

  const due = application.nextActionAt ? daysUntil(application.nextActionAt) : null;

  const changeStatus = async (status) => {
    try {
      await update.mutateAsync({ id: application.id, status });
      toast.success(`Moved to ${STATUS_META[status].label}`);
    } catch (error) { toast.error('Could not update', error.message); }
  };

  const toggleArchive = async () => {
    try {
      await update.mutateAsync({ id: application.id, archived: !application.archived });
      toast.success(application.archived ? 'Restored' : 'Archived');
    } catch (error) { toast.error('Could not update', error.message); }
  };

  const saveReminder = async () => {
    try {
      await update.mutateAsync({
        id: application.id,
        nextAction: reminderForm.nextAction || null,
        nextActionAt: fromInputValue(reminderForm.nextActionAt),
      });
      setReminderOpen(false);
      toast.success('Follow-up saved');
    } catch (error) { toast.error('Could not save', error.message); }
  };

  const markReminderDone = async () => {
    try {
      const next = await update.mutateAsync({ id: application.id, nextAction: null, nextActionAt: null });
      toast.success('Done', next?.nextActionAt ? `Next up: ${next.nextAction} (${formatDueLabel(next.nextActionAt)})` : undefined);
    } catch (error) { toast.error('Could not update', error.message); }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote.mutateAsync({ applicationId: application.id, message: note.trim() });
      setNote('');
    } catch (error) { toast.error('Could not add note', error.message); }
  };

  const confirmRemove = async () => {
    try {
      await remove.mutateAsync(application.id);
      toast.success('Application deleted');
      navigate('/applications');
    } catch (error) { toast.error('Could not delete', error.message); }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        onBack={() => navigate(-1)}
        backLabel="Back"
        title={
          <span className={styles.hero}>
            <Avatar name={application.company.name} size={46} />
            <span className={styles.heroText}>
              <span className={styles.role}>{application.role}</span>
              <span className={styles.company}>
                {application.company.website ? (
                  <a
                    className={styles.companyLink}
                    href={application.company.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {application.company.name} <ExternalLink size={12} />
                  </a>
                ) : application.company.name}
                {application.archived && <Badge variant="outline">Archived</Badge>}
              </span>
            </span>
          </span>
        }
        actions={
          <div className={styles.heroActions}>
            <select
              className={styles.statusPicker}
              value={application.status}
              onChange={(event) => changeStatus(event.target.value)}
              aria-label="Stage"
              style={{
                '--status-bg': `var(--status-${application.status}-soft)`,
                '--status-fg': `var(--status-${application.status})`,
              }}
            >
              {STATUS_ORDER.map((value) => (
                <option key={value} value={value}>{STATUS_META[value].label}</option>
              ))}
            </select>
            <Button icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
            <IconButton
              label={application.archived ? 'Restore' : 'Archive'}
              icon={application.archived ? ArchiveRestore : Archive}
              onClick={toggleArchive}
            />
            <IconButton label="Delete" icon={Trash2} onClick={() => setConfirmDelete(true)} />
          </div>
        }
      />

      <div className={styles.tabsRow}>
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && (
        <>
          <div className={styles.facts}>
            <Fact label="Stage"><StatusBadge status={application.status} /></Fact>
            <Fact label="Priority">{PRIORITY_META[application.priority].label}</Fact>
            <Fact label="Applied" muted={!application.appliedAt}>
              {application.appliedAt ? formatDate(application.appliedAt) : 'Not yet'}
            </Fact>
            <Fact label="Source" muted={!application.source}>{application.source}</Fact>
            <Fact label="Location" muted={!application.location && !application.workMode}>
              {[application.location, WORK_MODE_LABELS[application.workMode]].filter(Boolean).join(' · ') || null}
            </Fact>
            <Fact label="Salary" muted={!application.salaryMin && !application.salaryMax}>
              {formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency)}
            </Fact>
            <Fact label="Type" muted={!application.employmentType}>
              {EMPLOYMENT_TYPE_LABELS[application.employmentType]}
            </Fact>
            {application.jobUrl && (
              <Fact label="Posting">
                <a className={styles.link} href={application.jobUrl} target="_blank" rel="noreferrer">
                  Open <ExternalLink size={12} />
                </a>
              </Fact>
            )}
          </div>

          <div className={styles.grid}>
            <div className={styles.stack}>
              {application.summary && (
                <Card>
                  <CardHeader title="Job summary" subtitle="What you need to know" />
                  <CardBody>
                    <JobSummary text={application.summary} />
                  </CardBody>
                </Card>
              )}

              {(application.jobDescription || application.summary) && (
                <Card>
                  <CardHeader title="Resume match" subtitle="How your resume lines up with this posting" />
                  <CardBody>
                    <ResumeMatch application={application} />
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader title="Get a referral" subtitle={`Find people at ${application.company.name} and what to send them`} />
                <CardBody>
                  <Outreach application={application} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Interview prep" subtitle="Likely questions, matched to your stories" />
                <CardBody>
                  <InterviewPrep application={application} />
                </CardBody>
              </Card>

              {application.jobDescription && (
                <Card>
                  <CardHeader
                    title="Job description"
                    subtitle="Saved from the posting"
                    actions={
                      <Button size="sm" variant="ghost" onClick={() => setShowFullDescription((v) => !v)}>
                        {showFullDescription ? 'Collapse' : 'Expand'}
                      </Button>
                    }
                  />
                  <CardBody>
                    <div className={clsx(styles.prose, showFullDescription && styles.proseFull)}>
                      {application.jobDescription}
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader title="Notes" />
                <CardBody>
                  {application.notes
                    ? <div className={styles.prose}>{application.notes}</div>
                    : <EmptyState compact icon={MessageSquare} title="No notes yet"
                        description="Use Edit to jot down why this one matters." />}
                </CardBody>
              </Card>
            </div>

            <div className={styles.stack}>
              <Card>
                <CardHeader
                  title="Follow-up"
                  actions={
                    <>
                    {application.nextActionAt && (
                      <Button size="sm" variant="primary" icon={Check} onClick={markReminderDone}>Done</Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setReminderForm({
                          nextAction: application.nextAction ?? '',
                          nextActionAt: toLocalInputValue(application.nextActionAt),
                        });
                        setReminderOpen(true);
                      }}
                    >
                      {application.nextActionAt ? 'Change' : 'Set'}
                    </Button>
                    </>
                  }
                />
                <CardBody>
                  {application.nextActionAt ? (
                    <div className={styles.reminder}>
                      <div className={clsx(styles.reminderDue, due < 0 && styles.overdue, due === 0 && styles.soon)}>
                        <AlarmClock size={15} />
                        {formatDueLabel(application.nextActionAt)}
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>{application.nextAction || 'Follow up'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {formatDateTime(application.nextActionAt)}
                      </div>
                    </div>
                  ) : (
                    <EmptyState compact icon={AlarmClock} title="No follow-up set"
                      description="Give yourself a date and it shows up on Today." />
                  )}
                </CardBody>
              </Card>

              {interviews.filter((i) => i.outcome === 'scheduled' && i.scheduledAt).length > 0 && (
                <Card>
                  <CardHeader title="Next interview" />
                  <CardBody>
                    {interviews
                      .filter((i) => i.outcome === 'scheduled' && i.scheduledAt)
                      .slice(0, 1)
                      .map((interview) => (
                        <div key={interview.id} className={styles.reminder}>
                          <div className={styles.reminderDue}>
                            <CalendarClock size={15} /> {formatDateTime(interview.scheduledAt)}
                          </div>
                          <div style={{ fontSize: '0.875rem' }}>{interview.stage}</div>
                          {interview.interviewers && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              with {interview.interviewers}
                            </div>
                          )}
                        </div>
                      ))}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'timeline' && (
        <Card>
          <CardHeader title="Everything that happened" subtitle="Logged automatically as you work" />
          <div className={styles.timeline}>
            {timeline.length === 0 ? (
              <EmptyState compact icon={Activity} title="Nothing here yet" />
            ) : timeline.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] ?? Activity;
              return (
                <div key={activity.id} className={styles.event}>
                  <div className={styles.eventDot}><Icon size={13} strokeWidth={2} /></div>
                  <div className={styles.eventBody}>
                    <div className={styles.eventTitle}>{activity.message}</div>
                    <div className={styles.eventMeta}>
                      {ACTIVITY_META[activity.type]?.label ?? activity.type} · {formatDateTime(activity.occurredAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.composer}>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note — what you heard, what you sent…"
              rows={2}
            />
            <div className={styles.composerRow}>
              <Button variant="primary" size="sm" onClick={submitNote} loading={addNote.isPending} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'interviews' && (
        <Card>
          <CardHeader
            title="Interview rounds"
            subtitle="Dates, who you met and how it went"
            actions={
              <Button size="sm" icon={Plus} onClick={() => setInterviewModal({ open: true, interview: null })}>
                Add round
              </Button>
            }
          />
          {interviews.length === 0 ? (
            <EmptyState compact icon={CalendarClock} title="No rounds logged"
              description="Add each stage as it gets booked so nothing sneaks up on you." />
          ) : (
            <div className={styles.itemList}>
              {interviews.map((interview) => (
                <div key={interview.id} className={styles.item}>
                  <div className={styles.itemText}>
                    <div className={styles.itemTitle}>{interview.stage}</div>
                    <div className={styles.itemMeta}>
                      {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : 'No date yet'}
                      {interview.durationMinutes ? ` · ${interview.durationMinutes} min` : ''}
                      {interview.interviewers ? ` · ${interview.interviewers}` : ''}
                    </div>
                    <div className={styles.itemBadges}>
                      <Badge tone={OUTCOME_TONE[interview.outcome]} size="sm">
                        {INTERVIEW_OUTCOME_LABELS[interview.outcome]}
                      </Badge>
                      {interview.format && <Badge size="sm">{INTERVIEW_FORMAT_LABELS[interview.format]}</Badge>}
                    </div>
                    {interview.prepNotes && <div className={styles.itemNotes}>{interview.prepNotes}</div>}
                    {interview.notes && <div className={styles.itemNotes}>{interview.notes}</div>}
                    {interview.location && /^https?:/.test(interview.location) && (
                      <a className={styles.link} href={interview.location} target="_blank" rel="noreferrer">
                        Join <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className={styles.itemActions}>
                    <IconButton label="Edit" icon={Pencil} size="sm"
                      onClick={() => setInterviewModal({ open: true, interview })} />
                    <IconButton label="Delete" icon={Trash2} size="sm"
                      onClick={() => deleteInterview.mutate(interview.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'contacts' && (
        <Card>
          <CardHeader
            title="People"
            subtitle="Who you are talking to here"
            actions={
              <Button size="sm" icon={Plus} onClick={() => setContactModal({ open: true, contact: null })}>
                Add contact
              </Button>
            }
          />
          {contacts.length === 0 ? (
            <EmptyState compact icon={Users} title="No contacts yet"
              description="Recruiters, hiring managers, whoever referred you." />
          ) : (
            <div className={styles.itemList}>
              {contacts.map((contact) => (
                <div key={contact.id} className={styles.item}>
                  <Avatar name={contact.name} size={36} round />
                  <div className={styles.itemText}>
                    <div className={styles.itemTitle}>{contact.name}</div>
                    <div className={styles.itemMeta}>
                      {[contact.title, RELATIONSHIP_LABELS[contact.relationship]].filter(Boolean).join(' · ')}
                    </div>
                    <div className={styles.itemBadges}>
                      {contact.email && (
                        <a className={styles.link} href={`mailto:${contact.email}`}>
                          <Mail size={12} /> {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a className={styles.link} href={`tel:${contact.phone}`}>
                          <Phone size={12} /> {contact.phone}
                        </a>
                      )}
                    </div>
                    {contact.notes && <div className={styles.itemNotes}>{contact.notes}</div>}
                  </div>
                  <div className={styles.itemActions}>
                    <IconButton label="Edit" icon={Pencil} size="sm"
                      onClick={() => setContactModal({ open: true, contact })} />
                    <IconButton label="Delete" icon={Trash2} size="sm"
                      onClick={() => deleteContact.mutate(contact.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader
            title="Documents"
            subtitle="Exactly which version you sent"
            actions={
              <Button size="sm" icon={Plus} onClick={() => setDocumentModal({ open: true, document: null })}>
                Add document
              </Button>
            }
          />
          {documents.length === 0 ? (
            <EmptyState compact icon={FileText} title="Nothing attached"
              description="Save the resume and cover letter you actually sent." />
          ) : (
            <div className={styles.itemList}>
              {documents.map((document) => (
                <div key={document.id} className={styles.item}>
                  <div className={styles.itemText}>
                    <div className={styles.itemTitle}>{document.title}</div>
                    <div className={styles.itemMeta}>
                      {DOCUMENT_KIND_LABELS[document.kind]}
                      {document.versionLabel ? ` · ${document.versionLabel}` : ''}
                      {` · added ${formatDate(document.createdAt)}`}
                    </div>
                    <div className={styles.itemBadges}>
                      {document.downloadUrl && (
                        <a className={styles.link} href={document.downloadUrl}>
                          <FileText size={12} /> {document.fileName}
                        </a>
                      )}
                      {document.url && (
                        <a className={styles.link} href={document.url} target="_blank" rel="noreferrer">
                          Open link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {document.notes && <div className={styles.itemNotes}>{document.notes}</div>}
                  </div>
                  <div className={styles.itemActions}>
                    <IconButton label="Edit" icon={Pencil} size="sm"
                      onClick={() => setDocumentModal({ open: true, document })} />
                    <IconButton label="Delete" icon={Trash2} size="sm"
                      onClick={() => deleteDocument.mutate(document.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <ApplicationFormModal open={editOpen} onClose={() => setEditOpen(false)} application={application} />

      <InterviewFormModal
        open={interviewModal.open}
        onClose={() => setInterviewModal({ open: false, interview: null })}
        interview={interviewModal.interview}
        applicationId={application.id}
      />
      <ContactFormModal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false, contact: null })}
        contact={contactModal.contact}
        applicationId={application.id}
        companyId={application.company.id}
      />
      <DocumentFormModal
        open={documentModal.open}
        onClose={() => setDocumentModal({ open: false, document: null })}
        document={documentModal.document}
        applicationId={application.id}
      />

      <Modal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        title="Set a follow-up"
        description="It shows up on Today when it comes due."
        width="480px"
        footer={
          <>
            <Button onClick={() => { setReminderForm({ nextAction: '', nextActionAt: '' }); saveReminder(); }}>
              Clear
            </Button>
            <Button variant="primary" onClick={saveReminder} loading={update.isPending}>Save</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Input
            label="What needs doing"
            value={reminderForm.nextAction}
            onChange={(e) => setReminderForm((f) => ({ ...f, nextAction: e.target.value }))}
            placeholder="Email the recruiter for an update"
          />
          <Input
            label="When"
            type="datetime-local"
            value={reminderForm.nextActionAt}
            onChange={(e) => setReminderForm((f) => ({ ...f, nextActionAt: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={confirmRemove}
        loading={remove.isPending}
        title={`Delete ${application.role}?`}
        description="This removes the application and everything attached to it — interviews, contacts and its timeline. Archiving keeps the history instead."
      />
    </div>
  );
}

