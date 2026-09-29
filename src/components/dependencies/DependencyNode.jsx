import { blockers, isBlocked } from '../../utils/dependencyUtils';
import { isOverdue } from '../../utils/taskUtils';

/**
 * Status marker shown in front of the title.
 * Shared with the legend in DependencyInsights.
 */
const statusMarker = (task, tasks) => {
  if (task.status === 'Done') return '✓';
  if (isBlocked(task, tasks)) return '🔒';
  if (isOverdue(task)) return '⚠';

  return '●';
};

/**
 * One task box on the dependency map.
 * `data-node` lets the wire routing find this box in the DOM.
 *
 * Props:
 *   task      – the task to draw
 *   tasks     – every task (to work out blockers)
 *   isDimmed  – fade out while a different task is being traced
 *   onTrace   – called with the task id on hover / focus, and null on leave / blur
 *   onOpen    – open the task's details
 */
export default function DependencyNode({ task, tasks, isDimmed, onTrace, onOpen }) {
  const blockingTasks = blockers(task, tasks);
  const blocked = blockingTasks.length > 0;

  const blockedTooltip = blockingTasks
    .map((prereq) => `${prereq.title} (${prereq.status})`)
    .join(', ');

  return (
    <button
      data-node={task.id}
      className={`node ${blocked ? 'blocked' : ''} ${isDimmed ? 'dim' : ''}`}
      aria-label={`Open ${task.title}`}
      onMouseEnter={() => onTrace(task.id)}
      onMouseLeave={() => onTrace(null)}
      onFocus={() => onTrace(task.id)}
      onBlur={() => onTrace(null)}
      onClick={() => onOpen(task)}
    >
      <b>
        <i className="mk" aria-hidden="true">
          {statusMarker(task, tasks)}
        </i>
        {task.title}
      </b>

      <span>
        {task.status} · {task.assignee}
      </span>

      {blocked && <em title={blockedTooltip}>Blocked by {blockingTasks.length}</em>}
    </button>
  );
}
