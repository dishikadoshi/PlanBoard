import { useMemo } from 'react';
import { getMetrics } from '../../utils/metricUtils';
import { StatusChart, WorkloadChart, DependencyImpact } from './Charts';

/**
 * One headline number tile.
 *
 * Props:
 *   label     – small caption above the number
 *   value     – the number to show
 *   tone      – colour of the number: "green" | "amber" | "red" | ""
 *   className – extra modifier class (e.g. "pct" for the progress tile)
 *   children  – anything extra inside the tile (e.g. a progress bar)
 */
function MetricCard({ label, value, tone = '', className = '', children }) {
  return (
    <div className={`stat ${tone} ${className}`}>
      <span>{label}</span>

      {/* key={value} remounts the number so it pops whenever it changes */}
      <b key={value} className="pop">
        {value}
      </b>

      {children}
    </div>
  );
}

/**
 * Dashboard page. Every number is derived from `tasks` on each change.
 */
export default function Dashboard({ tasks }) {
  const metrics = useMemo(() => getMetrics(tasks), [tasks]);

  // Pills in the "Action Required" panel: [icon, count, label, colour]
  const actionItems = [
    ['🔒', metrics.blocked, 'blocked', 'red'],
    ['⚠', metrics.overdue, 'overdue', 'amber'],
    ['●', metrics.critical, 'critical unfinished', 'crit'],
  ];

  return (
    <div className="dash">
      {/* Row 1: headline numbers */}
      <div className="stats">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Done" value={metrics.done} tone="green" />
        <MetricCard label="Overdue" value={metrics.overdue} tone="amber" />
        <MetricCard label="Blocked" value={metrics.blocked} tone="red" />

        <MetricCard label="Complete" value={`${metrics.pct}%`} className="pct">
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={metrics.pct}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Completion"
          >
            <div style={{ width: `${metrics.pct}%` }} />
          </div>
        </MetricCard>
      </div>

      {/* Row 2: three graphical analysis columns */}
      <div className="charts">
        <StatusChart rows={metrics.byStatus} total={metrics.total} />
        <WorkloadChart rows={metrics.effort} hours={metrics.hours} />
        <DependencyImpact rows={metrics.impact} />
      </div>

      {/* Row 3: what needs attention */}
      <section className="panel action">
        <h2>Action Required</h2>

        <ul>
          {actionItems.map(([icon, count, label, tone]) => (
            <li key={label} className={`${tone} ${count ? '' : 'zero'}`}>
              <i aria-hidden="true">{icon}</i>
              <b>{count}</b> {label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
