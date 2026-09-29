/* =========================================================
   Demo data
   Loaded on the very first visit (nothing in localStorage).
   Dates are stored as "days from today", so the demo always
   looks fresh: one task is overdue and a few are blocked.
   ========================================================= */

import { dayOffset } from '../utils/dateUtils';


/* ---------- Raw demo tasks ---------- */

// `deps` lists DIRECT prerequisites only (by seed id).
// `startInDays` / `dueInDays` are relative to today.
const SEED_TASKS = [
  {
    key: 1,
    title: 'Define project scope',
    description: 'Agree goals, deliverables and what is out of scope.',
    assignee: 'Aarav',
    priority: 'High',
    status: 'Done',
    startInDays: -14,
    dueInDays: -10,
    est: 4,
    tags: ['planning'],
    deps: [],
  },
  {
    key: 2,
    title: 'Design system & tokens',
    description: 'Colours, type scale and spacing tokens for the UI.',
    assignee: 'Meera',
    priority: 'Medium',
    status: 'Done',
    startInDays: -12,
    dueInDays: -6,
    est: 10,
    tags: ['design'],
    deps: [],
  },
  {
    key: 3,
    title: 'Wireframe key screens',
    description: 'Low-fidelity layouts for the main screens.',
    assignee: 'Meera',
    priority: 'Medium',
    status: 'Review',
    startInDays: -8,
    dueInDays: -2,
    est: 8,
    tags: ['design'],
    deps: ['seed-2'],
  },
  {
    key: 4,
    title: 'Set up CI pipeline',
    description: 'Overdue on purpose for the demo.',
    assignee: 'Kabir',
    priority: 'Medium',
    status: 'In Progress',
    startInDays: -5,
    dueInDays: -1,
    est: 6,
    tags: ['devops'],
    deps: ['seed-1'],
  },
  {
    key: 5,
    title: 'Build auth flow',
    description: 'Sign-up, login, sessions and password reset.',
    assignee: 'Kabir',
    priority: 'Critical',
    status: 'In Progress',
    startInDays: -3,
    dueInDays: 4,
    est: 16,
    tags: ['backend', 'security'],
    deps: ['seed-1'],
  },
  {
    key: 6,
    title: 'Dashboard UI',
    description: 'Build the analytics dashboard from the wireframes.',
    assignee: 'Aarav',
    priority: 'High',
    status: 'To Do',
    startInDays: 0,
    dueInDays: 6,
    est: 12,
    tags: ['frontend'],
    deps: ['seed-3'],
  },
  {
    key: 7,
    title: 'Payment integration',
    description: 'Connect the payment provider and handle failures.',
    assignee: 'Kabir',
    priority: 'Critical',
    status: 'Backlog',
    startInDays: 3,
    dueInDays: 10,
    est: 20,
    tags: ['backend'],
    deps: ['seed-5'],
  },
  {
    key: 8,
    title: 'Write API docs',
    description: 'Document every public endpoint with examples.',
    assignee: 'Aarav',
    priority: 'Low',
    status: 'Backlog',
    startInDays: 5,
    dueInDays: 12,
    est: 5,
    tags: ['docs'],
    deps: ['seed-5'],
  },
  {
    key: 9,
    title: 'Accessibility audit',
    description: 'Check keyboard, contrast and screen-reader support.',
    assignee: 'Meera',
    priority: 'High',
    status: 'To Do',
    startInDays: 1,
    dueInDays: 8,
    est: 6,
    tags: ['frontend', 'a11y'],
    deps: ['seed-6'],
  },
  {
    key: 10,
    title: 'Load testing',
    description: 'Stress-test the API under expected peak traffic.',
    assignee: 'Kabir',
    priority: 'Medium',
    status: 'Backlog',
    startInDays: 6,
    dueInDays: 14,
    est: 8,
    tags: ['devops'],
    deps: ['seed-4', 'seed-7'],
  },
  {
    key: 11,
    title: 'Onboarding emails',
    description: 'Draft the welcome and onboarding email series.',
    assignee: 'Meera',
    priority: 'Low',
    status: 'To Do',
    startInDays: -1,
    dueInDays: -1,
    est: 3,
    tags: ['content'],
    deps: [],
  },
  {
    key: 12,
    title: 'Release checklist',
    description: 'Final go-live checks before release.',
    assignee: 'Aarav',
    priority: 'High',
    status: 'Backlog',
    startInDays: 10,
    dueInDays: 16,
    est: 2,
    tags: ['planning'],
    deps: ['seed-9', 'seed-10'],
  },
];


/* ---------- Public API ---------- */

/** Turns a raw seed entry into a real task (absolute dates + stable id). */
const toSeedTask = ({ key, startInDays, dueInDays, ...fields }) => ({
  id: `seed-${key}`,
  ...fields,
  start: dayOffset(startInDays),
  due: dayOffset(dueInDays),
});

/** Fresh demo tasks, with dates calculated from today. */
export const createSeedTasks = () => SEED_TASKS.map(toSeedTask);
