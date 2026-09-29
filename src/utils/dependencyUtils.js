/* =========================================================
   Dependency helpers
   Everything about prerequisites lives here.

   `task.deps` holds DIRECT prerequisites only. Indirect ones
   are always derived by walking the graph, never stored.
   ========================================================= */


/* ---------- Lookup ---------- */

/** id → task, for fast lookups. */
const indexById = (tasks) => new Map(tasks.map((task) => [task.id, task]));

/** The task objects listed in `task.deps` (unknown ids are skipped). */
export const directPrerequisites = (task, tasks) => {
  const byId = indexById(tasks);

  return task.deps.map((id) => byId.get(id)).filter(Boolean);
};

/** Tasks that list `id` as a direct prerequisite. */
export const dependentsOf = (id, tasks) =>
  tasks.filter((task) => task.deps.includes(id));


/* ---------- Graph walking ---------- */

/**
 * Walks the graph in one direction and returns every id reached.
 * `getNext(id)` says which ids to visit from a given id.
 * Safe even if a cycle sneaks in (visited ids are never revisited).
 */
const collectReachable = (startId, getNext) => {
  const visited = new Set();
  const stack = [startId];

  while (stack.length) {
    for (const nextId of getNext(stack.pop())) {
      if (visited.has(nextId)) continue;

      visited.add(nextId);
      stack.push(nextId);
    }
  }

  return visited;
};

/** Every prerequisite of `id`, direct and indirect (as a Set of ids). */
export const allPrerequisiteIds = (id, tasks) => {
  const byId = indexById(tasks);

  return collectReachable(id, (currentId) => byId.get(currentId)?.deps ?? []);
};

/** Every task waiting on `id`, directly or indirectly (as a Set of ids). */
export const allDependentIds = (id, tasks) =>
  collectReachable(id, (currentId) =>
    dependentsOf(currentId, tasks).map((task) => task.id)
  );

/** Prerequisites reached only through other tasks (not listed in task.deps). */
export const indirectPrerequisites = (task, tasks) => {
  const allIds = allPrerequisiteIds(task.id, tasks);

  return tasks.filter(
    (other) =>
      allIds.has(other.id) &&
      !task.deps.includes(other.id) &&
      other.id !== task.id
  );
};

/** Tasks further down the chain that only wait on `task` through someone else. */
export const indirectDependents = (task, tasks) => {
  const allIds = allDependentIds(task.id, tasks);

  return tasks.filter(
    (other) =>
      allIds.has(other.id) &&
      !other.deps.includes(task.id) &&
      other.id !== task.id
  );
};


/* ---------- Blocked state ---------- */

/**
 * The unfinished direct prerequisites currently holding a task back.
 * A task with deps [C, E] stays blocked until BOTH are Done.
 * A Done task is never "blocked".
 */
export const blockers = (task, tasks) =>
  task.status === 'Done'
    ? []
    : directPrerequisites(task, tasks).filter((prereq) => prereq.status !== 'Done');

export const isBlocked = (task, tasks) => blockers(task, tasks).length > 0;


/* ---------- Integrity rules ---------- */

/**
 * Would giving task `id` these prerequisites create a loop?
 * A loop exists if walking up from any new prerequisite reaches `id` again.
 */
export const wouldCycle = (tasks, id, deps) => {
  const byId = indexById(tasks);
  const visited = new Set();

  const reachesTarget = (currentId) => {
    if (currentId === id) return true;
    if (visited.has(currentId)) return false;

    visited.add(currentId);

    return (byId.get(currentId)?.deps || []).some(reachesTarget);
  };

  return deps.some(reachesTarget);
};

/** Removes a task and strips its id from everyone's prerequisites (no stale links). */
export const withoutTask = (tasks, id) =>
  tasks
    .filter((task) => task.id !== id)
    .map((task) => ({ ...task, deps: task.deps.filter((depId) => depId !== id) }));


/* ---------- Map layout ---------- */

/**
 * Groups tasks into phases for the dependency map.
 * A task's phase is the longest chain of prerequisites above it
 * (0 = no prerequisites). Built purely from task.deps.
 *
 * Returns:
 *   phases  → array of arrays of tasks (one array per phase)
 *   phaseOf → Map of task id → phase number
 */
export const buildPhases = (tasks) => {
  const byId = indexById(tasks);
  const depthCache = {};

  const depthOf = (task, visiting = new Set()) => {
    if (depthCache[task.id] !== undefined) return depthCache[task.id];

    // Safety net only: cycles are rejected before they reach the graph
    if (visiting.has(task.id)) return 0;
    visiting.add(task.id);

    const parents = task.deps.map((id) => byId.get(id)).filter(Boolean);

    depthCache[task.id] = parents.length
      ? 1 + Math.max(...parents.map((parent) => depthOf(parent, visiting)))
      : 0;

    return depthCache[task.id];
  };

  const phases = [];
  const phaseOf = new Map();

  tasks.forEach((task) => {
    const phase = depthOf(task);

    (phases[phase] ??= []).push(task);
    phaseOf.set(task.id, phase);
  });

  return { phases, phaseOf };
};
