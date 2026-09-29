import { blockers, isBlocked } from '../../utils/dependencyUtils';
import { isOverdue } from '../../utils/taskUtils';

/**
 * Summary panel that sits under the dependency map:
 * a few numbers, the list of blocked tasks and a legend.
 *
 * Props:
 *   tasks  – every task in the project
 *   onOpen – open a task's details
 */
export default function DependencyInsights({ tasks, onOpen }) {
  if (!tasks.length) return null;

  const linkCount = tasks.reduce((count, task) => count + task.deps.length, 0);
  const blockedTasks = tasks.filter((task) => isBlocked(task, tasks));

  // A root task has no prerequisites, but other tasks build on it
  const rootTasks = tasks.filter(
    (task) => !task.deps.length && tasks.some((other) => other.deps.includes(task.id))
  );

  // [label, number] pairs for the tiles at the top
  const stats = [
    ['Links', linkCount],
    ['Blocked', blockedTasks.length],
    ['Overdue', tasks.filter(isOverdue).length],
    ['Root tasks', rootTasks.length],
  ];

  return (
    <section className="panel insights">
      <h2>Dependency Insights</h2>

      {/* Number tiles */}
      <div className="istats">
        {stats.map(([label, count]) => (
          <div key={label}>
            <b key={count} className="pop">
              {count}
            </b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="icols">
        {/* Blocked tasks */}
        <div>
          <h3>Blocked tasks</h3>

          {blockedTasks.length ? (
            <ul>
              {blockedTasks.map((task) => (
                <li key={task.id}>
                  <button className="link" onClick={() => onOpen(task)}>
                    {task.title}
                  </button>

                  <small>by {blockers(task, tasks).length}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing is blocked right now.</p>
          )}
        </div>

        {/* Legend for the markers used on the map */}
        <div>
          <h3>Dependency legend</h3>

          <ul>
            <li>✓ Done</li>
            <li>● Active</li>
            <li>🔒 Blocked</li>
            <li>⚠ Overdue</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
