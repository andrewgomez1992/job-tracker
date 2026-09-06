import { useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { documentMutations, useApplications, useUploadDocument } from '../../api/queries.js';
import { DOCUMENT_KIND_LABELS } from '../../lib/constants.js';
import { formatBytes } from '../../lib/format.js';
import {
  Button, Field, FieldRow, Input, Modal, Select, Textarea, useToast,
} from '../../components/ui/index.js';
import styles from './Documents.module.css';

const empty = { title: '', kind: 'resume', versionLabel: '', url: '', applicationId: '', notes: '' };

const toForm = (document) => (document ? {
  title: document.title,
  kind: document.kind,
  versionLabel: document.versionLabel ?? '',
  url: document.url ?? '',
  applicationId: document.applicationId ? String(document.applicationId) : '',
  notes: document.notes ?? '',
} : empty);

export function DocumentFormModal({ open, onClose, document: existing, applicationId }) {
  const isEdit = Boolean(existing);
  const toast = useToast();
  const upload = useUploadDocument();
  const update = documentMutations.useUpdate();
  const { data: applications = [] } = useApplications({ archived: 'all', limit: 300 });
  const fileInput = useRef(null);

  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ ...toForm(existing), ...(applicationId && !existing ? { applicationId: String(applicationId) } : {}) });
    setFile(null);
    setErrors({});
  }, [open, existing, applicationId]);

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!form.title.trim()) return setErrors({ title: 'Give it a title' });

    const payload = {
      title: form.title.trim(),
      kind: form.kind,
      versionLabel: form.versionLabel || null,
      url: form.url || null,
      applicationId: form.applicationId ? Number(form.applicationId) : null,
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await update.mutateAsync({ id: existing.id, ...payload });
        toast.success('Document updated');
      } else {
        await upload.mutateAsync({ ...payload, applicationId: payload.applicationId ?? '', file });
        toast.success('Document saved', payload.title);
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
      title={isEdit ? 'Edit document' : 'Save a document'}
      description={isEdit ? undefined : 'Track which version of your resume went where.'}
      width="560px"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={upload.isPending || update.isPending}>
            {isEdit ? 'Save' : 'Save document'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <FieldRow>
          <Input label="Title" value={form.title} onChange={set('title')} error={errors.title} placeholder="Resume — frontend focus" />
          <Select
            label="Kind" value={form.kind} onChange={set('kind')}
            options={Object.entries(DOCUMENT_KIND_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </FieldRow>

        <FieldRow>
          <Input label="Version" optional value={form.versionLabel} onChange={set('versionLabel')} placeholder="v3" />
          {!applicationId && (
            <Select
              label="Application" optional value={form.applicationId} onChange={set('applicationId')} placeholder="Not linked"
              options={applications.map((a) => ({ value: String(a.id), label: `${a.role} — ${a.company.name}` }))}
            />
          )}
        </FieldRow>

        <Input label="Link" optional type="url" value={form.url} onChange={set('url')} placeholder="https://docs.google.com/…" />

        {!isEdit && (
          <Field label="File" optional hint="PDF, Word, text or an image — up to 10 MB.">
            {file ? (
              <div className={styles.filePicked}>
                <Paperclip size={15} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                <button type="button" className={styles.fileRemove} onClick={() => setFile(null)} aria-label="Remove file">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" className={styles.dropzone} onClick={() => fileInput.current?.click()}>
                <Paperclip size={16} />
                Choose a file
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
        )}

        <Textarea label="Notes" optional value={form.notes} onChange={set('notes')} placeholder="What makes this version different…" />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
