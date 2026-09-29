import { useLayoutEffect, useState } from 'react';
import { calculateWires, DEFAULT_BOTTOM_PADDING } from '../utils/wireLayout';

/**
 * Keeps the dependency-map wires in sync with the rendered cards.
 *
 * The wires are measured from the DOM, so they are recalculated after
 * every render where tasks / phases change, and whenever the window is resized.
 *
 * Returns:
 *   wires         – SVG paths to draw
 *   bottomPadding – space the container must reserve for long-link lanes
 */
export default function useWireLayout(containerRef, tasks, phaseOf) {
  const [wires, setWires] = useState([]);
  const [bottomPadding, setBottomPadding] = useState(DEFAULT_BOTTOM_PADDING);

  useLayoutEffect(() => {
    const redraw = () => {
      const root = containerRef.current;
      if (!root) return;

      const layout = calculateWires(root, tasks, phaseOf);

      setWires(layout.wires);
      setBottomPadding(layout.bottomPadding);
    };

    redraw();

    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [containerRef, tasks, phaseOf]);

  return { wires, bottomPadding };
}
