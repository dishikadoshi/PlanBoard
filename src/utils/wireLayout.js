/* =========================================================
   Dependency-map wire routing
   Measures the task nodes in the DOM and works out the SVG
   path of every dependency line.

   Routing rules (so lines never run behind cards):
     - Links to the NEXT phase leave the source, travel along a
       private lane in the gutter between the phases, then enter
       the target.
     - Links that SKIP phases drop to a lane underneath the map,
       run along it, then rise into the target.
   ========================================================= */


/* ---------- Tuning values (pixels) ---------- */

const FAN_SPACING = 14;          // vertical gap between lines sharing one card side
const GUTTER_MARGIN_LEFT = 14;   // clear space kept next to the source column
const GUTTER_MARGIN_RIGHT = 26;  // clear space kept next to the target column
const LONG_LANE_OFFSET = 22;     // first long-link lane sits this far below the lowest card
const LONG_LANE_SPACING = 10;    // gap between stacked long-link lanes
const PADDING_BELOW_LANES = 26;  // breathing room under the last lane
const DEFAULT_BOTTOM_PADDING = 12;
const CORNER_RADIUS = 7;


/* ---------- Path drawing ---------- */

/**
 * Turns a list of [x, y] points into an SVG path made of straight
 * segments joined by softly rounded corners.
 */
export const roundedPath = (rawPoints, radius = CORNER_RADIUS) => {
  // Drop consecutive duplicate points (zero-length segments)
  const points = rawPoints.filter(
    (point, i) =>
      i === 0 ||
      point[0] !== rawPoints[i - 1][0] ||
      point[1] !== rawPoints[i - 1][1]
  );

  let path = `M${points[0][0]},${points[0][1]}`;

  for (let i = 1; i < points.length - 1; i++) {
    const [prevX, prevY] = points[i - 1];
    const [cornerX, cornerY] = points[i];
    const [nextX, nextY] = points[i + 1];

    const lengthIn = Math.hypot(cornerX - prevX, cornerY - prevY);
    const lengthOut = Math.hypot(nextX - cornerX, nextY - cornerY);

    // Never round more than half of either neighbouring segment
    const cornerRadius = Math.min(radius, lengthIn / 2, lengthOut / 2);

    // Corner too tight to round: just draw a straight line to it
    if (cornerRadius < 0.5) {
      path += ` L${cornerX},${cornerY}`;
      continue;
    }

    const startX = cornerX - ((cornerX - prevX) / lengthIn) * cornerRadius;
    const startY = cornerY - ((cornerY - prevY) / lengthIn) * cornerRadius;
    const endX = cornerX + ((nextX - cornerX) / lengthOut) * cornerRadius;
    const endY = cornerY + ((nextY - cornerY) / lengthOut) * cornerRadius;

    path += ` L${startX},${startY} Q${cornerX},${cornerY} ${endX},${endY}`;
  }

  const last = points.at(-1);

  return `${path} L${last[0]},${last[1]}`;
};


/* ---------- Step 1: measure every dependency link ---------- */

/**
 * One "edge" per dependency (prerequisite → dependent task), with the
 * measured position of both cards relative to the map container.
 */
const collectEdges = (root, tasks, phaseOf) => {
  const origin = root.getBoundingClientRect();
  const measure = (selector) => root.querySelector(selector)?.getBoundingClientRect();
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const edges = [];

  tasks.forEach((task) => {
    task.deps.forEach((depId) => {
      const source = measure(`[data-node="${depId}"]`);
      const target = measure(`[data-node="${task.id}"]`);

      if (!source || !target || !tasksById.has(depId)) return;

      edges.push({
        key: `${depId}>${task.id}`,
        from: depId,
        to: task.id,

        // Phase numbers of both ends
        fromPhase: phaseOf.get(depId),
        toPhase: phaseOf.get(task.id),

        // Where the line leaves the source / enters the target
        startX: source.right - origin.left,
        endX: target.left - origin.left,
        startCentreY: source.top + source.height / 2 - origin.top,
        endCentreY: target.top + target.height / 2 - origin.top,

        // Lowest edge of the two cards (used to place long-link lanes)
        bottom: Math.max(source.bottom, target.bottom) - origin.top,

        // "Hot" = both ends unfinished → drawn red and animated
        hot: tasksById.get(depId).status !== 'Done' && task.status !== 'Done',
      });
    });
  });

  return edges;
};


/* ---------- Step 2: fan out lines that share a card ---------- */

/**
 * When several lines leave (or enter) the same card, spread them
 * vertically so each stays visible instead of overlapping.
 *
 *   groupBy   – edge key that identifies the shared card ('from' | 'to')
 *   sortBy    – edge key used to order the lines (keeps them uncrossed)
 *   centreKey – edge key holding the card's centre Y
 *   outputKey – edge key that receives the final Y
 */
const fanOut = (edges, { groupBy, sortBy, centreKey, outputKey }) => {
  const groups = new Map();

  edges.forEach((edge) => {
    groups.set(edge[groupBy], [...(groups.get(edge[groupBy]) || []), edge]);
  });

  groups.forEach((group) => {
    group
      .sort((a, b) => a[sortBy] - b[sortBy])
      .forEach((edge, index) => {
        const offsetFromCentre = (index - (group.length - 1) / 2) * FAN_SPACING;

        edge[outputKey] = edge[centreKey] + offsetFromCentre;
      });
  });
};


/* ---------- Step 3: give every line its own vertical lane ---------- */

/**
 * The empty space between phase `g` and phase `g + 1`.
 * Returns the left / right limits lanes may use.
 */
const measureGutter = (root, gutterIndex) => {
  const origin = root.getBoundingClientRect();
  const leftColumn = root.querySelector(`[data-phase="${gutterIndex}"]`).getBoundingClientRect();
  const rightColumn = root.querySelector(`[data-phase="${gutterIndex + 1}"]`).getBoundingClientRect();

  return {
    left: leftColumn.right - origin.left + GUTTER_MARGIN_LEFT,
    right: rightColumn.left - origin.left - GUTTER_MARGIN_RIGHT,
  };
};

/** True when the line travels downward (target lower than source). */
const goesDown = (edge) => edge.endY >= edge.startY;

/**
 * Assigns each edge an X position ("lane") inside the gutter(s) it crosses.
 *   laneA – first vertical run, right after leaving the source
 *   laneB – second vertical run, right before entering the target
 *           (only for links that skip phases)
 */
const assignGutterLanes = (root, edges) => {
  const claimsByGutter = new Map(); // gutter index → [{ edge, lane }]

  const claim = (gutterIndex, edge, lane) => {
    const claims = claimsByGutter.get(gutterIndex) || [];

    claimsByGutter.set(gutterIndex, [...claims, { edge, lane }]);
  };

  edges.forEach((edge) => {
    const isNextPhase = edge.toPhase - edge.fromPhase === 1;

    claim(edge.fromPhase, edge, 'laneA');

    if (!isNextPhase) claim(edge.toPhase - 1, edge, 'laneB');
  });

  claimsByGutter.forEach((claims, gutterIndex) => {
    // Downward links first (lowest closest to the source), then upward ones
    claims.sort((a, b) => {
      if (goesDown(a.edge) !== goesDown(b.edge)) return goesDown(a.edge) ? -1 : 1;

      return goesDown(a.edge)
        ? b.edge.startY - a.edge.startY
        : a.edge.startY - b.edge.startY;
    });

    const { left, right } = measureGutter(root, gutterIndex);

    claims.forEach(({ edge, lane }, index) => {
      edge[lane] =
        claims.length === 1
          ? (left + right) / 2
          : left + ((right - left) * index) / (claims.length - 1);
    });
  });
};


/* ---------- Step 4: lanes underneath the map for long links ---------- */

/**
 * Links that skip phases run along a horizontal lane below all cards.
 * Shorter links ride higher so they never cross the longer ones.
 * Returns how much extra space the container needs at its bottom.
 */
const assignLongLinkLanes = (edges) => {
  const longLinks = edges
    .filter((edge) => edge.toPhase - edge.fromPhase > 1)
    .sort((a, b) => a.toPhase - a.fromPhase - (b.toPhase - b.fromPhase));

  if (!longLinks.length) return DEFAULT_BOTTOM_PADDING;

  const lowestCard = Math.max(0, ...edges.map((edge) => edge.bottom));
  const firstLaneY = lowestCard + LONG_LANE_OFFSET;

  longLinks.forEach((edge, index) => {
    edge.laneY = firstLaneY + index * LONG_LANE_SPACING;
  });

  return (
    LONG_LANE_OFFSET +
    (longLinks.length - 1) * LONG_LANE_SPACING +
    PADDING_BELOW_LANES
  );
};


/* ---------- Step 5: turn every edge into an SVG path ---------- */

const buildWire = (edge) => {
  const isNextPhase = edge.toPhase - edge.fromPhase === 1;

  const points = isNextPhase
    ? [
        [edge.startX, edge.startY],
        [edge.laneA, edge.startY],
        [edge.laneA, edge.endY],
        [edge.endX, edge.endY],
      ]
    : [
        [edge.startX, edge.startY],
        [edge.laneA, edge.startY],
        [edge.laneA, edge.laneY],
        [edge.laneB, edge.laneY],
        [edge.laneB, edge.endY],
        [edge.endX, edge.endY],
      ];

  return {
    key: edge.key,
    from: edge.from,
    to: edge.to,
    d: roundedPath(points),
    hot: edge.hot,
  };
};


/* ---------- Public API ---------- */

/**
 * Works out every wire for the map rendered inside `root`.
 *
 * Returns:
 *   wires         – [{ key, from, to, d, hot }] ready to render as <path>
 *   bottomPadding – extra pixels the map needs below the cards
 */
export function calculateWires(root, tasks, phaseOf) {
  const edges = collectEdges(root, tasks, phaseOf);

  fanOut(edges, { groupBy: 'from', sortBy: 'endCentreY', centreKey: 'startCentreY', outputKey: 'startY' });
  fanOut(edges, { groupBy: 'to', sortBy: 'startCentreY', centreKey: 'endCentreY', outputKey: 'endY' });

  assignGutterLanes(root, edges);
  const bottomPadding = assignLongLinkLanes(edges);

  const wires = edges.map(buildWire);

  // Unfinished (red) links are drawn last so they sit on top
  wires.sort((a, b) => Number(a.hot) - Number(b.hot));

  return { wires, bottomPadding };
}

export { DEFAULT_BOTTOM_PADDING };
