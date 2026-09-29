/* =========================================================
   Storage service
   Everything that touches the outside world lives here:
   localStorage, JSON export and JSON import validation.
   ========================================================= */

import { STORAGE_KEY, STATUSES, PRIORITIES, TEAM } from '../app/constants';
import { wouldCycle } from '../utils/dependencyUtils';


/* ---------- localStorage ---------- */

/** Returns { tasks, activity }, or null when nothing (valid) is stored yet. */
export function loadProject() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.tasks)) {
      return { tasks: saved.tasks, activity: saved.activity || [] };
    }
  } catch {
    // Corrupted storage → fall back to the demo data
  }

  return null;
}

/** Saves tasks + activity. Failures (storage full / blocked) are ignored. */
export const saveProject = ({ tasks, activity }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, activity }));
  } catch {
    // Storage full or blocked: the app keeps working, it just won't persist
  }
};


/* ---------- JSON export ---------- */

/** Downloads the tasks as "planboard.json". */
export const exportProject = (tasks) => {
  const json = JSON.stringify({ tasks }, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));

  // Click a temporary <a download> link to start the download
  Object.assign(document.createElement('a'), {
    href: url,
    download: 'planboard.json',
  }).click();

  URL.revokeObjectURL(url);
};


/* ---------- JSON import validation ---------- */

/**
 * Checks ONE imported task.
 * Returns an error message, or null when the task is valid.
 */
const findTaskProblem = (task) => {
  if (!task || typeof task.id !== 'string') return 'missing id';
  if (typeof task.title !== 'string' || !task.title.trim()) return 'missing title';
  if (!STATUSES.includes(task.status)) return 'invalid status';
  if (!PRIORITIES.includes(task.priority)) return 'invalid priority';
  if (task.start && task.due && task.due < task.start) return 'due date is before start date';
  if (!(Number(task.est ?? 0) >= 0)) return 'negative estimate';

  return null;
};

/**
 * Fills in defaults and cleans a valid imported task.
 * Unknown dependency ids and self links are dropped.
 */
const normaliseImportedTask = (task, knownIds) => ({
  description: '',
  assignee: TEAM[0],
  start: '',
  due: '',
  ...task,
  est: Number(task.est ?? 0),
  tags: Array.isArray(task.tags) ? task.tags : [],
  deps: [...new Set(Array.isArray(task.deps) ? task.deps : [])].filter(
    (depId) => knownIds.has(depId) && depId !== task.id
  ),
});

/**
 * Merges the file into the tasks already on the board (`existing`):
 *   - same id          → the file's version replaces it
 *   - new id           → added
 *   - not in the file  → kept untouched, so nothing you created disappears
 *
 * Returns { tasks, added, updated, kept } or { error }.
 * Rejects malformed data and circular dependencies.
 */
export function validateImport(raw, existing = []) {
  // 1. Parse
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return { error: 'File is not valid JSON.' };
  }

  const list = Array.isArray(data) ? data : data?.tasks;
  if (!Array.isArray(list)) return { error: 'Expected an array of tasks.' };

  // 2. Links to tasks already on the board are fine, so both id sets are "known"
  const fileIds = new Set(list.map((task) => task?.id));
  const knownIds = new Set([...fileIds, ...existing.map((task) => task.id)]);

  // 3. Validate + clean every task, stopping at the first problem
  const importedTasks = [];

  for (const [index, task] of list.entries()) {
    const problem = findTaskProblem(task);
    if (problem) return { error: `Task #${index + 1}: ${problem}` };

    importedTasks.push(normaliseImportedTask(task, knownIds));
  }

  // 4. Merge with the current board
  const keptTasks = existing.filter((task) => !fileIds.has(task.id));
  const merged = [...keptTasks, ...importedTasks];

  // 5. The merged result must not contain circular dependencies
  for (const task of merged) {
    if (wouldCycle(merged, task.id, task.deps)) {
      return { error: `Circular dependency involving “${task.title}”.` };
    }
  }

  const updated = importedTasks.filter((task) =>
    existing.some((current) => current.id === task.id)
  ).length;

  return {
    tasks: merged,
    added: importedTasks.length - updated,
    updated,
    kept: keptTasks.length,
  };
}
