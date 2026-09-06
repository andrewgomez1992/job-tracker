import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useBoard, useReorderBoard } from '../../api/queries.js';
import { BOARD_COLUMNS } from '../../lib/constants.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { Button, SkeletonStack, useToast } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ApplicationCard } from './ApplicationCard.jsx';
import { ApplicationFormModal } from './ApplicationFormModal.jsx';
import { BoardColumn } from './BoardColumn.jsx';
import styles from './Board.module.css';

const CLOSED_COLUMNS = ['rejected', 'withdrawn'];

export function BoardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading } = useBoard();
  const reorder = useReorderBoard();

  const [showClosed, setShowClosed] = useLocalStorage('trail.board.showClosed', false);
  const [columns, setColumns] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [addStatus, setAddStatus] = useState(null);

  // Mirror the server board locally so drags feel instant.
  useEffect(() => { if (data) setColumns(data); }, [data]);

  const visibleColumns = useMemo(
    () => (showClosed ? [...BOARD_COLUMNS, ...CLOSED_COLUMNS] : BOARD_COLUMNS),
    [showClosed],
  );

  const sensors = useSensors(
    // A small distance threshold keeps a tap from being read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumn = useCallback((id) => {
    if (typeof id === 'string' && id.startsWith('column:')) return id.slice(7);
    return Object.keys(columns).find((status) => columns[status]?.some((a) => a.id === id));
  }, [columns]);

  const activeApplication = useMemo(() => {
    if (activeId == null) return null;
    return Object.values(columns).flat().find((a) => a.id === activeId) ?? null;
  }, [activeId, columns]);

  const onDragOver = ({ active, over }) => {
    if (!over) return;
    const from = findColumn(active.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to) return;

    setColumns((current) => {
      const moving = current[from].find((a) => a.id === active.id);
      if (!moving) return current;
      const overIndex = current[to].findIndex((a) => a.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : current[to].length;
      return {
        ...current,
        [from]: current[from].filter((a) => a.id !== active.id),
        [to]: [
          ...current[to].slice(0, insertAt),
          { ...moving, status: to },
          ...current[to].slice(insertAt),
        ],
      };
    });
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const target = findColumn(over.id);
    if (!target) return;

    const items = columns[target] ?? [];
    const oldIndex = items.findIndex((a) => a.id === active.id);
    const newIndex = items.findIndex((a) => a.id === over.id);
    const ordered = oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex
      ? arrayMove(items, oldIndex, newIndex)
      : items;

    const next = { ...columns, [target]: ordered.map((a) => ({ ...a, status: target })) };
    setColumns(next);

    const original = data?.[target]?.map((a) => a.id).join(',');
    if (original === ordered.map((a) => a.id).join(',')) return;

    reorder.mutate(
      { status: target, orderedIds: ordered.map((a) => a.id), optimisticBoard: next },
      {
        onError: (error) => {
          toast.error('Could not move that card', error.message);
          if (data) setColumns(data);
        },
      },
    );
  };

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Pipeline"
        subtitle="Drag a card to move it forward. Everything updates as you go."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAddStatus('saved')}>
            Add
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          Show closed stages
        </label>
        <div className={styles.toolbarSpacer} />
      </div>

      {isLoading ? (
        <SkeletonStack rows={3} height={120} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => { setActiveId(null); if (data) setColumns(data); }}
        >
          <div className={styles.board}>
            {visibleColumns.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                applications={columns[status] ?? []}
                onAdd={setAddStatus}
                onOpen={(id) => navigate(`/applications/${id}`)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}>
            {activeApplication && <ApplicationCard application={activeApplication} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      <ApplicationFormModal
        open={Boolean(addStatus)}
        onClose={() => setAddStatus(null)}
        defaultStatus={addStatus ?? undefined}
      />
    </div>
  );
}

