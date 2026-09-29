/* =========================================================
   Dashboard metrics
   Every number on the dashboard is derived from the current
   tasks on each render, so nothing can go stale.
   ========================================================= */

import { STATUSES } from '../app/constants';
import { isOverdue } from './taskUtils';
import { isBlocked, allDependentIds } from './dependencyUtils';

const TOP_IMPACT_ROWS = 5;


/** How many unfinished tasks are (directly or indirectly) waiting on `id`. */
const countUnfinishedWaitingOn = (id, tasks) =>
  [...allDependentIds(id, tasks)].filter(
    (dependentId) => tasks.find((task) => task.id === dependentId)?.status !== 'Done'
  ).length;

/** Total estimated hours of the given tasks. */
const sumEstimates = (tasks) =>
  tasks.reduce((hours, task) => hours + (Number(task.est) || 0), 0);


/**
 * All dashboard numbers in one place.
 *
 * `cls` on chart rows ("s0" … "s4") is the CSS class that gives the
 * row its status colour.
 */
export function getMetrics(tasks) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'Done').length;

  // One row per status: how many tasks
  const byStatus = STATUSES.map((status, index) => ({
    label: status,
    value: tasks.filter((task) => task.status === status).length,
    cls: `s${index}`,
  }));

  // One row per status: how many estimated hours
  const effort = STATUSES.map((status, index) => ({
    label: status,
    value: sumEstimates(tasks.filter((task) => task.status === status)),
    cls: `s${index}`,
  }));

  // Dependency impact: which unfinished tasks hold the most other work back
  const impact = tasks
    .filter((task) => task.status !== 'Done')
    .map((task) => ({
      label: task.title,
      value: countUnfinishedWaitingOn(task.id, tasks),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_IMPACT_ROWS);

  return {
    total,
    done,
    overdue: tasks.filter(isOverdue).length,
    blocked: tasks.filter((task) => isBlocked(task, tasks)).length,
    critical: tasks.filter(
      (task) => task.priority === 'Critical' && task.status !== 'Done'
    ).length,
    pct: total ? Math.round((done / total) * 100) : 0, // empty project → 0%
    byStatus,
    effort,
    hours: effort.reduce((sum, row) => sum + row.value, 0),
    impact,
  };
}
