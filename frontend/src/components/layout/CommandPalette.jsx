import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CornerDownLeft, Search, User } from 'lucide-react';
import clsx from 'clsx';
import { useApplications, useContacts } from '../../api/queries.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Modal } from '../ui/index.js';
import { NAV_ITEMS } from './navigation.js';
import styles from './CommandPalette.module.css';

/** ⌘K: jump to a page, an application or a contact without leaving the keyboard. */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);

  const search = useDebouncedValue(query.trim(), 200);
  const { data: applications = [] } = useApplications(
    search ? { search, archived: 'all', limit: 8 } : undefined,
  );
  const { data: contacts = [] } = useContacts(search ? { search } : undefined);

  useEffect(() => { if (open) { setQuery(''); setCursor(0); } }, [open]);
  useEffect(() => { setCursor(0); }, [search]);

  const groups = useMemo(() => {
    const lower = search.toLowerCase();
    const pages = NAV_ITEMS
      .filter((item) => !lower || item.label.toLowerCase().includes(lower))
      .map((item) => ({
        key: `nav-${item.to}`, icon: item.icon, title: item.label,
        meta: 'Page', run: () => navigate(item.to),
      }));

    const apps = (search ? applications : []).slice(0, 8).map((app) => ({
      key: `app-${app.id}`, icon: Briefcase, title: `${app.role}`,
      meta: `${app.company.name} · ${app.status}`, run: () => navigate(`/applications/${app.id}`),
    }));

    const people = (search ? contacts : []).slice(0, 5).map((contact) => ({
      key: `contact-${contact.id}`, icon: User, title: contact.name,
      meta: [contact.title, contact.companyName].filter(Boolean).join(' · ') || 'Contact',
      run: () => navigate('/contacts'),
    }));

    return [
      { label: 'Applications', items: apps },
      { label: 'Contacts', items: people },
      { label: 'Pages', items: pages },
    ].filter((group) => group.items.length > 0);
  }, [search, applications, contacts, navigate]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((c) => (c + 1) % Math.max(flat.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((c) => (c - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (event.key === 'Enter' && flat[cursor]) {
      event.preventDefault();
      flat[cursor].run();
      onClose();
    }
  };

  let index = -1;

  return (
    <Modal open={open} onClose={onClose} width="580px" bodyFlush>
      <div className={styles.searchRow}>
        <Search size={18} className={styles.icon} aria-hidden />
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search applications, contacts and pages…"
          aria-label="Search"
        />
      </div>

      <div className={styles.results} ref={listRef}>
        {flat.length === 0 ? (
          <div className={styles.empty}>Nothing matches “{query}”.</div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className={styles.groupLabel}>{group.label}</div>
              {group.items.map((item) => {
                index += 1;
                const isActive = index === cursor;
                const myIndex = index;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-active={isActive}
                    className={clsx(styles.item, isActive && styles.itemActive)}
                    onMouseEnter={() => setCursor(myIndex)}
                    onClick={() => { item.run(); onClose(); }}
                  >
                    <item.icon size={16} className={styles.itemIcon} aria-hidden />
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMeta}>{item.meta}</span>
                    </span>
                    {isActive && <CornerDownLeft size={14} className={styles.itemIcon} aria-hidden />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <span><kbd className={styles.hintKey}>↑↓</kbd>navigate</span>
        <span><kbd className={styles.hintKey}>↵</kbd>open</span>
        <span><kbd className={styles.hintKey}>esc</kbd>close</span>
      </div>
    </Modal>
  );
}
