/* =========================================================
   Activity log entries
   Builds the human-readable entries shown on the Activity
   page. The reducer decides WHAT happened; this file decides
   how it is worded.
   ========================================================= */

const ARROW = ' → ';

// Words used when an undo / redo describes the change it reverts
const CHANGE_NOUNS = {
  created: 'task creation',
  updated: 'task update',
  moved: 'status change',
  deleted: 'task deletion',
  dependency: 'dependency change',
  import: 'import',
};


/* ---------- Building blocks ---------- */

/**
 * One structured entry per event.
 *   type   – picks the icon and the filter category
 *   title  – what it happened to (usually the task title)
 *   text   – short headline, e.g. "Status changed"
 *   detail – extra line, e.g. "To Do → In Progress"
 */
export const createLogEntry = (type, title, text, detail = '') => ({
  id: crypto.randomUUID(),
  at: new Date().toISOString(),
  type,
  title,
  text,
  detail,
});

/** Title of a task by id, or a friendly fallback if it no longer exists. */
const titleOf = (tasks, id) =>
  tasks.find((task) => task.id === id)?.title ?? 'a removed task';

/** "A → B" becomes "B → A" (used to describe an undone change). */
const flipArrow = (detail) =>
  detail.includes(ARROW) ? detail.split(ARROW).reverse().join(ARROW) : detail;


/* ---------- Task events ---------- */

export const taskCreatedEntry = (task) =>
  createLogEntry('created', task.title, 'Task created', `Assigned to ${task.assignee}`);

export const taskDeletedEntry = (task) =>
  createLogEntry('deleted', task.title, 'Task deleted');

export const statusChangedEntry = (task, fromStatus, toStatus) =>
  createLogEntry('moved', task.title, 'Status changed', `${fromStatus}${ARROW}${toStatus}`);

export const fieldsUpdatedEntry = (task, changedFields) =>
  createLogEntry('updated', task.title, 'Task updated', `Changed ${changedFields.join(', ')}`);

export const importedEntry = (taskCount) =>
  createLogEntry('import', 'Project', 'Imported from JSON', `${taskCount} tasks`);

export const workspaceCreatedEntry = () =>
  createLogEntry('created', 'Workspace', 'Workspace created', 'Demo data loaded');


/* ---------- Dependency events ---------- */

export const dependencyAddedEntry = (task, allTasks, depId) =>
  createLogEntry(
    'dependency',
    task.title,
    'Dependency added',
    `Depends on “${titleOf(allTasks, depId)}”`
  );

export const dependencyRemovedEntry = (task, allTasks, depId) =>
  createLogEntry(
    'dependency',
    task.title,
    'Dependency removed',
    `No longer depends on “${titleOf(allTasks, depId)}”`
  );


/* ---------- Undo / redo ---------- */

/** Entries describing that `entries` were undone. */
export const revertedEntries = (entries) =>
  entries.map((entry) =>
    createLogEntry(
      'reverted',
      entry.title,
      `Reverted ${CHANGE_NOUNS[entry.type] || 'change'}`,
      flipArrow(entry.detail)
    )
  );

/** Entries describing that `entries` were re-applied. */
export const reappliedEntries = (entries) =>
  entries.map((entry) =>
    createLogEntry(
      'redone',
      entry.title,
      `Re-applied ${CHANGE_NOUNS[entry.type] || 'change'}`,
      entry.detail
    )
  );
