import { STATUSES } from '../../app/constants';
import { blockers, moveBlockReason } from '../../utils/dependencyUtils';
import { isOverdue } from '../../utils/taskUtils';
import { fmtDate } from '../../utils/dateUtils';

/** Max number of cards that get a staggered entrance delay */
const MAX_STAGGERED_CARDS = 8;
const STAGGER_MS = 40;

/**
 * One task on the Kanban board.
 *
 * Every card has the same four rows, so titles, tags, assignees and
 * dates line up across the board:
 *
 *   title ......... priority
 *   badges + #tags
 *   [avatar] name . due · hours
 *   [status ▼]
 *
 * Props:
 *   task   – the task to show
 *   index  – position in its column (drives the entrance animation)
 *   tasks  – every task (needed to work out what is blocking this one)
 *   onOpen – open the details popup
 *   onMove – change the task's status
 *   onDragStart, onDragEnd – tell the board when a drag begins / ends
 */
export default function TaskCard({ task, index, tasks, onOpen, onMove, onDragStart, onDragEnd }) {
  const waitingOn = blockers(task, tasks);
  const blockerCount = waitingOn.length;

  // "Oct 9 · 6h", or an em dash when neither is set
  const dueAndEstimate =
    [task.due && fmtDate(task.due), task.est ? `${task.est}h` : '']
      .filter(Boolean)
      .join(' · ') || '—';

  const blockedTooltip = `Waiting for: ${waitingOn
    .map((prereq) => `${prereq.title} (${prereq.status})`)
    .join(', ')}`;

  // Enter opens the card, but only when the card itself has focus
  // (not when the status dropdown inside it does)
  const handleKeyDown = (event) => {
    if (event.target === event.currentTarget && event.key === 'Enter') onOpen(task);
  };

  return (
    <article
      className={`card p-${task.priority} ${blockerCount ? 'blocked' : ''}`}
      style={{ animationDelay: `${Math.min(index, MAX_STAGGERED_CARDS) * STAGGER_MS}ms` }}
      role="button"
      tabIndex={0}
      aria-label={`${task.title}, ${task.priority} priority${
        blockerCount ? `, blocked by ${blockerCount}` : ''
      }. Open details`}
      draggable
      onClick={() => onOpen(task)}
      onKeyDown={handleKeyDown}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        onDragStart?.(task.id);
      }}
      onDragEnd={onDragEnd}
    >
      {/* Row 1: title + priority */}
      <div className="ctop">
        <h3>{task.title}</h3>
        <span className="pri">{task.priority}</span>
      </div>

      {/* Row 2: state badges + tags */}
      <div className="ctags">
        {blockerCount > 0 && (
          <span className="badge red" title={blockedTooltip}>
            🔒 Blocked by {blockerCount}
          </span>
        )}

        {isOverdue(task) && <span className="badge amber">⚠ Overdue</span>}

        {task.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      {/* Row 3: assignee + due date / estimate */}
      <div className="cmeta">
        <span className="who">
          <span className="avatar" aria-hidden="true">
            {task.assignee[0]}
          </span>
          {task.assignee}
        </span>

        <span className="when">{dueAndEstimate}</span>
      </div>

      {/* Row 4: keyboard / touch friendly alternative to drag & drop */}
      <select
        className="cstatus"
        aria-label={`Status of ${task.title}`}
        value={task.status}
        onChange={(event) => onMove(task.id, event.target.value)}
        onClick={(event) => event.stopPropagation()}
        draggable={false}
        title={blockerCount ? 'Blocked: can only be Backlog or To Do until prerequisites are Done' : undefined}
      >
        {STATUSES.map((status) => {
          // Blocked tasks cannot enter In Progress / Review / Done
          const locked = status !== task.status && Boolean(moveBlockReason(task, status, tasks));

          return (
            <option key={status} value={status} disabled={locked}>
              {status}
              {locked ? ' 🔒' : ''}
            </option>
          );
        })}
      </select>
    </article>
  );
}