import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import clsx from 'clsx';
import { STATUS_META } from '../../lib/constants.js';
import { ApplicationCard } from './ApplicationCard.jsx';
import styles from './Board.module.css';

function SortableCard({ application, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { status: application.status },
  });

  return (
    <ApplicationCard
      ref={setNodeRef}
      application={application}
      dragging={isDragging}
      className={styles.sortable}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onOpen={onOpen}
      {...attributes}
      {...listeners}
    />
  );
}

export function BoardColumn({ status, applications, onAdd, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { status } });
  const meta = STATUS_META[status];

  return (
    <section className={clsx(styles.column, isOver && styles.columnOver)}>
      <header className={styles.columnHead}>
        <span className={styles.columnDot} style={{ background: `var(--status-${status})` }} />
        <span className={styles.columnTitle}>{meta.label}</span>
        <span className={styles.columnCount}>{applications.length}</span>
        <button type="button" className={styles.columnAdd} onClick={() => onAdd(status)} aria-label={`Add to ${meta.label}`}>
          <Plus size={14} />
        </button>
      </header>

      <div className={styles.columnBody} ref={setNodeRef}>
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((application) => (
            <SortableCard key={application.id} application={application} onOpen={() => onOpen(application.id)} />
          ))}
        </SortableContext>

        {applications.length === 0 && <div className={styles.columnEmpty}>{meta.hint}</div>}
      </div>
    </section>
  );
}
