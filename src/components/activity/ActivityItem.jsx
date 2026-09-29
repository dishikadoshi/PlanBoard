import { ACTIVITY_ICONS } from '../../app/constants';
import { fmtClock } from '../../utils/dateUtils';
import { formatDetail } from '../../utils/activityUtils';

/** Max number of items that get a staggered entrance delay */
const MAX_STAGGERED_ITEMS = 10;
const STAGGER_MS = 30;

/**
 * One row of the activity feed: icon, title / description, time.
 *
 * Props:
 *   entry – { type, title, text, detail, at }
 *   index – position inside its day group (drives the entrance animation)
 */
export default function ActivityItem({ entry, index }) {
  return (
    <li style={{ animationDelay: `${Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_MS}ms` }}>
      <i aria-hidden="true">{ACTIVITY_ICONS[entry.type] || '•'}</i>

      <div>
        <b>{entry.title}</b>

        {entry.text && <p>{entry.text}</p>}
        {entry.detail && <p className="det">{formatDetail(entry.detail)}</p>}
      </div>

      <time dateTime={entry.at}>{fmtClock(entry.at)}</time>
    </li>
  );
}
