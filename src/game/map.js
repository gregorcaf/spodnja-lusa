// Map: a 32×32 grid. The original municipality (16×16, four districts) sits in the middle;
// around it are eight 8×8 plots of land that can be bought as new hamlets ("zaselki").

export const SIZE = 32;
export const HALF = SIZE / 2; // centre of the map (main roads at HALF − 1 and HALF)
export const CORE = 8; // the core municipality spans CORE … CORE + 15
export const CORE_SIZE = 16;
export const PLOT_SIZE = 8;

/**
 * Districts: 0–3 are the original quarters, 4–11 hamlets on the plots around them.
 * A hamlet only exists once its plot is bought (state.hamlets).
 */
export const DISTRICTS = [
  { id: 0, name: 'Zgornja vas', loc: 'v Zgornji vasi', from: 'iz Zgornje vasi' },
  { id: 1, name: 'Gorenji Hrib', loc: 'na Gorenjem Hribu', from: 'z Gorenjega Hriba' },
  { id: 2, name: 'Spodnja vas', loc: 'v Spodnji vasi', from: 'iz Spodnje vasi' },
  { id: 3, name: 'Za Gmajno', loc: 'za Gmajno', from: 'izza Gmajne' },
  { id: 4, name: 'Pod Hribom', loc: 'pod Hribom', from: 'izpod Hriba', hamlet: true },
  { id: 5, name: 'Na Logu', loc: 'na Logu', from: 'z Loga', hamlet: true },
  { id: 6, name: 'Pri Mlinu', loc: 'pri Mlinu', from: 'od Mlina', hamlet: true },
  { id: 7, name: 'Za Potokom', loc: 'za Potokom', from: 'izza Potoka', hamlet: true },
  { id: 8, name: 'Novo naselje', loc: 'v Novem naselju', from: 'iz Novega naselja', hamlet: true },
  { id: 9, name: 'Na Klancu', loc: 'na Klancu', from: 's Klanca', hamlet: true },
  { id: 10, name: 'Dolinica', loc: 'v Dolinici', from: 'iz Dolinice', hamlet: true },
  { id: 11, name: 'Senožeti', loc: 'na Senožetih', from: 's Senožeti', hamlet: true },
];

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/**
 * The eight plots around the core. Each continues one of the main roads into the plot
 * and gets a side street, so citizens can walk there right away.
 */
export const PLOTS = [
  { id: 4, x: 8, y: 0, roads: [...range(0, 7).map((y) => [15, y]), ...range(9, 14).map((x) => [x, 3])] },
  { id: 5, x: 16, y: 0, roads: [...range(0, 7).map((y) => [16, y]), ...range(17, 22).map((x) => [x, 3])] },
  { id: 6, x: 0, y: 8, roads: [...range(0, 7).map((x) => [x, 15]), ...range(9, 14).map((y) => [3, y])] },
  { id: 7, x: 0, y: 16, roads: [...range(0, 7).map((x) => [x, 16]), ...range(17, 22).map((y) => [3, y])] },
  { id: 8, x: 24, y: 8, roads: [...range(24, 31).map((x) => [x, 15]), ...range(9, 14).map((y) => [28, y])] },
  { id: 9, x: 24, y: 16, roads: [...range(24, 31).map((x) => [x, 16]), ...range(17, 22).map((y) => [28, y])] },
  { id: 10, x: 8, y: 24, roads: [...range(24, 31).map((y) => [15, y]), ...range(9, 14).map((x) => [x, 28])] },
  { id: 11, x: 16, y: 24, roads: [...range(24, 31).map((y) => [16, y]), ...range(17, 22).map((x) => [x, 28])] },
];

export function inCore(x, y) {
  return x >= CORE && y >= CORE && x < CORE + CORE_SIZE && y < CORE + CORE_SIZE;
}

/** The plot containing (x, y), or null (core and the four outer corners have none). */
export function plotAt(x, y) {
  return PLOTS.find((p) => x >= p.x && y >= p.y && x < p.x + PLOT_SIZE && y < p.y + PLOT_SIZE) || null;
}

/** District id of a tile: 0–3 in the core, 4–11 on a plot, −1 in the corners. x grows east, y south. */
export function districtOf(x, y) {
  if (inCore(x, y)) return (y >= HALF ? 2 : 0) + (x >= HALF ? 1 : 0);
  const plot = plotAt(x, y);
  return plot ? plot.id : -1;
}

/** Is the tile part of the municipality (core, or a bought hamlet)? */
export function isOwned(state, x, y) {
  if (inCore(x, y)) return true;
  const plot = plotAt(x, y);
  return !!plot && (state.hamlets || []).includes(plot.id);
}

/** Districts that exist right now: the four quarters plus every bought hamlet. */
export function activeDistricts(state) {
  return DISTRICTS.filter((d) => !d.hamlet || (state.hamlets || []).includes(d.id));
}

/** Centre of a district in tile coordinates. */
export function districtCenter(d) {
  if (d < 4) return { x: CORE + (d % 2) * 8 + 3.5, y: CORE + (d < 2 ? 0 : 8) + 3.5 };
  const p = PLOTS.find((pl) => pl.id === d);
  return { x: p.x + 3.5, y: p.y + 3.5 };
}

/** Diagonally opposite quarter (only the four original quarters have one). */
export function oppositeOf(d) {
  return d >= 0 && d < 4 ? 3 - d : -1;
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

export function idx(x, y) {
  return y * SIZE + x;
}

export const WALKABLE = new Set(['road', 'roundabout']);

export function isWalkable(type) {
  return WALKABLE.has(type);
}

// --- The original municipality (coordinates inside the 16×16 core) -------------

const SIDE_STREETS = [
  // Zgornja vas (NW)
  ...range(1, 6).map((x) => [x, 3]),
  [3, 1], [3, 2],
  // Gorenji Hrib (NE)
  ...range(1, 6).map((y) => [12, y]),
  [13, 3], [14, 3],
  // Spodnja vas (SW)
  ...range(9, 14).map((y) => [3, y]),
  [4, 12], [5, 12], [6, 12],
  // Za Gmajno (SE)
  ...range(9, 14).map((x) => [x, 12]),
  [12, 13], [12, 14],
];

const HOUSES = [
  [2, 2], [4, 2], [2, 4], [5, 4], [6, 1], // NW
  [11, 2], [13, 2], [13, 4], [11, 5], [9, 1], // NE
  [2, 10], [4, 10], [2, 13], [4, 13], [5, 11], // SW
  [10, 11], [13, 11], [10, 13], [13, 13], [9, 9], // SE
];

const CHURCH = [6, 6];

export function createGrid() {
  const grid = Array.from({ length: SIZE * SIZE }, () => ({ type: 'grass', variant: 0 }));
  // Layout coordinates are given inside the core; shift them into the big grid.
  const set = (x, y, type) => {
    grid[idx(x + CORE, y + CORE)] = { type, variant: Math.floor(Math.random() * 1000) };
  };
  // Two main (two-lane) roads crossing through the middle of the core
  for (let i = 0; i < CORE_SIZE; i++) {
    set(7, i, 'road');
    set(8, i, 'road');
    set(i, 7, 'road');
    set(i, 8, 'road');
  }
  for (const [x, y] of SIDE_STREETS) set(x, y, 'road');
  for (const [x, y] of HOUSES) set(x, y, 'house');
  set(CHURCH[0], CHURCH[1], 'church');
  return grid;
}

/** Old saves had only the 16×16 core: put it in the middle of the big grid. */
export function migrateGrid(grid) {
  if (grid.length === SIZE * SIZE) return grid;
  const old = Math.round(Math.sqrt(grid.length));
  const out = Array.from({ length: SIZE * SIZE }, () => ({ type: 'grass', variant: 0 }));
  for (let y = 0; y < old; y++) for (let x = 0; x < old; x++) out[idx(x + CORE, y + CORE)] = grid[y * old + x];
  return out;
}
