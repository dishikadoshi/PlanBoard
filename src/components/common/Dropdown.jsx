import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Custom dropdown that replaces the browser's native <select> popup
 * (which some browsers draw with a white, oversized background).
 *
 * The menu is rendered in <body> with fixed positioning, so it is never
 * clipped by a scrolling column or a dialog. Keyboard support follows the
 * standard "select-only listbox" pattern:
 *   Enter / Space / ↓ / ↑  open · ↑ ↓ Home End  move · Enter / Space  choose
 *   Esc  close (without closing a dialog behind it) · Tab  close
 *
 * Props:
 *   value      – currently selected value
 *   options    – strings, or { value, label } objects
 *   onChange   – receives the newly chosen VALUE
 *   id, className, ariaLabel – forwarded to the trigger button
 *   isOptionDisabled – optional (value) => true to grey an option out
 */

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

/** "Done" → { value: 'Done', label: 'Done' } */
const toOption = (option) =>
  typeof option === 'string' ? { value: option, label: option } : option;

export default function Dropdown({
  value,
  options,
  onChange,
  id,
  className = '',
  ariaLabel,
  isOptionDisabled,
}) {
  const items = options.map(toOption);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [position, setPosition] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const disabledAt = (index) => Boolean(isOptionDisabled?.(items[index].value));


  /* ----- Open / close ----- */

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setPosition(null);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const choose = (index) => {
    if (disabledAt(index)) return;

    closeMenu();
    buttonRef.current?.focus();

    if (items[index].value !== value) onChange(items[index].value);
  };


  /* ----- Place the menu under the button (or above it when there is no room) ----- */

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;

    const button = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const menuWidth = menuRef.current.offsetWidth;

    const roomBelow = window.innerHeight - button.bottom - VIEWPORT_MARGIN;
    const fitsBelow = menuHeight + MENU_GAP <= roomBelow;

    const top = fitsBelow
      ? button.bottom + MENU_GAP
      : Math.max(VIEWPORT_MARGIN, button.top - menuHeight - MENU_GAP);

    const maxLeft = window.innerWidth - menuWidth - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(button.left, maxLeft));

    setPosition({ top, left, minWidth: button.width });
  }, [open]);


  /* ----- Close on outside click, scroll or resize ----- */

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePress = (event) => {
      const insideButton = buttonRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);

      if (!insideButton && !insideMenu) closeMenu();
    };

    // Scrolling the menu itself must not close it
    const closeOnScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) closeMenu();
    };

    document.addEventListener('mousedown', closeOnOutsidePress);
    document.addEventListener('touchstart', closeOnOutsidePress);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeMenu);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsidePress);
      document.removeEventListener('touchstart', closeOnOutsidePress);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [open]);


  /* ----- Keyboard ----- */

  /** Next enabled option in the given direction (stays put if there is none). */
  const stepFrom = (start, direction) => {
    let index = start;

    for (let tries = 0; tries < items.length; tries += 1) {
      index = (index + direction + items.length) % items.length;
      if (!disabledAt(index)) return index;
    }

    return start;
  };

  const handleKeyDown = (event) => {
    const { key } = event;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        openMenu();
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(stepFrom(activeIndex, 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(stepFrom(activeIndex, -1));
        break;

      case 'Home':
        event.preventDefault();
        setActiveIndex(stepFrom(-1, 1));
        break;

      case 'End':
        event.preventDefault();
        setActiveIndex(stepFrom(items.length, -1));
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        choose(activeIndex);
        break;

      case 'Escape':
        // Only close the menu, not a dialog that may be open behind it
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        break;

      case 'Tab':
        closeMenu();
        break;

      default:
    }
  };


  /* ----- Render ----- */

  const optionId = (index) => `${menuId}-option-${index}`;

  const menu = open && (
    <ul
      ref={menuRef}
      id={menuId}
      className="dd-menu"
      role="listbox"
      aria-label={ariaLabel}
      style={
        position
          ? { top: position.top, left: position.left, minWidth: position.minWidth }
          : { top: 0, left: 0, visibility: 'hidden' } // measured first, then placed
      }
      // Clicks in the menu must not reach the card / dialog it was opened from
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.preventDefault()} // keep focus on the button
    >
      {items.map((item, index) => {
        const disabled = disabledAt(index);

        return (
          <li
            key={item.value}
            id={optionId(index)}
            role="option"
            aria-selected={item.value === value}
            aria-disabled={disabled || undefined}
            className={`dd-opt ${index === activeIndex ? 'active' : ''}`}
            onMouseEnter={() => !disabled && setActiveIndex(index)}
            onClick={() => choose(index)}
          >
            <span>{item.label}</span>
            {disabled && <small>locked</small>}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`dd-btn ${className}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        draggable={false}
        onClick={(event) => {
          event.stopPropagation(); // do not open the card behind the button
          if (open) closeMenu();
          else openMenu();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="dd-value">{items[selectedIndex]?.label}</span>
        <span className="dd-caret" aria-hidden="true" />
      </button>

      {menu && createPortal(menu, document.body)}
    </>
  );
}
