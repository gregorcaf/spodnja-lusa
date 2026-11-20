// Construction and demolition: validation, effect forecast and execution.

import { CONFIG } from '../config.js';
import { DISTRICTS, districtOf, idx, inBounds, isOwned } from './map.js';
import { BUILD_ERRORS, NO_ROAD, NO_MONEY, BUILD_NEWS, DEMOLISH_NEWS, BUILDINGS, BUILDING_GENITIVE } from './texts.js';
import { applyDistrictEffect } from './envy.js';
import { startConstruction } from './construction.js';
import { population, canBuildFactory } from './population.js';
import { NEEDS_ROAD, hasRoadAccess } from './roads.js';
import { canBuildClinic } from './services.js';
import { educationBlocked } from './education.js';
import { pick, capitalize, fillTemplate, formatEuro, formatSigned } from './util.js';

export const BUILD_TOOLS = ['road', 'house', 'flats', 'tower', 'roundabout', 'firehouse', 'hall', 'inn', 'factory', 'clinic', 'police', 'shop', 'vineyard', 'cemetery', 'kindergarten', 'school', 'highschool', 'faculty'];
export const TOOLS = [...BUILD_TOOLS, 'demolish'];

export function getTile(state, x, y) {
  return inBounds(x, y) ? state.grid[idx(x, y)] : null;
}

export function toolCost(tool) {
  return tool === 'demolish' ? CONFIG.demolish.cost : CONFIG.buildings[tool].cost;
}

/** Effect of performing `tool` on the given tile (assumes the action is valid). */
export function toolEffect(tool, tile) {
  if (tool === 'demolish') return CONFIG.demolish.effects[tile.type] || { homeHappy: 0, envyElse: 0, allHappy: 0 };
  return CONFIG.buildings[tool];
}

/**
 * Whether a building can be built anywhere right now (before picking a spot).
 * Returns null when it can, else { kind: 'locked' | 'money', reason, need? }.
 */
export function toolBlocked(state, tool) {
  if (tool === 'factory' && !canBuildFactory(state)) {
    const reason = BUILD_ERRORS.factoryPopulation.replace('{min}', CONFIG.population.factoryMin).replace('{now}', population(state));
    return { kind: 'locked', reason, need: CONFIG.population.factoryMin };
  }
  if (tool === 'clinic' && !canBuildClinic(state)) {
    const reason = BUILD_ERRORS.clinicPopulation.replace('{min}', CONFIG.services.clinicMin).replace('{now}', population(state));
    return { kind: 'locked', reason, need: CONFIG.services.clinicMin };
  }
  const edu = educationBlocked(state, tool);
  if (edu) return { kind: 'locked', reason: edu.reason, label: edu.label };
  if (state.budget < toolCost(tool)) return { kind: 'money', reason: pick(NO_MONEY) };
  return null;
}

/** Checks whether `tool` can be used at (x, y). Returns { ok, reason }. */
export function checkAction(state, tool, x, y) {
  const tile = getTile(state, x, y);
  if (!tile) return { ok: false, reason: '' };
  if (districtOf(x, y) < 0) return { ok: false, reason: BUILD_ERRORS.outside };
  if (!isOwned(state, x, y)) return { ok: false, reason: BUILD_ERRORS.notOwned, notOwned: true };

  if (tool === 'demolish') {
    if (tile.type === 'church') return { ok: false, reason: BUILD_ERRORS.demolishChurch };
    if (tile.type === 'grass') return { ok: false, reason: BUILD_ERRORS.demolishGrass };
  } else if (tool === 'roundabout') {
    if (tile.type === 'roundabout') return { ok: false, reason: BUILD_ERRORS.roundaboutTwice };
    if (tile.type === 'church') return { ok: false, reason: BUILD_ERRORS.church };
    if (tile.type !== 'road') return { ok: false, reason: BUILD_ERRORS.roundaboutNeedsRoad };
  } else {
    if (tile.type === 'church') return { ok: false, reason: BUILD_ERRORS.church };
    if (tile.type !== 'grass') return { ok: false, reason: BUILD_ERRORS.occupied };
  }

  // A factory needs workers.
  if (tool === 'factory' && !canBuildFactory(state)) {
    const reason = BUILD_ERRORS.factoryPopulation.replace('{min}', CONFIG.population.factoryMin).replace('{now}', population(state));
    return { ok: false, reason };
  }
  // A clinic needs patients (and a doctor willing to move here).
  if (tool === 'clinic' && !canBuildClinic(state)) {
    const reason = BUILD_ERRORS.clinicPopulation.replace('{min}', CONFIG.services.clinicMin).replace('{now}', population(state));
    return { ok: false, reason };
  }
  const edu = educationBlocked(state, tool);
  if (edu) return { ok: false, reason: edu.reason };
  if (state.budget < toolCost(tool)) return { ok: false, reason: pick(NO_MONEY), noMoney: true };
  return { ok: true, reason: '' };
}

/**
 * Preview text for hovering, e.g.
 * "+15 sreča v Zgornji vasi · +12 fovšija drugod · +3 sreča vsem · −60.000 €"
 */
export function forecast(state, tool, x, y) {
  const check = checkAction(state, tool, x, y);
  const tile = getTile(state, x, y);
  if (!tile) return { ok: false, text: '' };
  // The four forest corners of the map belong to no district (and can't be bought).
  const district = DISTRICTS[districtOf(x, y)] || { name: 'gozd izven občine', loc: 'v gozdu' };

  // Show the effect even when the only problem is money, so the player sees what they're missing.
  const showEffect = check.ok || check.noMoney;
  const parts = [];
  if (showEffect) {
    const e = toolEffect(tool, tile);
    const envy = e.envyElse * CONFIG.envy.multiplier;
    if (e.homeHappy) parts.push(`${formatSigned(e.homeHappy)} sreča ${district.loc}`);
    if (envy) parts.push(`${formatSigned(envy)} fovšija drugod`);
    if (e.allHappy) parts.push(`${formatSigned(e.allHappy)} sreča vsem`);
    parts.push(formatEuro(-toolCost(tool)));
    if (tool !== 'demolish' && NEEDS_ROAD.has(tool) && !hasRoadAccess(state, x, y)) parts.push(`⚠️ ${NO_ROAD[tool]}`);
    if (tool !== 'demolish' && e.income) parts.push(`${formatEuro(e.income, { sign: true })}/mes`);
    if (tool === 'demolish' && CONFIG.buildings[tile.type]?.income) {
      parts.push(`${formatEuro(-CONFIG.buildings[tile.type].income)}/mes`);
    }
  }
  return { ok: check.ok, text: parts.join(' · '), reason: check.reason, district: district.name };
}

/** Performs the action. Returns { ok, reason, news }. */
export function performAction(state, tool, x, y) {
  const check = checkAction(state, tool, x, y);
  if (!check.ok) return check;

  const tile = getTile(state, x, y);
  const districtId = districtOf(x, y);
  const district = DISTRICTS[districtId];
  const effect = toolEffect(tool, tile);
  state.budget -= toolCost(tool);

  const vars = { loc: district.loc, Loc: capitalize(district.loc) };
  let news;
  if (tool === 'demolish') {
    const oldType = tile.type;
    // A demolished roundabout leaves the road behind; everything else becomes meadow.
    const newType = oldType === 'roundabout' ? 'road' : 'grass';
    state.grid[idx(x, y)] = { type: newType, variant: tile.variant };
    applyDistrictEffect(state, districtId, effect, null);
    news = fillTemplate(pick(DEMOLISH_NEWS), {
      ...vars,
      what: BUILDINGS[oldType].what,
      whatGen: BUILDING_GENITIVE[oldType],
    });
    return { ok: true, news, removed: oldType };
  }

  state.grid[idx(x, y)] = { type: tool, variant: Math.floor(Math.random() * 1000) };
  startConstruction(state.grid[idx(x, y)]);
  state.stats.built += 1;
  if (tool === 'roundabout') state.stats.roundabouts += 1;
  applyDistrictEffect(state, districtId, effect, tool);
  news = fillTemplate(pick(BUILD_NEWS[tool]), vars);
  return { ok: true, news };
}
