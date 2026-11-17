// Map: 16×16 grid, four districts and the initial layout.

export const SIZE = 16;
export const HALF = SIZE / 2;

export const DISTRICTS = [
  { id: 0, name: 'Zgornja vas', loc: 'v Zgornji vasi', from: 'iz Zgornje vasi', corner: 'SZ' },
  { id: 1, name: 'Gorenji Hrib', loc: 'na Gorenjem Hribu', from: 'z Gorenjega Hriba', corner: 'SV' },
  { id: 2, name: 'Spodnja vas', loc: 'v Spodnji vasi', from: 'iz Spodnje vasi', corner: 'JZ' },
  { id: 3, name: 'Za Gmajno', loc: 'za Gmajno', from: 'izza Gmajne', corner: 'JV' },
];

/** x grows east, y grows south. */
export function districtOf(x, y) {
  return (y >= HALF ? 2 : 0) + (x >= HALF ? 1 : 0);
}

/** Diagonally opposite district. */
export function oppositeOf(d) {
  return 3 - d;
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

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export function createGrid() {
  const grid = Array.from({ length: SIZE * SIZE }, () => ({ type: 'grass', variant: 0 }));
  const set = (x, y, type) => {
    grid[idx(x, y)] = { type, variant: Math.floor(Math.random() * 1000) };
  };
  // Two main (two-lane) roads crossing through the middle
  for (let i = 0; i < SIZE; i++) {
    set(HALF - 1, i, 'road');
    set(HALF, i, 'road');
    set(i, HALF - 1, 'road');
    set(i, HALF, 'road');
  }
  for (const [x, y] of SIDE_STREETS) set(x, y, 'road');
  for (const [x, y] of HOUSES) set(x, y, 'house');
  set(CHURCH[0], CHURCH[1], 'church');
  return grid;
}
