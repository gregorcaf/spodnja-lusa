// Generic effects used by dilemma cards and wishes.
//
// An effect is a plain object; every key is optional:
//   budget, secret, affair, propaganda      numbers added to the municipality
//   happy, envy                             added to every citizen
//   districtHappy                           added to citizens of ctx.district
//   othersEnvy                              envy for everyone outside ctx.district
//   citizenHappy, citizenEnvy               for the citizen ctx.citizenId
//   destroy: { type, count }                removes buildings of that type (in ctx.district if set)
//   build: { type }                         builds one on free meadow (in ctx.district if set)
//   modifier: { key, label, months, monthlyBudget?, blockLever? }   lasting effect
//
// ctx = { district: 0..3 | null, citizenId: number | null }

import { DISTRICTS, SIZE, idx, districtOf, isOwned } from './map.js';
import { roadNetwork, hasRoadAccess } from './roads.js';
import { clampCitizen } from './citizens.js';
import { envyFactor } from './envy.js';
import { BUILDINGS } from './texts.js';
import { clamp, formatEuro, formatSigned, shuffle } from './util.js';

export function applyEffect(state, eff, ctx = {}) {
  const tiles = [];
  if (!eff) return { tiles };
  const d = ctx.district;

  if (eff.budget) state.budget += eff.budget;
  if (eff.secret) state.secret = Math.max(0, state.secret + eff.secret);
  // secretShare: −1 confiscates everything, −0.5 half, …
  if (eff.secretShare) state.secret = Math.max(0, Math.round(state.secret * (1 + eff.secretShare)));
  if (eff.affair) state.affair = clamp(state.affair + eff.affair);
  if (eff.propaganda) state.propaganda = Math.max(0, state.propaganda + eff.propaganda);

  for (const c of state.citizens) {
    if (eff.happy) c.happy += eff.happy;
    if (eff.envy) c.envy += eff.envy;
    if (d != null && c.home === d && eff.districtHappy) c.happy += eff.districtHappy;
    if (d != null && c.home !== d && eff.othersEnvy) c.envy += eff.othersEnvy * envyFactor(c.home, d);
    if (c.id === ctx.citizenId) {
      if (eff.citizenHappy) c.happy += eff.citizenHappy;
      if (eff.citizenEnvy) c.envy += eff.citizenEnvy;
    }
    clampCitizen(c);
  }

  if (eff.destroy) tiles.push(...destroyRandom(state, eff.destroy.type, eff.destroy.count || 1, d));
  if (eff.build) {
    const t = buildRandom(state, eff.build.type, d);
    if (t) tiles.push(t);
  }
  if (eff.modifier) addModifier(state, eff.modifier);
  return { tiles };
}

export function addModifier(state, mod) {
  // The same deal again just extends it.
  const existing = state.modifiers.find((m) => m.key === mod.key);
  if (existing) existing.months = Math.max(existing.months, mod.months);
  else state.modifiers.push({ ...mod });
}

/** Removes up to `count` tiles of `type` (in `district` if given). Returns changed tiles. */
function destroyRandom(state, type, count, district) {
  const found = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type === type && (district == null || districtOf(x, y) === district)) found.push({ x, y });
    }
  }
  const picked = shuffle(found).slice(0, count);
  for (const { x, y } of picked) {
    const tile = state.grid[idx(x, y)];
    state.grid[idx(x, y)] = { type: type === 'roundabout' ? 'road' : 'grass', variant: tile.variant };
  }
  return picked;
}

/** Builds `type` on a free meadow tile, preferring tiles next to a road. */
function buildRandom(state, type, district) {
  const network = roadNetwork(state);
  const spots = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type !== 'grass' || !isOwned(state, x, y)) continue;
      if (district != null && districtOf(x, y) !== district) continue;
      // Prefer spots that touch the road network, so the new building actually works.
      spots.push({ x, y, nearRoad: hasRoadAccess(state, x, y, network) });
    }
  }
  const pool = spots.some((s) => s.nearRoad) ? spots.filter((s) => s.nearRoad) : spots;
  if (!pool.length) return null;
  const { x, y } = pool[Math.floor(Math.random() * pool.length)];
  state.grid[idx(x, y)] = { type, variant: Math.floor(Math.random() * 1000) };
  return { x, y };
}

/** Human-readable list of an effect's visible parts (for buttons and previews). */
export function describeEffect(eff, ctx = {}, state = null) {
  const out = [];
  if (!eff) return out;
  const d = ctx.district != null ? DISTRICTS[ctx.district] : null;
  const who = ctx.citizenId != null && state ? state.citizens[ctx.citizenId].name.split(' ')[0] : 'občan';
  if (eff.budget) out.push(formatEuro(eff.budget, { sign: true }));
  if (eff.secret) out.push(`${formatEuro(eff.secret, { sign: true })} skrivni račun`);
  if (eff.secretShare) out.push(eff.secretShare <= -1 ? 'ves skrivni račun zaplenjen' : `${Math.round(eff.secretShare * 100)} % skrivnega računa`);
  if (eff.affair) out.push(`${formatSigned(eff.affair)} tveganje afere`);
  if (eff.propaganda) out.push(`${formatSigned(eff.propaganda)} propaganda`);
  if (eff.happy) out.push(`${formatSigned(eff.happy)} sreča vsem`);
  if (eff.envy) out.push(`${formatSigned(eff.envy)} fovšija vsem`);
  if (eff.districtHappy && d) out.push(`${formatSigned(eff.districtHappy)} sreča ${d.loc}`);
  if (eff.othersEnvy) out.push(`${formatSigned(eff.othersEnvy)} fovšija drugod`);
  if (eff.citizenHappy) out.push(`${formatSigned(eff.citizenHappy)} sreča (${who})`);
  if (eff.citizenEnvy) out.push(`${formatSigned(eff.citizenEnvy)} fovšija (${who})`);
  if (eff.build) out.push(`gradnja: ${BUILDINGS[eff.build.type].short}${d ? ` ${d.loc}` : ''}`);
  if (eff.destroy) out.push(`izguba: ${BUILDINGS[eff.destroy.type].short}`);
  if (eff.modifier) {
    const m = eff.modifier;
    if (m.monthlyBudget) out.push(`${formatEuro(m.monthlyBudget, { sign: true })}/mes (${m.months} mes.)`);
    if (m.blockLever) out.push(`${m.label} (${m.months} mes.)`);
  }
  return out;
}

/** Sum of monthly budget changes from active modifiers. */
export function modifierBudget(state) {
  return state.modifiers.reduce((s, m) => s + (m.monthlyBudget || 0), 0);
}

/** Monthly bookkeeping for modifiers: count down and drop expired ones. */
export function tickModifiers(state) {
  for (const m of state.modifiers) m.months -= 1;
  state.modifiers = state.modifiers.filter((m) => m.months > 0);
}

/**
 * Runs scheduled (delayed) consequences that are due. Returns fired events
 * as [{ news, tiles }].
 */
export function runScheduled(state) {
  const fired = [];
  for (const s of state.scheduled) s.in -= 1;
  const due = state.scheduled.filter((s) => s.in <= 0);
  state.scheduled = state.scheduled.filter((s) => s.in > 0);
  for (const s of due) {
    const hit = s.chance == null || Math.random() < s.chance;
    const eff = hit ? s.effect : s.elseEffect;
    const news = hit ? s.news : s.elseNews;
    const { tiles } = applyEffect(state, eff, s.ctx);
    if (news || tiles.length) fired.push({ news, tiles });
  }
  return fired;
}
