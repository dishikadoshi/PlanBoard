import { useMemo, useState } from 'react';
import { STATUSES, NO_FILTERS } from '../../app/constants';
import { filterTasks, allTags, isFiltering } from '../../utils/taskUtils';
import { moveBlockReason } from '../../utils/dependencyUtils';
import { EmptyState } from '../common/Primitives';
import BoardFilters from './BoardFilters';
import KanbanColumn from './KanbanColumn';

/**
 * The Kanban page: filter bar + one column per status.
 *
 * Props:
 *   tasks      – every task in the project
 *   filters    – current filter values (owned by App so they survive navigation)
 *   setFilters – updates the filters
 *   onOpen     – open a task's details
 *   onMove     – change a task's status (drag & drop or dropdown)
 */
export default function KanbanBoard({ tasks, filters, setFilters, onOpen, onMove }) {
  // Name of the column a card is currently being dragged over
  const [dragOverStatus, setDragOverStatus] = useState(null);

  // Id of the card being dragged (null when nothing is)
  const [draggedId, setDraggedId] = useState(null);

  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const tags = useMemo(() => allTags(tasks), [tasks]);

  // While a blocked card hovers a column it may not enter, explain why
  const draggedTask = tasks.find((task) => task.id === draggedId) || null;
  const dragHint =
    draggedTask && dragOverStatus && draggedTask.status !== dragOverStatus
      ? moveBlockReason(draggedTask, dragOverStatus, tasks)
      : '';

  const projectIsEmpty = tasks.length === 0;
  const nothingMatchesFilters = tasks.length > 0 && visibleTasks.length === 0;

  return (
    <>
      <BoardFilters
        filters={filters}
        setFilters={setFilters}
        tags={tags}
        active={isFiltering(filters)}
      />

      {projectIsEmpty && (
        <EmptyState tight>Your project is empty. Add a task to get started.</EmptyState>
      )}

      {nothingMatchesFilters && (
        <EmptyState tight>
          No tasks match your filters.{' '}
          <button className="link" onClick={() => setFilters(NO_FILTERS)}>
            Clear filters
          </button>
        </EmptyState>
      )}

      {/* Floats over the page so it never shifts the board mid-drag */}
      {dragHint && (
        <p className="drag-hint" role="status">
          🔒 {dragHint}
        </p>
      )}

      <div className="board">
        {STATUSES.map((status, index) => (
          <KanbanColumn
            key={status}
            status={status}
            index={index}
            cards={visibleTasks.filter((task) => task.status === status)}
            allTasks={tasks}
            isOver={dragOverStatus === status}
            setOver={setDragOverStatus}
            draggedTask={draggedTask}
            setDraggedId={setDraggedId}
            onOpen={onOpen}
            onMove={onMove}
          />
        ))}
      </div>
    </>
  );
}