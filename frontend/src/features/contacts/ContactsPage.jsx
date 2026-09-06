import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { contactMutations, useContacts } from '../../api/queries.js';
import { RELATIONSHIP_LABELS } from '../../lib/constants.js';
import { formatDate } from '../../lib/format.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import {
  Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SkeletonStack, useToast,
} from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ContactFormModal } from './ContactFormModal.jsx';
import styles from './ContactsPage.module.css';

export function ContactsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [relationship, setRelationship] = useState('');
  const [modal, setModal] = useState({ open: false, contact: null });
  const [confirm, setConfirm] = useState(null);

  const debounced = useDebouncedValue(search.trim(), 250);
  const filters = useMemo(
    () => ({ search: debounced || undefined, relationship: relationship || undefined }),
    [debounced, relationship],
  );
  const { data: contacts = [], isLoading } = useContacts(filters);
  const remove = contactMutations.useDelete();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Contacts"
        subtitle="The people behind the applications."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, contact: null })}>
            Add contact
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={15} className={styles.searchIcon} aria-hidden />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or company…"
            aria-label="Search contacts"
          />
        </div>
        <select
          className={styles.select}
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
          aria-label="Filter by relationship"
        >
          <option value="">All relationships</option>
          {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonStack rows={4} height={140} />
      ) : contacts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={debounced || relationship ? 'No one matches' : 'No contacts yet'}
            description={debounced || relationship
              ? 'Try a different search or clear the filter.'
              : 'Add the recruiter or hiring manager for a role and you will always know who to chase.'}
            action={!debounced && !relationship && (
              <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, contact: null })}>
                Add contact
              </Button>
            )}
          />
        </Card>
      ) : (
        <div className={styles.grid}>
          {contacts.map((contact) => (
            <Card key={contact.id} className={styles.card}>
              <div className={styles.head}>
                <Avatar name={contact.name} size={38} round />
                <div className={styles.text}>
                  <div className={styles.name}>{contact.name}</div>
                  <div className={styles.title}>
                    {[contact.title, contact.companyName].filter(Boolean).join(' · ') || 'No title'}
                  </div>
                </div>
                <div className={styles.actions}>
                  <IconButton label="Edit" icon={Pencil} size="sm" onClick={() => setModal({ open: true, contact })} />
                  <IconButton label="Delete" icon={Trash2} size="sm" onClick={() => setConfirm(contact)} />
                </div>
              </div>

              {(contact.email || contact.phone || contact.linkedinUrl) && (
                <div className={styles.links}>
                  {contact.email && (
                    <a className={styles.link} href={`mailto:${contact.email}`}>
                      <Mail size={13} /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a className={styles.link} href={`tel:${contact.phone}`}>
                      <Phone size={13} /> {contact.phone}
                    </a>
                  )}
                  {contact.linkedinUrl && (
                    <a
                      className={styles.link}
                      href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              )}

              {contact.notes && <div className={styles.notes}>{contact.notes}</div>}

              <div className={styles.footer}>
                <Badge size="sm">{RELATIONSHIP_LABELS[contact.relationship]}</Badge>
                {contact.lastContactedAt && (
                  <Badge size="sm" variant="outline">Last spoke {formatDate(contact.lastContactedAt)}</Badge>
                )}
                {contact.applicationId && (
                  <button
                    type="button"
                    className={styles.appLink}
                    style={{ border: 'none', background: 'none', padding: 0, marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={() => navigate(`/applications/${contact.applicationId}`)}
                  >
                    {contact.applicationRole} →
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ContactFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, contact: null })}
        contact={modal.contact}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await remove.mutateAsync(confirm.id);
          toast.success('Contact removed');
          setConfirm(null);
        }}
        loading={remove.isPending}
        title={`Delete ${confirm?.name}?`}
        description="Their details are removed. Applications and interviews stay."
      />
    </div>
  );
}
