// Population: how many people live in the municipality, derived from housing.
// A house is 1 household, a block of flats several. Buildings still under scaffolding are empty.

import { CONFIG } from '../config.js';
import { SIZE, idx, districtOf, DISTRICTS } from './map.js';
import { roadNetwork, hasRoadAccess } from './roads.js';

const HOUSEHOLDS = { house: 1 }; // flats come from CONFIG

function householdsOf(tile) {
  if (tile.build?.phase === 'construction') return 0;
  if (tile.type === 'flats') return CONFIG.population.flatsHouseholds;
  return HOUSEHOLDS[tile.type] || 0;
}

/** Households in buildings that are finished and reachable by road (nobody moves in otherwise). */
export function households(state) {
  const network = roadNetwork(state);
  let n = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = state.grid[idx(x, y)];
      if (HOUSEHOLDS[t.type] || t.type === 'flats') n += hasRoadAccess(state, x, y, network) ? householdsOf(t) : 0;
    }
  }
  return n;
}

export function population(state) {
  return households(state) * CONFIG.population.perHousehold;
}

/** Population the game starts with (used to decide how many extra walkers to show). */
export function startPopulation() {
  return 20 * CONFIG.population.perHousehold;
}

/** Residents per district (index = district id). */
export function districtPopulation(state) {
  const network = roadNetwork(state);
  const out = new Array(DISTRICTS.length).fill(0);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = districtOf(x, y);
      const t = state.grid[idx(x, y)];
      if (d < 0 || !(HOUSEHOLDS[t.type] || t.type === 'flats') || !hasRoadAccess(state, x, y, network)) continue;
      out[d] += householdsOf(t) * CONFIG.population.perHousehold;
    }
  }
  return out;
}

export function canBuildFactory(state) {
  return population(state) >= CONFIG.population.factoryMin;
}
