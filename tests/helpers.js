// Test helpers: repeatable randomness, a fresh game and a fake storage.

import { resetConfig } from '../src/config.js';
import { Game } from '../src/game/game.js';
import { idx, SIZE, isOwned } from '../src/game/map.js';
import { roadNetwork, hasRoadAccess } from '../src/game/roads.js';

const realRandom = Math.random;

/** Makes Math.random repeatable for the rest of the test (mulberry32). */
export function seedRandom(seed = 1) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function restoreRandom() {
  Math.random = realRandom;
}

/** A new game with default settings and no surprise cards or wishes unless a test wants them. */
export function newGame({ seed = 1, quiet = true } = {}) {
  resetConfig();
  seedRandom(seed);
  const game = new Game();
  if (quiet) {
    game.state.dilemmaTimer = 1e9;
    game.state.wishTimer = 1e9;
  }
  return game;
}

export const tileType = (state, x, y) => state.grid[idx(x, y)].type;

/**
 * First tile of `type` on land the municipality owns (unbought plots don't count).
 * Meadow is only returned next to a connected road – where a sensible mayor would build.
 * Pass { anywhere: true } for any meadow.
 */
export function findTile(state, type, predicate = () => true, { anywhere = false } = {}) {
  const network = roadNetwork(state);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (tileType(state, x, y) !== type || !isOwned(state, x, y) || !predicate(x, y)) continue;
      if (type === 'grass' && !anywhere && !hasRoadAccess(state, x, y, network)) continue;
      return { x, y };
    }
  }
  return null;
}

export class FakeStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
  removeItem(k) {
    this.data.delete(k);
  }
}
