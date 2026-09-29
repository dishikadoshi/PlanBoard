import { useEffect, useRef } from 'react';
import Modal from './Modal';

/**
 * "Are you sure?" popup for destructive actions.
 *
 * Props:
 *   title, message – what the user is being asked
 *   confirmLabel   – text of the red button (default "Delete")
 *   onConfirm      – user confirmed
 *   onCancel       – user backed out (Cancel button, Esc or backdrop)
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);

  // The safe choice (Cancel) gets keyboard focus first
  useEffect(() => cancelButtonRef.current?.focus(), []);

  return (
    <Modal label={title} className="confirm" onClose={onCancel}>
      <h2>{title}</h2>
      <p className="desc">{message}</p>

      <div className="actions">
        <button ref={cancelButtonRef} onClick={onCancel}>
          Cancel
        </button>

        <button className="danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
