import TaskCard from '../tasks/TaskCard';
import { moveBlockReason } from '../../utils/dependencyUtils';

/**
 * One status column. Also the drop target for dragged cards.
 *
 * Props:
 *   status   – column name, e.g. "In Progress"
 *   index    – column position (picks the status colour)
 *   cards    – tasks to show (already filtered)
 *   allTasks – every task (cards need them to work out blockers)
 *   isOver   – true while a card is dragged over this column
 *   setOver  – tells the board which column is being hovered
 *   draggedTask – the task currently being dragged (or null)
 *   setDraggedId – tells the board which task is being dragged
 *   onOpen, onMove – forwarded to each card
 */
export default function KanbanColumn({
  status,
  index,
  cards,
  allTasks,
  isOver,
  setOver,
  draggedTask,
  setDraggedId,
  onOpen,
  onMove,
}) {
  // A blocked card cannot be dropped into In Progress / Review / Done
  const dropIsDenied =
    Boolean(draggedTask) &&
    draggedTask.status !== status &&
    Boolean(moveBlockReason(draggedTask, status, allTasks));

  // preventDefault() is what allows this element to accept a drop
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = dropIsDenied ? 'none' : 'move'; // "no drop" cursor
    setOver(status);
  };

  // The dragged card put its id in the drag data (see TaskCard)
  const handleDrop = (event) => {
    event.preventDefault();
    setOver(null);
    setDraggedId(null);

    if (dropIsDenied) return;

    onMove(event.dataTransfer.getData('text/plain'), status);
  };

  const stopDragging = () => {
    setDraggedId(null);
    setOver(null);
  };

  return (
    <section
      className={`col ${isOver ? (dropIsDenied ? 'denied' : 'over') : ''}`}
      aria-label={`${status} column`}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(null)}
      onDrop={handleDrop}
    >
      <h2>
        <i className={`s${index}`} />
        {status}
        <span>{cards.length}</span>
      </h2>

      <div className="cards">
        {cards.map((task, position) => (
          <TaskCard
            key={task.id}
            task={task}
            index={position}
            tasks={allTasks}
            onOpen={onOpen}
            onMove={onMove}
            onDragStart={setDraggedId}
            onDragEnd={stopDragging}
          />
        ))}

        {!cards.length && <p className="drop">Drop tasks here</p>}
      </div>
    </section>
  );
}