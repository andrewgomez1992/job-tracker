import { useEffect, useState } from 'react';
import { contactMutations, useApplications, useCompanies } from '../../api/queries.js';
import { RELATIONSHIP_LABELS } from '../../lib/constants.js';
import { fromInputValue, toDateInputValue } from '../../lib/format.js';
import {
  Button, FieldRow, Input, Modal, Select, Textarea, useToast,
} from '../../components/ui/index.js';

const empty = {
  name: '', title: '', email: '', phone: '', linkedinUrl: '',
  relationship: 'recruiter', companyId: '', applicationId: '', lastContactedAt: '', notes: '',
};

const toForm = (contact) => (contact ? {
  name: contact.name,
  title: contact.title ?? '',
  email: contact.email ?? '',
  phone: contact.phone ?? '',
  linkedinUrl: contact.linkedinUrl ?? '',
  relationship: contact.relationship,
  companyId: contact.companyId ? String(contact.companyId) : '',
  applicationId: contact.applicationId ? String(contact.applicationId) : '',
  lastContactedAt: toDateInputValue(contact.lastContactedAt),
  notes: contact.notes ?? '',
} : empty);

export function ContactFormModal({ open, onClose, contact, applicationId, companyId }) {
  const isEdit = Boolean(contact);
  const toast = useToast();
  const create = contactMutations.useCreate();
  const update = contactMutations.useUpdate();
  const { data: companies = [] } = useCompanies();
  const { data: applications = [] } = useApplications({ archived: 'all', limit: 300 });

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      ...toForm(contact),
      ...(applicationId && !contact ? { applicationId: String(applicationId) } : {}),
      ...(companyId && !contact ? { companyId: String(companyId) } : {}),
    });
    setErrors({});
  }, [open, contact, applicationId, companyId]);

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Who is it?' });

    const payload = {
      name: form.name.trim(),
      title: form.title || null,
      email: form.email || null,
      phone: form.phone || null,
      linkedinUrl: form.linkedinUrl || null,
      relationship: form.relationship,
      companyId: form.companyId ? Number(form.companyId) : null,
      applicationId: form.applicationId ? Number(form.applicationId) : null,
      lastContactedAt: fromInputValue(form.lastContactedAt),
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await update.mutateAsync({ id: contact.id, ...payload });
        toast.success('Contact updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Contact added', payload.name);
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
      title={isEdit ? 'Edit contact' : 'Add a contact'}
      width="560px"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={create.isPending || update.isPending}>
            {isEdit ? 'Save' : 'Add contact'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <FieldRow>
          <Input label="Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Priya Raman" />
          <Input label="Title" optional value={form.title} onChange={set('title')} placeholder="Engineering Manager" />
        </FieldRow>

        <FieldRow>
          <Select
            label="Relationship" value={form.relationship} onChange={set('relationship')}
            options={Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Company" optional value={form.companyId} onChange={set('companyId')} placeholder="Not linked"
            options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
          />
        </FieldRow>

        {!applicationId && (
          <Select
            label="Application" optional value={form.applicationId} onChange={set('applicationId')} placeholder="Not linked"
            options={applications.map((a) => ({ value: String(a.id), label: `${a.role} — ${a.company.name}` }))}
          />
        )}

        <FieldRow>
          <Input label="Email" optional type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="priya@company.com" />
          <Input label="Phone" optional value={form.phone} onChange={set('phone')} />
        </FieldRow>

        <FieldRow>
          <Input label="LinkedIn" optional value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="linkedin.com/in/…" />
          <Input label="Last spoke" optional type="date" value={form.lastContactedAt} onChange={set('lastContactedAt')} />
        </FieldRow>

        <Textarea label="Notes" optional value={form.notes} onChange={set('notes')} placeholder="How you met, what they care about…" />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
