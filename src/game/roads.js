// Road access: buildings only work when they touch a road connected to the main network.
// The network starts at the two main roads through the middle of the municipality.

import { SIZE, HALF, CORE, CORE_SIZE, idx, inBounds, isWalkable } from './map.js';

/** Building types that need a road to work (residents, income, firefighters). */
export const NEEDS_ROAD = new Set(['house', 'flats', 'tower', 'inn', 'factory', 'firehouse', 'hall', 'clinic', 'police', 'shop', 'kindergarten', 'school', 'highschool', 'faculty']);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Set of tile indices of all road tiles connected to the main roads. */
export function roadNetwork(state) {
  const seen = new Set();
  const queue = [];
  // Seeds: every surviving tile of the two main roads inside the core.
  for (let i = CORE; i < CORE + CORE_SIZE; i++) {
    for (const [x, y] of [[HALF - 1, i], [HALF, i], [i, HALF - 1], [i, HALF]]) {
      const k = idx(x, y);
      if (!seen.has(k) && isWalkable(state.grid[k].type)) {
        seen.add(k);
        queue.push([x, y]);
      }
    }
  }
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      const k = idx(nx, ny);
      if (seen.has(k) || !isWalkable(state.grid[k].type)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

/** Does the tile at (x, y) touch the road network? */
export function hasRoadAccess(state, x, y, network = roadNetwork(state)) {
  return DIRS.some(([dx, dy]) => inBounds(x + dx, y + dy) && network.has(idx(x + dx, y + dy)));
}

/** Is the building at (x, y) working? (Types that don't need a road always are.) */
export function isConnected(state, x, y, network = roadNetwork(state)) {
  return !NEEDS_ROAD.has(state.grid[idx(x, y)].type) || hasRoadAccess(state, x, y, network);
}

/** Buildings that need a road but have none: [{ x, y, type }]. */
export function disconnectedBuildings(state) {
  const network = roadNetwork(state);
  const out = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = state.grid[idx(x, y)];
      if (NEEDS_ROAD.has(t.type) && !hasRoadAccess(state, x, y, network)) out.push({ x, y, type: t.type });
    }
  }
  return out;
}

/**
 * Tiles of an L-shaped road from a to b (inclusive): first along the longer axis, then the shorter.
 * Used for drag-to-build roads.
 */
export function roadPath(a, b) {
  const out = [];
  const horizontalFirst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const sx = Math.sign(b.x - a.x);
  const sy = Math.sign(b.y - a.y);
  let { x, y } = a;
  out.push({ x, y });
  if (horizontalFirst) {
    while (x !== b.x) out.push({ x: (x += sx), y });
    while (y !== b.y) out.push({ x, y: (y += sy) });
  } else {
    while (y !== b.y) out.push({ x, y: (y += sy) });
    while (x !== b.x) out.push({ x: (x += sx), y });
  }
  return out;
}
