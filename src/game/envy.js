// Core mechanic: building in one district makes it happy and everyone else envious.

import { CONFIG } from '../config.js';
import { oppositeOf } from './map.js';
import { clampCitizen } from './citizens.js';

/** Envy multiplier for a citizen living in `home` when something happens in `district`. */
export function envyFactor(home, district) {
  const base = CONFIG.envy.multiplier;
  return home === oppositeOf(district) ? base * CONFIG.envy.oppositeMultiplier : base;
}

/**
 * Applies an effect { homeHappy, envyElse, allHappy } that happened in `district`.
 * When envy grows, the others remember what was built and where.
 */
export function applyDistrictEffect(state, district, effect, what = null) {
  for (const c of state.citizens) {
    if (c.home === district) {
      c.happy += effect.homeHappy;
    } else {
      c.envy += effect.envyElse * envyFactor(c.home, district);
      if (effect.envyElse > 0 && what) c.envyTarget = { district, what };
    }
    c.happy += effect.allHappy;
    clampCitizen(c);
  }
}
