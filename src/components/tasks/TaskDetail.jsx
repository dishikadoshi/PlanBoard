import { useEffect, useRef } from 'react';
import { STATUSES } from '../../app/constants';
import {
  blockers,
  directPrerequisites,
  indirectPrerequisites,
  dependentsOf,
  indirectDependents,
  moveBlockReason,
} from '../../utils/dependencyUtils';
import { isOverdue } from '../../utils/taskUtils';
import { fmtDate } from '../../utils/dateUtils';
import Modal from '../common/Modal';
import Dropdown from '../common/Dropdown';
import { StatusPill } from '../common/Primitives';

/** One related task: a clickable title (opens that task) plus its status pill. */
function RelatedTaskItem({ task, icon, onOpen }) {
  return (
    <li>
      <button onClick={() => onOpen(task)}>
        {icon} {task.title}
      </button>

      <StatusPill status={task.status} />
    </li>
  );
}

/**
 * Read-only view of one task, with a quick status change and links to
 * related tasks. Direct and indirect relations are listed separately.
 *
 * Props:
 *   task     – the task to show
 *   tasks    – every task (to work out its relations)
 *   onClose  – close the popup
 *   onOpen   – jump to a related task
 *   onMove   – change this task's status
 *   onEdit   – open the edit form
 *   onDelete – ask to delete this task
 */
export default function TaskDetail({ task, tasks, onClose, onOpen, onMove, onEdit, onDelete }) {
  const closeButtonRef = useRef(null);

  // Focus the close button once, when the popup opens
  useEffect(() => closeButtonRef.current?.focus(), []);

  /* ----- Relations, worked out from task.deps ----- */
  const prerequisites = directPrerequisites(task, tasks);
  const blockingTasks = blockers(task, tasks);
  const indirectUpstream = indirectPrerequisites(task, tasks);
  const unblocks = dependentsOf(task.id, tasks);
  const indirectDownstream = indirectDependents(task, tasks);

  /* ----- Display values ----- */
  const isBlocked = blockingTasks.length > 0;
  const allPrerequisitesDone = prerequisites.length > 0 && !isBlocked && task.status !== 'Done';
  const dateRange =
    task.start || task.due
      ? `${fmtDate(task.start) || '—'} → ${fmtDate(task.due) || '—'}`
      : 'Not set';

  /** Renders a list of related tasks, all using the same icon. */
  const renderItems = (list, iconFor) =>
    list.map((related) => (
      <RelatedTaskItem
        key={related.id}
        task={related}
        icon={typeof iconFor === 'function' ? iconFor(related) : iconFor}
        onOpen={onOpen}
      />
    ));

  return (
    <Modal label={`Details for ${task.title}`} className="detail" onClose={onClose}>
      {/* Header: title + close */}
      <div className="dhead">
        <h2>{task.title}</h2>

        <button
          ref={closeButtonRef}
          className="icon"
          aria-label="Close details"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Priority / state chips */}
      <div className="chips">
        <span className="pri">{task.priority}</span>

        {isBlocked && <span className="badge red">🔒 Blocked by {blockingTasks.length}</span>}
        {isOverdue(task) && <span className="badge amber">Overdue</span>}
      </div>

      {/* Why is this task blocked? Name every prerequisite that is not Done yet. */}
      {isBlocked && (
        <div className="why bad" role="status">
          <b>🔒 Blocked</b> — {blockingTasks.length} of {prerequisites.length} prerequisite
          {prerequisites.length > 1 ? 's are' : ' is'} not Done yet:
          <ul>{renderItems(blockingTasks, '⏳')}</ul>
        </div>
      )}

      {allPrerequisitesDone && (
        <p className="why ok">✓ All prerequisites are Done — this task is unblocked.</p>
      )}

      <p className="desc">{task.description || 'No description added.'}</p>

      {/* Key facts */}
      <dl className="info">
        <div>
          <dt>Assignee</dt>
          <dd>{task.assignee}</dd>
        </div>

        <div>
          <dt>
            <label htmlFor="d-status">Status</label>
          </dt>
          <dd>
            <Dropdown
              id="d-status"
              value={task.status}
              options={STATUSES}
              onChange={(status) => onMove(task.id, status)}
              // Blocked tasks cannot enter In Progress / Review / Done
              isOptionDisabled={(status) =>
                status !== task.status && Boolean(moveBlockReason(task, status, tasks))
              }
            />
          </dd>
        </div>

        <div>
          <dt>Dates</dt>
          <dd>{dateRange}</dd>
        </div>

        <div>
          <dt>Estimate</dt>
          <dd>{task.est} hours</dd>
        </div>

        <div className="wide">
          <dt>Tags</dt>
          <dd>{task.tags.length ? task.tags.map((tag) => `#${tag}`).join('  ') : 'None'}</dd>
        </div>
      </dl>

      {/* Relations: what this task waits on (left) and what waits on it (right) */}
      <div className="dcols">
        <div>
          <h3>Direct prerequisites</h3>

          {prerequisites.length ? (
            <ul>{renderItems(prerequisites, (p) => (p.status === 'Done' ? '✓' : '🔒'))}</ul>
          ) : (
            <p className="muted">None</p>
          )}

          {indirectUpstream.length > 0 && (
            <>
              <h3 className="sub">Indirect prerequisites</h3>
              <ul className="soft">{renderItems(indirectUpstream, '↳')}</ul>
            </>
          )}
        </div>

        <div>
          <h3>Unblocks (direct)</h3>

          {unblocks.length ? (
            <ul>{renderItems(unblocks, '→')}</ul>
          ) : (
            <p className="muted">Nothing depends on this</p>
          )}

          {indirectDownstream.length > 0 && (
            <>
              <h3 className="sub">Also affected (indirect)</h3>
              <ul className="soft">{renderItems(indirectDownstream, '↳')}</ul>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={onEdit}>Edit task</button>

        <button className="danger" onClick={onDelete}>
          Delete task
        </button>
      </div>
    </Modal>
  );
}
