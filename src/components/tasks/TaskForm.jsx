import { useEffect, useRef, useState } from 'react';
import { STATUSES, PRIORITIES, TEAM } from '../../app/constants';
import { blankForm, toForm, toTask, validateTask } from '../../utils/taskUtils';
import { newId } from '../../utils/idUtils';
import { saveBlockReason } from '../../utils/dependencyUtils';
import Modal from '../common/Modal';
import { Field, SelectField } from '../common/FormFields';
import DependencySelector from './DependencySelector';

/**
 * Popup form for creating or editing a task.
 *
 * Props:
 *   task    – task being edited, or null to create a new one
 *   tasks   – every task (for the dependency picker + cycle checks)
 *   onSave  – receives the finished task object
 *   onClose – dismiss without saving
 */
export default function TaskForm({ task, tasks, onSave, onClose }) {
  const isEditing = Boolean(task);

  const [form, setForm] = useState(isEditing ? toForm(task) : blankForm);
  const [errors, setErrors] = useState({});
  const titleInputRef = useRef(null);

  // Put the cursor in the title field when the popup opens
  useEffect(() => titleInputRef.current?.focus(), []);

  // Builds a change handler that updates just one form field
  const updateField = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  // Is the task allowed to take this status with the prerequisites ticked right now?
  const statusIsLocked = (status) =>
    Boolean(
      saveBlockReason(
        task,
        { id: task?.id, title: form.title, status, deps: form.deps },
        tasks
      )
    );

  const handleSubmit = (event) => {
    event.preventDefault();

    // New tasks get a fresh id; edited tasks keep theirs
    const id = task?.id || newId();

    const validationErrors = validateTask(form, id, tasks);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    onSave(toTask(form, id));
  };

  return (
    <Modal label={isEditing ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <h2>{isEditing ? 'Edit task' : 'New task'}</h2>

        {/* ----- Basics ----- */}
        <Field label="Title *" error={errors.title}>
          <input
            ref={titleInputRef}
            value={form.title}
            onChange={updateField('title')}
            aria-required="true"
            aria-invalid={!!errors.title}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows="2"
            value={form.description}
            onChange={updateField('description')}
          />
        </Field>

        {/* ----- Details ----- */}
        <div className="grid">
          <SelectField label="Assignee" options={TEAM} value={form.assignee} onChange={updateField('assignee')} />
          <SelectField label="Priority" options={PRIORITIES} value={form.priority} onChange={updateField('priority')} />
          <SelectField
            label="Status"
            options={STATUSES}
            value={form.status}
            onChange={updateField('status')}
            error={errors.status}
            isOptionDisabled={statusIsLocked}
          />

          <Field label="Estimated hours" error={errors.est}>
            <input
              type="number"
              step="0.5"
              value={form.est}
              onChange={updateField('est')}
              aria-invalid={!!errors.est}
            />
          </Field>

          <Field label="Start date">
            <input type="date" value={form.start} onChange={updateField('start')} />
          </Field>

          <Field label="Due date" error={errors.due}>
            <input
              type="date"
              value={form.due}
              onChange={updateField('due')}
              aria-invalid={!!errors.due}
            />
          </Field>
        </div>

        <Field label="Tags (comma separated)">
          <input
            value={form.tags}
            onChange={updateField('tags')}
            placeholder="e.g. backend, security"
          />
        </Field>

        {/* ----- Prerequisites ----- */}
        <DependencySelector
          tasks={tasks}
          selfId={task?.id}
          status={form.status}
          value={form.deps}
          onChange={(deps) => setForm({ ...form, deps })}
          error={errors.deps}
        />

        {/* ----- Buttons ----- */}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="primary">
            {isEditing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}