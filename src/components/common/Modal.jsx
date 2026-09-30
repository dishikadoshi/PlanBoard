import { useEffect, useRef } from 'react';

// Everything a keyboard user can Tab to
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Backdrop + dialog shell shared by every popup
 * (task form, task details, delete confirmation).
 *
 * Keyboard behaviour:
 *   - Esc closes the dialog
 *   - Tab / Shift+Tab stay inside the dialog (focus trap)
 *   - when it closes, focus returns to whatever opened it
 *
 * Also closes when the dark backdrop outside the dialog is clicked.
 *
 * Props:
 *   label     – accessible name announced by screen readers
 *   className – extra class to change the dialog width ("detail", "confirm")
 *   onClose   – called when the user dismisses the dialog
 */
export default function Modal({ label, className = '', onClose, children }) {
  const dialogRef = useRef(null);

  // Remember what had focus when the dialog opened (read on the first render only)
  const openerRef = useRef(document.activeElement);

  useEffect(() => {
    const dialog = dialogRef.current;

    // Child components may already have focused a field or button;
    // only step in when focus is still outside the dialog
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus();
    }

    // On close, hand focus back to the opener (if it is still on the page)
    return () => {
      const opener = openerRef.current;

      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  // Only react to clicks on the backdrop itself, not on the dialog inside it
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  /** Keeps Tab cycling between the first and last control of the dialog. */
  const trapTab = (event) => {
    const controls = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
      (element) => element.getClientRects().length > 0
    );

    if (!controls.length) {
      event.preventDefault();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    const focusIsOutside = !dialogRef.current.contains(document.activeElement);

    if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key === 'Tab') trapTab(event);
  };

  return (
    <div
      className="backdrop"
      onMouseDown={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}