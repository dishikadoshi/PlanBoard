/* =========================================================
   Project actions
   Action creators: components never build action objects
   by hand, they call these functions instead.
   ========================================================= */

/** Every action the project reducer understands. */
export const ACTION_TYPES = {
  SAVE: 'save',
  MOVE: 'move',
  DELETE: 'delete',
  IMPORT: 'import',
  UNDO: 'undo',
  REDO: 'redo',
};


/* ---------- Task changes ---------- */

/** Create a new task, or update an existing one (matched by id). */
export const saveTask = (task) => ({ type: ACTION_TYPES.SAVE, task });

/** Move a task to another status column. */
export const moveTask = (id, status) => ({ type: ACTION_TYPES.MOVE, id, status });

/** Delete a task (and unlink it from every task that depends on it). */
export const deleteTask = (id) => ({ type: ACTION_TYPES.DELETE, id });

/** Replace the board with a validated, merged list of tasks. */
export const importTasks = (tasks) => ({ type: ACTION_TYPES.IMPORT, tasks });


/* ---------- History ---------- */

export const undo = () => ({ type: ACTION_TYPES.UNDO });
export const redo = () => ({ type: ACTION_TYPES.REDO });
