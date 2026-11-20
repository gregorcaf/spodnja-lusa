// Education ladder: kindergarten → primary school → high school → faculty.
// Each step needs the previous one working and enough residents. The higher the highest working
// step, the more every household adds to the budget each month (better jobs, more income tax).

import { CONFIG } from '../config.js';
import { population, households } from './population.js';
import { working } from './services.js';
import { BUILD_ERRORS, BUILDINGS, BUILDING_GENITIVE, TOOL_INFO } from './texts.js';
import { capitalize } from './util.js';

export const EDU_TIERS = ['kindergarten', 'school', 'highschool', 'faculty'];

/** 0 = no education, 1 = kindergarten … 4 = faculty. Counts only an unbroken ladder of working buildings. */
export function educationLevel(state, network = null) {
  let level = 0;
  for (const type of EDU_TIERS) {
    if (!working(state, type, network).length) break;
    level += 1;
  }
  return level;
}

/** Monthly € per household at the given level. */
export function educationPerHousehold(level) {
  return CONFIG.education.perHousehold[level] || 0;
}

/** Monthly income from the educated residents. */
export function educationIncome(state, network = null) {
  return educationPerHousehold(educationLevel(state, network)) * households(state);
}

/** Why an education building can't be built yet: { reason, label } (label for the locked button), or null. */
export function educationBlocked(state, tool) {
  const tier = EDU_TIERS.indexOf(tool);
  if (tier < 0) return null;
  if (tier > 0) {
    const prev = EDU_TIERS[tier - 1];
    if (!working(state, prev).length) {
      const reason = BUILD_ERRORS.eduNeedsPrev.replace('{Name}', BUILDINGS[tool].name).replace('{prevGen}', BUILDING_GENITIVE[prev]).replace('{prev}', BUILDINGS[prev].what);
      return { reason, label: `najprej ${TOOL_INFO[prev].icon}` };
    }
  }
  const min = CONFIG.education.minPop[tool];
  const now = population(state);
  if (now < min) {
    const reason = BUILD_ERRORS.eduPopulation.replace('{what}', capitalize(BUILDINGS[tool].short)).replace('{min}', min).replace('{now}', now);
    return { reason, label: `${min} preb.` };
  }
  return null;
}
