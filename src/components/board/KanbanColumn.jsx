import TaskCard from '../tasks/TaskCard';

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
 *   onOpen, onMove – forwarded to each card
 */
export default function KanbanColumn({
  status,
  index,
  cards,
  allTasks,
  isOver,
  setOver,
  onOpen,
  onMove,
}) {
  // preventDefault() is what allows this element to accept a drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setOver(status);
  };

  // The dragged card put its id in the drag data (see TaskCard)
  const handleDrop = (event) => {
    event.preventDefault();
    setOver(null);
    onMove(event.dataTransfer.getData('text/plain'), status);
  };

  return (
    <section
      className={`col ${isOver ? 'over' : ''}`}
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
          />
        ))}

        {!cards.length && <p className="drop">Drop tasks here</p>}
      </div>
    </section>
  );
}
