import { useState } from 'react';

/**
 * State + handlers for the three task popups:
 *   - the edit / create form
 *   - the read-only details panel
 *   - the delete confirmation
 *
 * Keeping this here means App only has to wire props together.
 *
 * `editing` is null (closed), 'new' (blank form) or the task being edited.
 */
export default function useTaskDialogs(tasks, actions) {
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null); // task open in the details panel
  const [deleting, setDeleting] = useState(null); // task waiting for delete confirmation

  // Look the task up by id so the panel always shows fresh data
  const detailTask = detailId ? tasks.find((task) => task.id === detailId) : null;


  /* ----- Details panel ----- */

  const openDetail = (task) => setDetailId(task.id);
  const closeDetail = () => setDetailId(null);


  /* ----- Create / edit form ----- */

  const startNewTask = () => setEditing('new');
  const closeForm = () => setEditing(null);

  // Editing replaces the details panel with the form
  const startEditingDetailTask = () => {
    setDetailId(null);
    setEditing(detailTask);
  };

  const saveAndClose = (task) => {
    actions.save(task);
    setEditing(null);
  };


  /* ----- Delete confirmation ----- */

  const askToDeleteDetailTask = () => setDeleting(detailTask);
  const cancelDelete = () => setDeleting(null);

  const confirmDelete = () => {
    // The reducer also strips the id from every other task's prerequisites
    actions.remove(deleting.id);
    setDeleting(null);
    setDetailId(null);
  };


  return {
    editing,
    detailTask,
    deleting,

    openDetail,
    closeDetail,
    startNewTask,
    closeForm,
    startEditingDetailTask,
    saveAndClose,
    askToDeleteDetailTask,
    cancelDelete,
    confirmDelete,
  };
}
