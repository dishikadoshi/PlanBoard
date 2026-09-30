import { useEffect, useRef } from 'react';
import { VIEWS } from '../../app/constants';

/**
 * Left navigation: brand, page links, "New Task" and the
 * undo / redo / export / import toolbar.
 *
 * Props:
 *   view                – id of the page currently open
 *   onNavigate(id)      – switch page
 *   onNewTask()         – open the "New task" form
 *   canUndo / canRedo   – enable or disable the history buttons
 *   onUndo / onRedo     – history actions
 *   onExport()          – download the project as JSON
 *   onImportFile(file)  – import a JSON file chosen by the user
 */
export default function Sidebar({
  view,
  onNavigate,
  onNewTask,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onImportFile,
}) {
  // The real <input type="file"> is hidden; the IMP button clicks it for us
  const fileInputRef = useRef(null);

  // On phones the page tabs sit in a sideways-scrolling row: keep the open one in view
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector('[aria-current="page"]');

    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;

    nav.scrollTo({
      left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [view]);

  const handleFileChosen = (event) => {
    const file = event.target.files[0];

    // Reset the input so choosing the same file twice still triggers onChange
    event.target.value = '';

    if (file) onImportFile(file);
  };

  return (
    <aside className="side">
      {/* Brand */}
      <div className="brand">
        Plan<span>Board</span>
        <small>Plan, link and ship</small>
      </div>

      {/* Page links */}
      <nav ref={navRef} aria-label="Views">
        {VIEWS.map(({ id, label, subtitle, icon }) => (
          <button
            key={id}
            className="nav"
            aria-current={view === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <i aria-hidden="true">{icon}</i>

            <span>
              {label}
              <small>{subtitle}</small>
            </span>
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="sideact">
        <button className="primary" onClick={onNewTask} aria-label="New task">
          ＋ New<span className="long"> Task</span>
        </button>

        <div className="mini">
          <button
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>

          <button
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>

          <button onClick={onExport} aria-label="Export JSON" title="Export JSON">
            EXP
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            aria-label="Import JSON"
            title="Import JSON"
          >
            IMP
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          aria-label="Import JSON file"
          onChange={handleFileChosen}
        />
      </div>
    </aside>
  );
}
