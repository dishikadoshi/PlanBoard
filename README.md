# PlanBoard — Kanban / Project Planning Board

Single-user React (Vite) workspace with dependencies, a live dashboard, activity log and localStorage persistence. No backend.

## Setup
```
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Key design decisions
- Feature-based `src/` layout: `app/` (shell + constants), `components/` (layout, tasks, board, dashboard, dependencies, activity, common), `hooks/` (store, router, popup state, import, map wiring), `state/` (reducer, actions, activity-log wording), `services/` (localStorage + JSON import/export), `utils/` (pure logic), `data/` (seed), `styles/` (one CSS file per feature).
- `App.jsx` only wires things together: `useProjectStore` (data), `useHashRoute` (page), `useTaskDialogs` (popups) and `useImportNotice` (import result) hold the state, so the shell has no business logic.
- The reducer is a thin `switch` that delegates to one small handler per action (`handleSave`, `handleMove`, ...). Action types are constants (`ACTION_TYPES`) and the wording of log entries lives in `state/activityLog.js`.
- The dependency map's wire routing is split into small named steps in `utils/wireLayout.js` (measure edges -> fan out -> assign lanes -> build paths); `useWireLayout` applies it after render, and `DependencyMap` only renders.
- All rules live in pure `utils/` and `state/` files (blocked/overdue, cycle detection, reducer), so components stay presentational.
- `task.deps` stores DIRECT prerequisites only. Indirect ones are derived by walking the graph (`dependencyUtils.js`), never stored; if C must happen before E, E simply depends on C.
- A task is blocked while ANY direct prerequisite is not Done, so deps `[C, E]` stay blocked until both are Done. The form, card tooltips and detail panel all name the prerequisites (with status) that cause the block.
- The dependency picker (`DependencySelector`) shows selected prerequisites first, available tasks below, hides the task itself, and disables options that would create a cycle. The reducer re-checks (dedupe, no self link, no cycle) as a safety net.
- The dependency map is built from `task.deps` at render time; hovering a task highlights its direct links and dims/fades the rest of its indirect chain.
- One `commit()` path records history + activity, giving undo/redo and the activity log for free.
- Blocked and overdue are *derived* on render, never stored, so metrics can't go stale.
- Deleting a task strips its id from every other task's prerequisites.
- A blocked task cannot enter In Progress, Review or Done (drag & drop, status dropdowns and the form all enforce it, and the reducer re-checks). It can still sit in Backlog / To Do. Blocked stays a derived state, so if a prerequisite is reopened later, dependents already in progress are simply flagged as blocked again.
- Drag-and-drop uses native HTML5 events; every card also has a labelled status `<select>` as the keyboard alternative.
- Chart is inline SVG; animations are CSS-only and disabled under `prefers-reduced-motion`.
- The active page lives in the URL hash (`#/board`, `#/map`…) and uses `history.pushState`, so the browser Back/Forward buttons step through visited pages.
- Dependency-map wires are routed orthogonally through the gaps between phases; links that skip a phase run along a lane beneath the map so they never pass behind a card.
- Responsive: below 860px the sidebar becomes a compact top bar (four equal tabs on phones), the page scrolls normally, filters and stats reflow into two columns, the board and dependency map scroll sideways, and "New Task" becomes a floating button. Grid columns use `minmax(0, 1fr)` so wide content can never stretch a page past the screen.
- Bonus: circular-dependency detection, undo/redo (buttons + Ctrl/Cmd+Z / Y), JSON import/export with validation.

## Code style
- Every file starts with a short banner or doc comment saying what it is for; sections inside a file are separated by `/* ---------- Section ---------- */` banners.
- One blank line between logical steps, one declaration per line, descriptive names (`blockingTasks`, not `stuck`), no magic numbers (tuning values are named constants).
- CSS: one rule per property line, grouped by feature with a comment above each rule, responsive rules collected at the bottom of each file, no duplicate or dead selectors.

## AI tools used
Claude (Anthropic) generated the initial code; reviewed and adapted by Dishika Doshi.

