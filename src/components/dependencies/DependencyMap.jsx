import { useMemo, useRef, useState } from 'react';
import { isBlocked, buildPhases, allPrerequisiteIds, allDependentIds } from '../../utils/dependencyUtils';
import useWireLayout from '../../hooks/useWireLayout';
import DependencyNode from './DependencyNode';

/**
 * Arrow heads for the wires: grey for finished links, red for "hot" ones.
 * Defined once and referenced by id from every path.
 */
function ArrowMarkers() {
  return (
    <defs>
      <marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L8,4 L0,8z" fill="#5c667d" />
      </marker>

      <marker id="ahr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0,0 L8,4 L0,8z" fill="#d1697a" />
      </marker>
    </defs>
  );
}

/**
 * Dependency map: tasks laid out in phases (columns), joined by wires.
 *
 * Layout is fully derived from task.deps, nothing about the graph is hard-coded.
 * Wire geometry lives in utils/wireLayout.js and is applied by useWireLayout.
 *
 * Props:
 *   tasks  – every task in the project
 *   onOpen – open a task's details
 */
export default function DependencyMap({ tasks, onOpen }) {
  const containerRef = useRef(null);

  // Task currently hovered / focused, or null
  const [activeId, setActiveId] = useState(null);

  const { phases, phaseOf } = useMemo(() => buildPhases(tasks), [tasks]);
  const { wires, bottomPadding } = useWireLayout(containerRef, tasks, phaseOf);

  /**
   * Ids in the traced task's whole chain (upstream + downstream).
   * Direct links touch the active task; indirect ones are the rest of the chain.
   */
  const tracedChain = useMemo(
    () =>
      activeId
        ? new Set([
            activeId,
            ...allPrerequisiteIds(activeId, tasks),
            ...allDependentIds(activeId, tasks),
          ])
        : null,
    [activeId, tasks]
  );

  /** CSS classes of one wire, depending on what is being traced. */
  const wireClassName = (wire) => {
    const base = wire.hot ? 'wire hot' : 'wire';

    if (!tracedChain) return base;

    const isDirect = wire.from === activeId || wire.to === activeId;
    if (isDirect) return `${base} direct`;

    const isIndirect = tracedChain.has(wire.from) && tracedChain.has(wire.to);
    return `${base} ${isIndirect ? 'indirect' : 'dim'}`;
  };

  if (!tasks.length) {
    return <div className="empty">No tasks to map yet.</div>;
  }

  const linkCount = tasks.reduce((count, task) => count + task.deps.length, 0);
  const blockedCount = tasks.filter((task) => isBlocked(task, tasks)).length;

  return (
    <section className="panel">
      <h2>
        Overview{' '}
        <small>
          {linkCount} dependencies · {blockedCount} blockers · red lines are unfinished
        </small>
      </h2>

      <p className="hint">
        Hover or focus a task to trace it: bright lines are direct links, faint lines are its
        indirect chain.
      </p>

      <div className="mapscroll">
        <div
          className="mapinner"
          ref={containerRef}
          style={{ paddingBottom: bottomPadding }}
        >
          {/* Wires sit behind the task boxes */}
          <svg className="wires" aria-hidden="true">
            <ArrowMarkers />

            {wires.map((wire) => (
              <path
                key={wire.key}
                d={wire.d}
                className={wireClassName(wire)}
                markerEnd={`url(#${wire.hot ? 'ahr' : 'ah'})`}
              />
            ))}
          </svg>

          {/* One column per phase */}
          {phases.map((phaseTasks, phaseIndex) => (
            <div key={phaseIndex} className="phase" data-phase={phaseIndex}>
              <h3>
                Phase {phaseIndex + 1}{' '}
                <small>{phaseIndex === 0 ? 'No prerequisites' : 'Depends on earlier phases'}</small>
              </h3>

              {phaseTasks.map((task) => (
                <DependencyNode
                  key={task.id}
                  task={task}
                  tasks={tasks}
                  isDimmed={Boolean(tracedChain) && !tracedChain.has(task.id)}
                  onTrace={setActiveId}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
