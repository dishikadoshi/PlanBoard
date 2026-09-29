import { useMemo, useState } from 'react';
import { ACTIVITY_TYPE_LABELS } from '../../app/constants';
import { normaliseEntry, filterActivity, groupByDay } from '../../utils/activityUtils';
import ActivityItem from './ActivityItem';

/**
 * Activity & Audit Log page: search + type filter, entries grouped by day.
 * Carries its own header inside its card (App skips the shared PageHeader).
 *
 * Props:
 *   activity – newest-first list of log entries
 */
export default function ActivityLog({ activity }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');

  const entries = useMemo(() => activity.map(normaliseEntry), [activity]);
  const shown = filterActivity(entries, { type, query });
  const entriesByDay = groupByDay(shown);

  return (
    <section className="panel feed">
      {/* Header: title + event count */}
      <div className="fhead">
        <div>
          <h1>Activity &amp; Audit Log</h1>
          <p>Track changes, dependencies and project history</p>
        </div>

        <span className="count" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Toolbar: search + type filter */}
      <div className="ftool">
        <input
          type="search"
          aria-label="Search activity"
          placeholder="Search activity…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          aria-label="Filter by event type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">All types</option>

          {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {!shown.length && <p className="muted">No events match your search.</p>}

      {/* Scrollable list, one section per day */}
      <div className="days" tabIndex={0} aria-label="Activity events">
        {Object.entries(entriesByDay).map(([dayHeading, dayEntries]) => (
          <div key={dayHeading}>
            <h2>{dayHeading}</h2>

            <ol>
              {dayEntries.map((entry, index) => (
                <ActivityItem key={entry.id} entry={entry} index={index} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
