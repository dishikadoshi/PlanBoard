import { STATUSES } from '../../app/constants';

/**
 * Centered placeholder message for empty lists.
 * `tight` reduces the padding for use inside toolbars / boards.
 */
export function EmptyState({ tight = false, children }) {
  return <div className={`empty ${tight ? 'tight' : ''}`}>{children}</div>;
}

/**
 * Small coloured dot + status name, e.g. "● In Progress".
 * The dot colour comes from the status position (class s0 … s4).
 */
export function StatusPill({ status }) {
  return (
    <span className="spill">
      <i className={`s${STATUSES.indexOf(status)}`} aria-hidden="true" />
      {status}
    </span>
  );
}
