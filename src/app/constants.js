/* =========================================================
   App-wide constants
   Single source of truth for statuses, people, routes and
   labels. Change a value here and the whole app follows.
   ========================================================= */


/* ---------- Task vocabulary ---------- */

// Board columns, in display order (left → right)
export const STATUSES = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

// Lowest → highest urgency
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// A blocked task may not be moved into these columns: work cannot start
// (or finish) until every prerequisite is Done. Backlog / To Do stay allowed.
export const STARTED_STATUSES = ['In Progress', 'Review', 'Done'];

// People a task can be assigned to
export const TEAM = ['Aarav', 'Meera', 'Kabir'];


/* ---------- Persistence ---------- */

// localStorage key. Bump the suffix if the saved data shape ever changes.
export const STORAGE_KEY = 'planboard-v2';


/* ---------- Board filters ---------- */

// The "nothing filtered" state of the board filter bar
export const NO_FILTERS = {
  q: '',
  assignee: '',
  priority: '',
  status: '',
  tag: '',
};


/* ---------- Pages (sidebar + hash routes) ---------- */

export const DEFAULT_VIEW = 'dashboard';

export const VIEWS = [
  { id: 'dashboard', label: 'Dashboard',            subtitle: 'Analytics, metrics',         icon: '▦' },
  { id: 'board',     label: 'Kanban Board',         subtitle: 'Interactive workflow',       icon: '▤' },
  { id: 'map',       label: 'Dependency Map',       subtitle: 'Task flow & blocker graph',  icon: '⌬' },
  { id: 'log',       label: 'Activity & Audit Log', subtitle: 'History feed',               icon: '☰' },
];


/* ---------- Activity log ---------- */

// Icon shown next to each kind of activity entry
export const ACTIVITY_ICONS = {
  created:    '＋',
  updated:    '✎',
  moved:      '→',
  deleted:    '🗑',
  dependency: '🔗',
  reverted:   '↶',
  redone:     '↷',
  import:     '⬆',
};

// Labels for the "Filter by event type" dropdown
export const ACTIVITY_TYPE_LABELS = {
  created:    'Created',
  updated:    'Updated',
  moved:      'Moved',
  deleted:    'Deleted',
  dependency: 'Dependency',
  reverted:   'Reverted',
  redone:     'Re-applied',
  import:     'Import',
};


/* ---------- History limits ---------- */

export const MAX_ACTIVITY_ENTRIES = 300; // activity log length kept in memory + storage
export const MAX_UNDO_STEPS = 50;        // how many changes can be undone