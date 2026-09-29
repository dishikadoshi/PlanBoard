/* =========================================================
   Dashboard charts
   Plain SVG / CSS, no charting library.
   Every chart receives `rows`: [{ label, value, cls }]
   where `cls` is the status colour class (s0 … s4).
   ========================================================= */


/* ---------- Donut (used by StatusChart) ---------- */

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Donut chart: one arc per status, sized by its share of all tasks.
 * Each arc is a circle whose dash pattern shows only its slice.
 */
function Donut({ rows, total }) {
  // How much of the circle earlier arcs already use up
  let usedLength = 0;

  const description = rows.map((row) => `${row.label}: ${row.value}`).join(', ');

  return (
    <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={description}>
      {/* Grey track behind the arcs */}
      <circle className="ring" cx="60" cy="60" r={DONUT_RADIUS} />

      {rows.map((row) => {
        const arcLength = total ? (row.value / total) * DONUT_CIRCUMFERENCE : 0;

        const arc = arcLength > 0 && (
          <circle
            key={row.label}
            className={`seg ${row.cls}`}
            cx="60"
            cy="60"
            r={DONUT_RADIUS}
            transform="rotate(-90 60 60)"
            strokeDasharray={`${arcLength} ${DONUT_CIRCUMFERENCE - arcLength}`}
            strokeDashoffset={-usedLength}
          />
        );

        usedLength += arcLength;
        return arc;
      })}

      {/* Centre label */}
      <text className="dn" x="60" y="61" textAnchor="middle">
        {total}
      </text>
      <text className="dl" x="60" y="77" textAnchor="middle">
        tasks
      </text>
    </svg>
  );
}


/* ---------- Charts ---------- */

/** "Tasks by Status": donut + legend. */
export function StatusChart({ rows, total }) {
  return (
    <section className="panel">
      <h2>Tasks by Status</h2>

      <div className="donutwrap">
        <Donut rows={rows} total={total} />

        <ul className="legend">
          {rows.map((row) => (
            <li key={row.label}>
              <i className={row.cls} />
              <span>{row.label}</span>
              <b>{row.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "Estimated Effort by Status": hours per status as vertical bars. */
export function WorkloadChart({ rows, hours }) {
  // Tallest bar = 100% height (never divide by zero)
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  const description = rows.map((row) => `${row.label}: ${row.value} hours`).join(', ');

  return (
    <section className="panel">
      <h2>
        Estimated Effort by Status <small>{hours}h total</small>
      </h2>

      <div className="vbars" role="img" aria-label={description}>
        {rows.map((row) => (
          <div key={row.label}>
            <i className={row.cls} style={{ height: `${(row.value / maxValue) * 100}%` }} />
            <b>{row.value}h</b>
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** "Dependency Impact": which unfinished tasks hold the most other work back. */
export function DependencyImpact({ rows }) {
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="panel">
      <h2>
        Dependency Impact <small>tasks waiting</small>
      </h2>

      {rows.length ? (
        <ul className="hbars wide">
          {rows.map((row) => (
            <li key={row.label}>
              <span title={row.label}>{row.label}</span>

              <div>
                <i className="v-acc" style={{ width: `${(row.value / maxValue) * 100}%` }} />
              </div>

              <b>{row.value}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No unfinished task is holding other work back.</p>
      )}
    </section>
  );
}
