import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { documentMutations, useDocuments } from '../../api/queries.js';
import { DOCUMENT_KIND_LABELS } from '../../lib/constants.js';
import { formatBytes, formatDate } from '../../lib/format.js';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SkeletonStack, Tabs, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { DocumentFormModal } from './DocumentFormModal.jsx';
import styles from './Documents.module.css';

export function DocumentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [kind, setKind] = useState('');
  const [modal, setModal] = useState({ open: false, document: null });
  const [confirm, setConfirm] = useState(null);

  const { data: all = [], isLoading } = useDocuments();
  const remove = documentMutations.useDelete();

  const counts = useMemo(() => {
    const map = {};
    for (const doc of all) map[doc.kind] = (map[doc.kind] ?? 0) + 1;
    return map;
  }, [all]);

  const documents = kind ? all.filter((doc) => doc.kind === kind) : all;

  const tabs = [
    { value: '', label: 'All', count: all.length },
    ...Object.entries(DOCUMENT_KIND_LABELS)
      .filter(([value]) => counts[value])
      .map(([value, label]) => ({ value, label, count: counts[value] })),
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Documents"
        subtitle="Which resume went where, and the postings you saved."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, document: null })}>
            Add document
          </Button>
        }
      />

      {all.length > 0 && <Tabs items={tabs} value={kind} onChange={setKind} />}

      {isLoading ? (
        <SkeletonStack rows={3} height={130} />
      ) : documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={kind ? 'Nothing of that kind yet' : 'No documents saved'}
            description="Keep every resume version here so you know exactly what a company saw."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, document: null })}>
                Add document
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={styles.grid}>
          {documents.map((document) => (
            <Card key={document.id} className={styles.doc}>
              <div className={styles.docHead}>
                <div className={styles.docIcon}><FileText size={18} strokeWidth={1.9} /></div>
                <div className={styles.docText}>
                  <div className={styles.docTitle}>{document.title}</div>
                  <div className={styles.docMeta}>
                    {DOCUMENT_KIND_LABELS[document.kind]}
                    {document.versionLabel ? ` · ${document.versionLabel}` : ''}
                    {document.fileSize ? ` · ${formatBytes(document.fileSize)}` : ''}
                  </div>
                </div>
              </div>

              {document.notes && <div className={styles.docNotes}>{document.notes}</div>}

              <div className={styles.docFooter}>
                {document.applicationId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/applications/${document.applicationId}`)}
                    style={{
                      border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                      color: 'var(--accent)', fontSize: '0.75rem',
                    }}
                  >
                    {document.companyName} →
                  </button>
                ) : (
                  <Badge size="sm" variant="outline">Not linked</Badge>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  {formatDate(document.createdAt)}
                </span>

                <div className={styles.docActions}>
                  {document.downloadUrl && (
                    <IconButton
                      label="Download"
                      icon={Download}
                      size="sm"
                      onClick={() => { window.location.href = document.downloadUrl; }}
                    />
                  )}
                  {document.url && (
                    <IconButton label="Open link" icon={ExternalLink} size="sm"
                      onClick={() => window.open(document.url, '_blank', 'noreferrer')} />
                  )}
                  <IconButton label="Edit" icon={Pencil} size="sm"
                    onClick={() => setModal({ open: true, document })} />
                  <IconButton label="Delete" icon={Trash2} size="sm" onClick={() => setConfirm(document)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DocumentFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, document: null })}
        document={modal.document}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await remove.mutateAsync(confirm.id);
          toast.success('Document removed');
          setConfirm(null);
        }}
        loading={remove.isPending}
        title={`Delete “${confirm?.title}”?`}
        description="The record and any uploaded file are removed for good."
      />
    </div>
  );
}
