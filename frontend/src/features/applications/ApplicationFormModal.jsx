import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import {
  useCompanies, useCreateApplication, useUpdateApplication,
} from '../../api/queries.js';
import {
  EMPLOYMENT_TYPE_LABELS, PRIORITY_META, SOURCE_SUGGESTIONS, STATUS_META,
  STATUS_ORDER, WORK_MODE_LABELS,
} from '../../lib/constants.js';
import { fromInputValue, toDateInputValue, toLocalInputValue } from '../../lib/format.js';
import {
  Button, FieldRow, Input, Modal, Select, SuggestionChips, Textarea, useToast,
} from '../../components/ui/index.js';
import styles from './ApplicationFormModal.module.css';

const emptyForm = {
  companyName: '', role: '', status: 'saved', priority: 2, source: '', location: '',
  workMode: '', employmentType: '', salaryMin: '', salaryMax: '', jobUrl: '',
  appliedAt: '', nextAction: '', nextActionAt: '', jobDescription: '', notes: '',
};

const toForm = (application) => (application ? {
  companyName: application.company.name,
  role: application.role,
  status: application.status,
  priority: application.priority,
  source: application.source ?? '',
  location: application.location ?? '',
  workMode: application.workMode ?? '',
  employmentType: application.employmentType ?? '',
  salaryMin: application.salaryMin ?? '',
  salaryMax: application.salaryMax ?? '',
  jobUrl: application.jobUrl ?? '',
  appliedAt: toDateInputValue(application.appliedAt),
  nextAction: application.nextAction ?? '',
  nextActionAt: toLocalInputValue(application.nextActionAt),
  jobDescription: application.jobDescription ?? '',
  notes: application.notes ?? '',
} : emptyForm);

/** One modal for both creating and editing - the only difference is the payload. */
export function ApplicationFormModal({ open, onClose, application, defaultStatus }) {
  const isEdit = Boolean(application);
  const toast = useToast();
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const { data: companies = [] } = useCompanies();

  const [form, setForm] = useState(emptyForm);
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ ...toForm(application), ...(defaultStatus && !application ? { status: defaultStatus } : {}) });
    setShowDetails(Boolean(application));
    setErrors({});
    setFormError(null);
  }, [open, application, defaultStatus]);

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const statusOptions = useMemo(
    () => STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label })), [],
  );

  const pending = create.isPending || update.isPending;

  const submit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.companyName.trim()) return setErrors({ companyName: 'Which company?' });
    if (!form.role.trim()) return setErrors({ role: 'What is the role called?' });

    const payload = {
      companyName: form.companyName.trim(),
      role: form.role.trim(),
      status: form.status,
      priority: Number(form.priority),
      source: form.source || null,
      location: form.location || null,
      workMode: form.workMode || null,
      employmentType: form.employmentType || null,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      jobUrl: form.jobUrl || null,
      appliedAt: fromInputValue(form.appliedAt),
      nextAction: form.nextAction || null,
      nextActionAt: fromInputValue(form.nextActionAt),
      jobDescription: form.jobDescription || null,
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await update.mutateAsync({ id: application.id, ...payload });
        toast.success('Saved', `${payload.role} at ${payload.companyName}`);
      } else {
        await create.mutateAsync(payload);
        toast.success('Added', `${payload.role} at ${payload.companyName}`);
      }
      onClose();
    } catch (error) {
      const fields = error.fieldErrors ?? {};
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(error.message);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit application' : 'Add an application'}
      description={isEdit ? undefined : 'Company and role are all you need to start.'}
      width="620px"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={pending}>
            {isEdit ? 'Save changes' : 'Add application'}
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={submit}>
        {formError && <div className={styles.formError}>{formError}</div>}

        <FieldRow>
          <Input
            label="Company"
            value={form.companyName}
            onChange={set('companyName')}
            error={errors.companyName}
            list="company-suggestions"
            placeholder="Acme Inc."
            autoComplete="off"
          />
          <datalist id="company-suggestions">
            {companies.map((company) => <option key={company.id} value={company.name} />)}
          </datalist>
          <Input
            label="Role"
            value={form.role}
            onChange={set('role')}
            error={errors.role}
            placeholder="Senior Frontend Engineer"
          />
        </FieldRow>

        <FieldRow>
          <Select label="Stage" value={form.status} onChange={set('status')} options={statusOptions} />
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 550, color: 'var(--text-muted)', marginBottom: 6 }}>
              Priority
            </div>
            <div className={styles.priorityRow}>
              {[3, 2, 1].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={clsx(styles.priorityOption, Number(form.priority) === level && styles.priorityActive)}
                  onClick={() => set('priority')(level)}
                >
                  {PRIORITY_META[level].label}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>

        <div>
          <Input label="Where did you find it?" optional value={form.source} onChange={set('source')} placeholder="LinkedIn" />
          <SuggestionChips options={SOURCE_SUGGESTIONS} value={form.source} onSelect={set('source')} />
        </div>

        <div className={styles.divider}>
          <button type="button" className={styles.toggle} onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? 'Fewer details' : 'More details'}
            <ChevronDown size={14} className={clsx(styles.chevron, showDetails && styles.chevronOpen)} />
          </button>
          <span className={styles.dividerLine} />
        </div>

        {showDetails && (
          <div className={styles.section}>
            <FieldRow>
              <Input label="Location" optional value={form.location} onChange={set('location')} placeholder="Remote (US)" />
              <Select
                label="Work mode" optional value={form.workMode} onChange={set('workMode')}
                placeholder="Not set"
                options={Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </FieldRow>

            <FieldRow>
              <Select
                label="Employment type" optional value={form.employmentType} onChange={set('employmentType')}
                placeholder="Not set"
                options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <Input label="Applied on" optional type="date" value={form.appliedAt} onChange={set('appliedAt')} />
            </FieldRow>

            <FieldRow>
              <Input
                label="Salary from" optional type="number" min="0" step="1000"
                value={form.salaryMin} onChange={set('salaryMin')} error={errors.salaryMin} placeholder="150000"
              />
              <Input
                label="Salary to" optional type="number" min="0" step="1000"
                value={form.salaryMax} onChange={set('salaryMax')} placeholder="185000"
              />
            </FieldRow>

            <Input label="Job posting link" optional type="url" value={form.jobUrl} onChange={set('jobUrl')} placeholder="https://" />

            <FieldRow>
              <Input label="Next action" optional value={form.nextAction} onChange={set('nextAction')} placeholder="Follow up with the recruiter" />
              <Input label="Remind me on" optional type="datetime-local" value={form.nextActionAt} onChange={set('nextActionAt')} />
            </FieldRow>

            <Textarea
              label="Job description" optional value={form.jobDescription} onChange={set('jobDescription')}
              hint="Paste it here - postings disappear once the role is filled."
              placeholder="Paste the posting…"
            />

            <Textarea label="Notes" optional value={form.notes} onChange={set('notes')} placeholder="Why you want this one, who you know there…" />
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
