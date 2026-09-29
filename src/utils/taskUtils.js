/* =========================================================
   Task helpers
   Overdue rule, form <-> task conversion, validation and
   board filtering. All pure functions: no React in here.
   ========================================================= */

import { TEAM, NO_FILTERS } from '../app/constants';
import { dayOffset } from './dateUtils';
import { wouldCycle } from './dependencyUtils';


/* ---------- Derived state ---------- */

/** Overdue = unfinished with a due date strictly before today. */
export const isOverdue = (task) =>
  task.status !== 'Done' && !!task.due && task.due < dayOffset(0);


/* ---------- Form helpers ---------- */

/** Values shown in an empty "New task" form. */
export const blankForm = {
  title: '',
  description: '',
  assignee: TEAM[0],
  priority: 'Medium',
  status: 'To Do',
  start: '',
  due: '',
  est: '',
  tags: '',
  deps: [],
};

/** "backend, security" → ['backend', 'security'] */
const parseTags = (text) =>
  text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

/** Task → form values (inputs work with strings). */
export const toForm = (task) => ({
  ...task,
  est: String(task.est),
  tags: task.tags.join(', '),
});

/** Form values → clean task object ready to be saved. */
export const toTask = (form, id) => ({
  ...form,
  id,
  est: form.est === '' ? 0 : Number(form.est),
  title: form.title.trim(),
  description: form.description.trim(),
  tags: parseTags(form.tags),
  deps: [...new Set(form.deps)],
});

/**
 * Checks the form. Returns { fieldName: message }.
 * An empty object means the form is valid.
 */
export function validateTask(form, id, tasks) {
  const errors = {};
  const estimate = form.est === '' ? 0 : Number(form.est);

  if (!form.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!parseTags(form.tags).length) {
    errors.tags = 'Add at least one tag.';
  }

  if (form.start && form.due && form.due < form.start) {
    errors.due = 'Due date cannot be before the start date.';
  }

  if (Number.isNaN(estimate) || estimate < 0) {
    errors.est = 'Estimate must be 0 or more.';
  }

  if (form.deps.includes(id)) {
    errors.deps = 'A task cannot depend on itself.';
  } else if (wouldCycle(tasks, id, form.deps)) {
    errors.deps = 'Those links would create a circular dependency.';
  }

  return errors;
}


/* ---------- Board filters ---------- */

/** Every active criterion must match (AND). */
export const filterTasks = (tasks, filters) => {
  const searchText = filters.q.trim().toLowerCase();

  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchText) &&
      (!filters.assignee || task.assignee === filters.assignee) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.status || task.status === filters.status) &&
      (!filters.tag || task.tags.includes(filters.tag))
  );
};

/** Every distinct tag in use, alphabetically (feeds the Tag dropdown). */
export const allTags = (tasks) =>
  [...new Set(tasks.flatMap((task) => task.tags))].sort();

/** True when at least one filter differs from the "no filters" state. */
export const isFiltering = (filters) =>
  JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);
