import { useState } from 'react';
import { Check, Copy, ExternalLink, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { Button, Card, CardBody, CardHeader, useToast } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { DEFAULT_GROUPS } from './defaultLinks.js';
import styles from './Links.module.css';

const isUrl = (v) => /^https?:\/\//i.test(v.trim());

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function Row({ item, onSave, onDelete }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(!item.value);
  const [draft, setDraft] = useState({ label: item.label, value: item.value });

  const copy = async () => {
    if (await copyText(item.value)) {
      setCopied(true); setTimeout(() => setCopied(false), 1300);
    } else toast.error('Copy blocked', 'Select the text and copy it by hand.');
  };
  const save = () => {
    if (!draft.value.trim()) return;
    onSave({ ...item, label: draft.label.trim() || 'Untitled', value: draft.value.trim(), kind: isUrl(draft.value) ? 'link' : 'text' });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={clsx(styles.row, styles.editing)}>
        <input className={styles.input} aria-label="Label" placeholder="Label" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
        <input className={clsx(styles.input, styles.grow)} aria-label="Link or text" placeholder="https://… or text" value={draft.value}
          onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} autoFocus />
        <div className={styles.actions}>
          <Button size="sm" variant="primary" icon={Check} onClick={save}>Save</Button>
          <Button size="sm" icon={X} onClick={() => { if (!item.value) onDelete(); else { setDraft({ label: item.label, value: item.value }); setEditing(false); } }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <button type="button" className={styles.copyArea} onClick={copy} title="Click to copy">
        <span className={styles.label}>{item.label}</span>
        <span className={clsx(styles.value, item.kind === 'text' && item.value.length > 60 && styles.long)}>{item.kind === 'link' ? item.value.replace(/^https?:\/\/(www\.)?/i, '') : item.value}</span>
      </button>
      <div className={styles.actions}>
        <button type="button" className={clsx(styles.copyBtn, copied && styles.copied)} onClick={copy} aria-label={`Copy ${item.label}`}>
          {copied ? <Check size={15} /> : <Copy size={15} />}<span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        {item.kind === 'link' && (
          <a className={styles.icon} href={item.value} target="_blank" rel="noreferrer" aria-label={`Open ${item.label}`} title="Open"><ExternalLink size={15} /></a>
        )}
        <button type="button" className={styles.icon} onClick={() => setEditing(true)} aria-label={`Edit ${item.label}`} title="Edit"><Pencil size={15} /></button>
        <button type="button" className={styles.icon} onClick={onDelete} aria-label={`Delete ${item.label}`} title="Delete"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

export function LinksPage() {
  const toast = useToast();
  const [groups, setGroups] = useLocalStorage('trail.links', DEFAULT_GROUPS);

  const update = (gid, fn) => setGroups((gs) => gs.map((g) => (g.id === gid ? { ...g, items: fn(g.items) } : g)));
  const addItem = (gid) => update(gid, (items) => [...items, { id: crypto.randomUUID(), label: '', value: '', kind: 'link' }]);

  const copyAll = async () => {
    const lines = groups.flatMap((g) => g.items.filter((i) => i.kind === 'link').map((i) => `${i.label}: ${i.value}`));
    if (await copyText(lines.join('\n'))) toast.success('Copied all links', `${lines.length} links on your clipboard`);
    else toast.error('Copy blocked', 'Your browser blocked the clipboard.');
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="My links"
        subtitle="Everything you paste into applications. Click any row to copy it."
        actions={<Button variant="primary" icon={Copy} onClick={copyAll}>Copy all links</Button>}
      />
      <div className={styles.grid}>
        {groups.map((g) => (
          <Card key={g.id}>
            <CardHeader title={g.title} actions={<Button size="sm" icon={Plus} onClick={() => addItem(g.id)}>Add</Button>} />
            <CardBody flush>
              <div className={styles.list}>
                {g.items.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    onSave={(next) => update(g.id, (items) => items.map((i) => (i.id === item.id ? next : i)))}
                    onDelete={() => update(g.id, (items) => items.filter((i) => i.id !== item.id))}
                  />
                ))}
                {g.items.length === 0 && <p className={styles.empty}>Nothing here yet.</p>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <p className={styles.note}>
        Saved in this browser.{' '}
        <button type="button" className={styles.reset} onClick={() => setGroups(DEFAULT_GROUPS)}><RotateCcw size={12} /> Reset to the defaults</button>
      </p>
    </div>
  );
}
