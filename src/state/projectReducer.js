/* =========================================================
   Project reducer
   Owns the whole project state:

     {
       tasks:    [...]                current tasks
       activity: [...]                newest-first audit log
       past:     [{ tasks, entries }] undo stack
       future:   [{ tasks, entries }] redo stack
     }

   Every change goes through commit(), which records the
   activity entry AND the undo snapshot in one place.
   ========================================================= */

import { wouldCycle, withoutTask, moveBlockReason, saveBlockReason } from '../utils/dependencyUtils';
import { createSeedTasks } from '../data/seedData';
import { MAX_ACTIVITY_ENTRIES, MAX_UNDO_STEPS } from '../app/constants';
import { ACTION_TYPES } from './projectActions';
import {
  dependencyAddedEntry,
  dependencyRemovedEntry,
  fieldsUpdatedEntry,
  importedEntry,
  reappliedEntries,
  revertedEntries,
  statusChangedEntry,
  taskCreatedEntry,
  taskDeletedEntry,
  workspaceCreatedEntry,
} from './activityLog';


/* ---------- Shared helpers ---------- */

/**
 * The single path every change takes.
 * Stores the new tasks, prepends the log entries, pushes an undo snapshot
 * (keeping the entries so undo / redo can describe what they do)
 * and clears the redo stack.
 */
const commit = (state, tasks, entries) => ({
  tasks,
  activity: [...entries, ...state.activity].slice(0, MAX_ACTIVITY_ENTRIES),
  past: [...state.past, { tasks: state.tasks, entries }].slice(-MAX_UNDO_STEPS),
  future: [],
});

/** Task fields that differ between two versions (status and deps are logged separately). */
const changedFields = (before, after) =>
  Object.keys(after).filter(
    (key) =>
      !['deps', 'status'].includes(key) &&
      JSON.stringify(after[key]) !== JSON.stringify(before[key])
  );

/**
 * Defensive clean-up of a task's prerequisites:
 * no duplicates, no self link, no unknown ids.
 */
const cleanDeps = (task, tasks) =>
  [...new Set(task.deps)].filter(
    (depId) => depId !== task.id && tasks.some((other) => other.id === depId)
  );


/* ---------- Action handlers ---------- */

/** New task: one "created" entry plus one entry per prerequisite. */
function createTask(state, task) {
  const entries = [
    taskCreatedEntry(task),
    ...task.deps.map((depId) => dependencyAddedEntry(task, state.tasks, depId)),
  ];

  return commit(state, [...state.tasks, task], entries);
}

/** Existing task: log only what actually changed. */
function updateTask(state, before, after) {
  const entries = [];

  const fields = changedFields(before, after);
  if (fields.length) entries.push(fieldsUpdatedEntry(after, fields));

  if (after.status !== before.status) {
    entries.push(statusChangedEntry(after, before.status, after.status));
  }

  after.deps
    .filter((depId) => !before.deps.includes(depId))
    .forEach((depId) => entries.push(dependencyAddedEntry(after, state.tasks, depId)));

  before.deps
    .filter((depId) => !after.deps.includes(depId))
    .forEach((depId) => entries.push(dependencyRemovedEntry(after, state.tasks, depId)));

  // Nothing changed: keep the same state so React does not re-render
  if (!entries.length) return state;

  const tasks = state.tasks.map((task) => (task.id === after.id ? after : task));

  return commit(state, tasks, entries);
}

function handleSave(state, { task: submitted }) {
  const deps = cleanDeps(submitted, state.tasks);

  // Safety net: the form already blocks cycles, but never trust the caller
  if (wouldCycle(state.tasks, submitted.id, deps)) return state;

  const task = { ...submitted, deps };
  const existing = state.tasks.find((other) => other.id === task.id);

  // Safety net: a blocked task cannot be started or finished
  if (saveBlockReason(existing, task, state.tasks)) return state;

  return existing ? updateTask(state, existing, task) : createTask(state, task);
}

function handleMove(state, { id, status }) {
  const task = state.tasks.find((other) => other.id === id);
  if (!task || task.status === status) return state;

  // Blocked tasks cannot enter In Progress / Review / Done
  if (moveBlockReason(task, status, state.tasks)) return state;

  const tasks = state.tasks.map((other) =>
    other.id === id ? { ...other, status } : other
  );

  return commit(state, tasks, [statusChangedEntry(task, task.status, status)]);
}

function handleDelete(state, { id }) {
  const task = state.tasks.find((other) => other.id === id);
  if (!task) return state;

  // Also strips the deleted id from everyone's prerequisites (no stale links)
  return commit(state, withoutTask(state.tasks, id), [taskDeletedEntry(task)]);
}

function handleImport(state, { tasks }) {
  return commit(state, tasks, [importedEntry(tasks.length)]);
}

/** Step back: restore the last snapshot and keep it on the redo stack. */
function handleUndo(state) {
  const previous = state.past.at(-1);
  if (!previous) return state;

  return {
    tasks: previous.tasks,
    past: state.past.slice(0, -1),
    future: [{ tasks: state.tasks, entries: previous.entries }, ...state.future],
    activity: [...revertedEntries(previous.entries), ...state.activity],
  };
}

/** Step forward: re-apply the snapshot that was undone. */
function handleRedo(state) {
  const next = state.future[0];
  if (!next) return state;

  return {
    tasks: next.tasks,
    future: state.future.slice(1),
    past: [...state.past, { tasks: state.tasks, entries: next.entries }],
    activity: [...reappliedEntries(next.entries), ...state.activity],
  };
}


/* ---------- Public API ---------- */

export function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SAVE:
      return handleSave(state, action);

    case ACTION_TYPES.MOVE:
      return handleMove(state, action);

    case ACTION_TYPES.DELETE:
      return handleDelete(state, action);

    case ACTION_TYPES.IMPORT:
      return handleImport(state, action);

    case ACTION_TYPES.UNDO:
      return handleUndo(state);

    case ACTION_TYPES.REDO:
      return handleRedo(state);

    default:
      return state;
  }
}

/**
 * Starting state.
 * `saved` comes from localStorage (or null on the first visit → demo data).
 * Undo / redo history is never persisted, so it always starts empty.
 */
export const createInitialState = (saved) =>
  saved
    ? { ...saved, past: [], future: [] }
    : {
        tasks: createSeedTasks(),
        activity: [workspaceCreatedEntry()],
        past: [],
        future: [],
      };