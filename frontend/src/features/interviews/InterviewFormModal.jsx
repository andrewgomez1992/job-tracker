import { useEffect, useState } from 'react';
import { interviewMutations, useApplications } from '../../api/queries.js';
import { INTERVIEW_FORMAT_LABELS, INTERVIEW_OUTCOME_LABELS } from '../../lib/constants.js';
import { fromInputValue, toLocalInputValue } from '../../lib/format.js';
import {
  Button, FieldRow, Input, Modal, Select, SuggestionChips, Textarea, useToast,
} from '../../components/ui/index.js';

const STAGE_SUGGESTIONS = [
  'Recruiter screen', 'Hiring manager', 'Technical screen', 'Take-home',
  'System design', 'Onsite loop', 'Final round', 'Team fit',
];

const empty = {
  applicationId: '', stage: '', scheduledAt: '', durationMinutes: '',
  format: '', location: '', interviewers: '', prepNotes: '', notes: '', outcome: 'scheduled',
};

const toForm = (interview) => (interview ? {
  applicationId: String(interview.applicationId),
  stage: interview.stage,
  scheduledAt: toLocalInputValue(interview.scheduledAt),
  durationMinutes: interview.durationMinutes ?? '',
  format: interview.format ?? '',
  location: interview.location ?? '',
  interviewers: interview.interviewers ?? '',
  prepNotes: interview.prepNotes ?? '',
  notes: interview.notes ?? '',
  outcome: interview.outcome,
} : empty);

export function InterviewFormModal({ open, onClose, interview, applicationId }) {
  const isEdit = Boolean(interview);
  const toast = useToast();
  const create = interviewMutations.useCreate();
  const update = interviewMutations.useUpdate();
  const { data: applications = [] } = useApplications({ archived: 'all', limit: 300 });

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ ...toForm(interview), ...(applicationId && !interview ? { applicationId: String(applicationId) } : {}) });
    setErrors({});
  }, [open, interview, applicationId]);

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!form.applicationId) return setErrors({ applicationId: 'Which application is this for?' });
    if (!form.stage.trim()) return setErrors({ stage: 'Name this round' });

    const payload = {
      stage: form.stage.trim(),
      scheduledAt: fromInputValue(form.scheduledAt),
      durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes),
      format: form.format || null,
      location: form.location || null,
      interviewers: form.interviewers || null,
      prepNotes: form.prepNotes || null,
      notes: form.notes || null,
      outcome: form.outcome,
    };

    try {
      if (isEdit) {
        await update.mutateAsync({ id: interview.id, ...payload });
        toast.success('Interview updated');
      } else {
        await create.mutateAsync({ applicationId: Number(form.applicationId), ...payload });
        toast.success('Interview added', payload.stage);
      }
      onClose();
    } catch (error) {
      setErrors(error.fieldErrors ?? {});
      if (Object.keys(error.fieldErrors ?? {}).length === 0) toast.error('Could not save', error.message);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit interview' : 'Add an interview'}
      width="580px"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={create.isPending || update.isPending}>
            {isEdit ? 'Save' : 'Add interview'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {!applicationId && !isEdit && (
          <Select
            label="Application"
            value={form.applicationId}
            onChange={set('applicationId')}
            error={errors.applicationId}
            placeholder="Pick one…"
            options={applications.map((a) => ({ value: String(a.id), label: `${a.role} — ${a.company.name}` }))}
          />
        )}

        <div>
          <Input label="Round" value={form.stage} onChange={set('stage')} error={errors.stage} placeholder="Technical screen" />
          <SuggestionChips options={STAGE_SUGGESTIONS} value={form.stage} onSelect={set('stage')} />
        </div>

        <FieldRow>
          <Input label="When" optional type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} />
          <Input label="Minutes" optional type="number" min="0" step="15" value={form.durationMinutes} onChange={set('durationMinutes')} placeholder="60" />
        </FieldRow>

        <FieldRow>
          <Select
            label="Format" optional value={form.format} onChange={set('format')} placeholder="Not set"
            options={Object.entries(INTERVIEW_FORMAT_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Outcome" value={form.outcome} onChange={set('outcome')}
            options={Object.entries(INTERVIEW_OUTCOME_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </FieldRow>

        <Input label="Link or place" optional value={form.location} onChange={set('location')} placeholder="Zoom link, or the office address" />
        <Input label="Who you're meeting" optional value={form.interviewers} onChange={set('interviewers')} placeholder="Priya Raman, plus two engineers" />
        <Textarea label="Prep notes" optional value={form.prepNotes} onChange={set('prepNotes')} placeholder="What to review, questions to ask…" />
        {isEdit && <Textarea label="How it went" optional value={form.notes} onChange={set('notes')} />}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
