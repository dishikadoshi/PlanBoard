/* =========================================================
   Storage service
   Everything that touches the outside world lives here:
   localStorage, JSON export and JSON import validation.
   ========================================================= */

import { STORAGE_KEY, STATUSES, PRIORITIES, TEAM } from '../app/constants';
import { wouldCycle } from '../utils/dependencyUtils';


/* ---------- localStorage ---------- */

/**
 * Cleans tasks read from localStorage: anything malformed (edited by hand,
 * written by an older version, half-saved) is dropped instead of crashing the app.
 */
const sanitiseSavedTasks = (savedTasks) => {
  const validTasks = savedTasks.filter((task) => !findTaskProblem(task));
  const knownIds = new Set(validTasks.map((task) => task.id));

  return validTasks.map((task) => normaliseImportedTask(task, knownIds));
};

/** Returns { tasks, activity }, or null when nothing (valid) is stored yet. */
export function loadProject() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.tasks)) {
      const tasks = sanitiseSavedTasks(saved.tasks);

      // Everything stored was unusable → start again with the demo data
      if (saved.tasks.length && !tasks.length) return null;

      const activity = Array.isArray(saved.activity)
        ? saved.activity.filter((entry) => entry && typeof entry === 'object')
        : [];

      return { tasks, activity };
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

// YYYY-MM-DD, the format <input type="date"> produces
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for an empty value or a well-formed YYYY-MM-DD date. */
const isOptionalDate = (value) =>
  value === undefined || value === null || value === '' || (typeof value === 'string' && DATE_PATTERN.test(value));

/**
 * Checks ONE task (from an imported file or from saved storage).
 * Returns an error message, or null when the task is valid.
 */
const findTaskProblem = (task) => {
  if (!task || typeof task !== 'object') return 'not a task object';
  if (typeof task.id !== 'string' || !task.id) return 'missing id';
  if (typeof task.title !== 'string' || !task.title.trim()) return 'missing title';
  if (!STATUSES.includes(task.status)) return 'invalid status';
  if (!PRIORITIES.includes(task.priority)) return 'invalid priority';
  if (task.assignee !== undefined && !TEAM.includes(task.assignee)) return 'unknown assignee';
  if (!isOptionalDate(task.start) || !isOptionalDate(task.due)) return 'dates must look like YYYY-MM-DD';
  if (task.start && task.due && task.due < task.start) return 'due date is before start date';
  if (!(Number(task.est ?? 0) >= 0)) return 'negative estimate';
  if (task.tags !== undefined && !(Array.isArray(task.tags) && task.tags.every((tag) => typeof tag === 'string'))) {
    return 'tags must be a list of text';
  }
  if (task.deps !== undefined && !Array.isArray(task.deps)) return 'deps must be a list of ids';

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
  description: typeof task.description === 'string' ? task.description : '',
  start: task.start || '',
  due: task.due || '',
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
  if (fileIds.size !== list.length) return { error: 'The file contains duplicate task ids.' };

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