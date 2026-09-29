/**
 * Backdrop + dialog shell shared by every popup
 * (task form, task details, delete confirmation).
 *
 * Closes on Esc, or when the dark backdrop outside the dialog is clicked.
 *
 * Props:
 *   label     – accessible name announced by screen readers
 *   className – extra class to change the dialog width ("detail", "confirm")
 *   onClose   – called when the user dismisses the dialog
 */
export default function Modal({ label, className = '', onClose, children }) {
  // Only react to clicks on the backdrop itself, not on the dialog inside it
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape') return;

    event.stopPropagation();
    onClose();
  };

  return (
    <div
      className="backdrop"
      onMouseDown={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
