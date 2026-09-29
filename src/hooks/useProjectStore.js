import { useEffect, useMemo, useReducer } from 'react';
import { reducer, createInitialState } from '../state/projectReducer';
import * as actionCreators from '../state/projectActions';
import { loadProject, saveProject } from '../services/storageService';

/**
 * Single source of truth for the project:
 *   - reducer state (tasks, activity, undo / redo stacks)
 *   - localStorage persistence
 *   - undo / redo keyboard shortcuts
 *
 * Components receive `state` plus plain functions in `actions`;
 * they never see `dispatch`.
 */
export default function useProjectStore() {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createInitialState(loadProject())
  );

  // Persist tasks + activity after every change, so a refresh restores the project
  useEffect(() => saveProject(state), [state]);

  // Stable functions the UI can call (dispatch never changes, so neither do these)
  const actions = useMemo(
    () => ({
      save: (task) => dispatch(actionCreators.saveTask(task)),
      move: (id, status) => dispatch(actionCreators.moveTask(id, status)),
      remove: (id) => dispatch(actionCreators.deleteTask(id)),
      importTasks: (tasks) => dispatch(actionCreators.importTasks(tasks)),
      undo: () => dispatch(actionCreators.undo()),
      redo: () => dispatch(actionCreators.redo()),
    }),
    []
  );

  // Ctrl/Cmd+Z = undo · Ctrl/Cmd+Shift+Z or Ctrl+Y = redo (ignored while typing)
  useEffect(() => {
    const onKeyDown = (event) => {
      const hasModifier = event.ctrlKey || event.metaKey;
      const isTyping = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);

      if (!hasModifier || isTyping) return;

      const key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();
        event.shiftKey ? actions.redo() : actions.undo();
      }

      if (key === 'y') {
        event.preventDefault();
        actions.redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

  return { state, actions };
}
