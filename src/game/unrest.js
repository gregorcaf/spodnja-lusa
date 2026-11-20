// Unrest: a high affair risk brings protests, and an even higher one riots.

import { CONFIG } from '../config.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { BURN_NEWS, VANDAL_NEWS } from './texts.js';
import { clampCitizen } from './citizens.js';
import { moodScore, supportShare } from './stats.js';
import { taxRate, taxLevel } from './taxes.js';
import { pick, capitalize, fillTemplate } from './util.js';
import { policeDistricts, vandalismShare, policeSavedNews } from './services.js';

const MIN_PROTESTERS = 5;
// What can burn in a riot. Roads and the church are spared.
export const BURNABLE = ['house', 'firehouse', 'hall', 'roundabout', 'inn', 'factory', 'flats', 'tower', 'clinic', 'police', 'shop', 'kindergarten', 'school', 'highschool', 'faculty'];

/** 'calm' | 'protest' | 'riot' */
const RANK = { calm: 0, protest: 1, riot: 2 };

/** Unrest caused by the affair risk alone. */
function affairLevel(state) {
  if (state.affair >= CONFIG.unrest.riotAt) return 'riot';
  if (state.affair >= CONFIG.unrest.protestAt) return 'protest';
  return 'calm';
}

/** Unrest caused by unhappiness alone (very low support for the mayor). */
function moodLevel(state) {
  const support = supportShare(state);
  if (support <= CONFIG.unrest.supportRiotAtMost) return 'riot';
  if (support <= CONFIG.unrest.supportProtestAtMost) return 'protest';
  return 'calm';
}

/** 'calm' | 'protest' | 'riot' – whichever cause (affair or unhappiness) is worse. */
export function unrestLevel(state) {
  const a = affairLevel(state);
  const m = moodLevel(state);
  return RANK[m] > RANK[a] ? m : a;
}

/** 'affair' | 'mood' – what is driving the current unrest. */
export function unrestCause(state) {
  return RANK[moodLevel(state)] > RANK[affairLevel(state)] ? 'mood' : 'affair';
}

/** Decides who is out on the street. Re-evaluated on level changes and monthly. */
export function assignProtesters(state) {
  const level = state.unrest;
  for (const c of state.citizens) c.protesting = false;
  if (level === 'calm') return;

  const sorted = [...state.citizens].sort((a, b) => moodScore(a, state) - moodScore(b, state));
  // Riot: almost everyone. Protest: the unhappy and undecided, plus every Facebook commenter.
  // A very high tax drives even fairly content people onto the street.
  const taxAnger = taxLevel(taxRate(state)) === 'veryHigh' ? CONFIG.taxes.protestBoost : 0;
  const cutoff = (level === 'riot' ? 70 : CONFIG.mood.greenAbove) + taxAnger;
  for (const c of sorted) {
    if (moodScore(c, state) < cutoff || c.character === 'commenter') c.protesting = true;
  }
  // A protest needs a crowd: the grumpiest few always show up.
  for (let i = 0; i < MIN_PROTESTERS && i < sorted.length; i++) sorted[i].protesting = true;
}

export function protesterCount(state) {
  return state.citizens.filter((c) => c.protesting).length;
}

/**
 * Monthly consequences of unrest. Returns { level, damage } where damage is
 * { x, y, type, cost, news } when a building burned in a riot.
 */
export function applyMonthlyUnrest(state) {
  const level = state.unrest;
  const u = CONFIG.unrest;
  if (level === 'calm') return { level, damage: null };

  const happy = level === 'riot' ? u.riotHappy : u.protestHappy;
  for (const c of state.citizens) {
    c.happy += happy;
    clampCitizen(c);
  }
  state.affair = Math.max(0, state.affair - u.extraAffairDecay);

  let damage = null;
  if (level === 'protest') damage = protestDamage(state);
  if (level === 'riot') {
    const targets = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (BURNABLE.includes(state.grid[idx(x, y)].type)) targets.push({ x, y });
      }
    }
    // Rioters pick a target anywhere; where a police station stands, the fire is stopped in time.
    const guarded = policeDistricts(state);
    const target = targets.length ? pick(targets) : null;
    if (target && guarded.has(districtOf(target.x, target.y))) {
      damage = { x: null, y: null, type: null, cost: 0, news: policeSavedNews(districtOf(target.x, target.y)) };
    } else if (target) {
      const { x, y } = target;
      const tile = state.grid[idx(x, y)];
      const type = tile.type;
      // A burned roundabout leaves its road behind.
      state.grid[idx(x, y)] = { type: type === 'roundabout' ? 'road' : 'grass', variant: tile.variant };
      state.budget -= u.riotRepairCost;
      const d = DISTRICTS[districtOf(x, y)];
      damage = {
        x,
        y,
        type,
        cost: u.riotRepairCost,
        news: fillTemplate(BURN_NEWS[type], { loc: d.loc, Loc: capitalize(d.loc) }),
      };
    }
  }
  return { level, damage };
}

/**
 * Protests: vandalism every month, sometimes a toppled statue (roundabout → road)
 * or a road torn up for a barricade. Returns a damage record (x/y may be null).
 */
function protestDamage(state) {
  const u = CONFIG.unrest;
  // With a police station around, the graffiti gets cleaned up for less.
  const vandalism = Math.round(u.protestVandalism * vandalismShare(state));
  state.budget -= vandalism;
  const damage = { x: null, y: null, type: null, cost: vandalism, news: pick(VANDAL_NEWS.graffiti) };
  if (Math.random() >= u.protestDamageChance) return damage;

  const find = (type) => {
    const out = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (state.grid[idx(x, y)].type === type) out.push({ x, y });
    return out;
  };
  const statues = find('roundabout');
  const type = statues.length ? 'roundabout' : 'road';
  const targets = statues.length ? statues : find('road');
  if (!targets.length) return damage;
  const { x, y } = pick(targets);
  const tile = state.grid[idx(x, y)];
  state.grid[idx(x, y)] = { type: type === 'roundabout' ? 'road' : 'grass', variant: tile.variant };
  const d = DISTRICTS[districtOf(x, y)];
  return { ...damage, x, y, type, news: fillTemplate(VANDAL_NEWS[type], { loc: d.loc, Loc: capitalize(d.loc) }) };
}
