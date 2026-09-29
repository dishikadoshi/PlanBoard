import { wouldCycle } from '../../utils/dependencyUtils';
import { StatusPill } from '../common/Primitives';

/** ["A" (Done), "B" (To Do)] → “A” (Done), “B” (To Do) */
const quoteTasks = (tasks) =>
  tasks.map((task) => `“${task.title}” (${task.status})`).join(', ');


/**
 * One row of the checklist.
 * A row is disabled when ticking it would close a dependency loop.
 */
function DependencyRow({ task, checked, createsCycle, onToggle }) {
  return (
    <li>
      <label className={`drow ${checked ? 'on' : ''} ${createsCycle ? 'off' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={createsCycle}
          onChange={() => onToggle(task.id)}
        />

        <span className="dt">{task.title}</span>

        {createsCycle && <small className="reason">would create a cycle</small>}

        <StatusPill status={task.status} />
      </label>
    </li>
  );
}


/**
 * Sentence under the list that explains whether the task will be blocked.
 * Returns { tone, text } where tone picks the banner colour.
 */
function describeBlockedState({ hasSelection, waiting, taskStatus }) {
  if (!hasSelection) {
    return { tone: 'neutral', text: 'No prerequisites — this task can start any time.' };
  }

  if (waiting.length) {
    const verb = waiting.length > 1 ? 'are all' : 'is';

    return { tone: 'bad', text: `🔒 Blocked until ${quoteTasks(waiting)} ${verb} Done.` };
  }

  if (taskStatus === 'Done') {
    return { tone: 'neutral', text: 'This task is Done, so it is not shown as blocked.' };
  }

  return { tone: 'ok', text: '✓ Every prerequisite is Done — this task is unblocked.' };
}


/**
 * Checklist of prerequisites.
 *
 * Ticked tasks sit in "Selected" at the top; the rest stay in "Available"
 * below, and a task hops between the two lists the moment it is (un)ticked.
 * Only DIRECT prerequisites are stored: if C must happen before E, tick C on E.
 *
 * Props:
 *   tasks    – every task in the project
 *   selfId   – id of the task being edited (undefined for a new task)
 *   status   – the form's current status (a Done task is never blocked)
 *   value    – array of selected prerequisite ids
 *   onChange – receives the new array of ids
 *   error    – validation message to show, if any
 */
export default function DependencySelector({ tasks, selfId, status, value, onChange, error }) {
  // A task can never be its own prerequisite, so it is never offered
  const candidates = tasks.filter((task) => task.id !== selfId);
  const selected = candidates.filter((task) => value.includes(task.id));
  const available = candidates.filter((task) => !value.includes(task.id));

  // Selected prerequisites that are not finished yet (a Done task is never blocked)
  const waiting = status === 'Done' ? [] : selected.filter((task) => task.status !== 'Done');

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  /** Renders the rows of one list ("Selected" or "Available"). */
  const renderRows = (list, checked) =>
    list.map((task) => (
      <DependencyRow
        key={task.id}
        task={task}
        checked={checked}
        // Would ticking this task close a loop?
        createsCycle={!checked && wouldCycle(tasks, selfId, [...value, task.id])}
        onToggle={toggle}
      />
    ));

  const summary = describeBlockedState({
    hasSelection: selected.length > 0,
    waiting,
    taskStatus: status,
  });

  const emptyAvailableMessage = candidates.length
    ? 'Every task is already selected.'
    : 'No other tasks yet.';

  return (
    <fieldset className="depsel" aria-describedby="dep-help">
      <legend>Dependencies / Prerequisites</legend>

      <p id="dep-help" className="help">
        Select tasks that must be Done before this task becomes unblocked.
      </p>

      <div className="dscroll">
        {/* Ticked tasks */}
        <div className="dgroup">
          <h4>Selected prerequisites ({selected.length})</h4>

          {selected.length ? (
            <ul>{renderRows(selected, true)}</ul>
          ) : (
            <p className="muted">Nothing selected yet.</p>
          )}
        </div>

        {/* Everything else */}
        <div className="dgroup">
          <h4>Available tasks ({available.length})</h4>

          {available.length ? (
            <ul>{renderRows(available, false)}</ul>
          ) : (
            <p className="muted">{emptyAvailableMessage}</p>
          )}
        </div>
      </div>

      <p className={`why ${summary.tone}`} role="status" aria-live="polite">
        {summary.text}
      </p>

      {error && <em role="alert">{error}</em>}
    </fieldset>
  );
}
