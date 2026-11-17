// Citizens' wishes: spawning, fulfilling (pay or build) and expiring.

import { CONFIG } from '../config.js';
import { WISHES } from './content/wishes.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { BUILDINGS } from './texts.js';
import { clampCitizen } from './citizens.js';
import { pick, capitalize, fillTemplate, formatEuro, clamp } from './util.js';
import { seasonOf } from './seasons.js';

function countInDistrict(state, type, district) {
  let n = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type === type && districtOf(x, y) === district) n++;
    }
  }
  return n;
}

/**
 * Creates a new wish for a citizen without one. Templates don't repeat until all are used.
 * `forCitizen` (when the mayor listens to someone) skips the limit on active wishes.
 */
export function spawnWish(state, forCitizen = null) {
  if (!forCitizen && state.wishes.length >= CONFIG.wishes.maxActive) return null;
  const busy = new Set(state.wishes.map((w) => w.citizenId));
  const candidates = forCitizen
    ? [forCitizen].filter((c) => !busy.has(c.id))
    : state.citizens.filter((c) => !busy.has(c.id) && !c.protesting);
  if (!candidates.length) return null;

  const season = seasonOf(state.month);
  const fits = (t, c) => (!t.character || t.character === c.character) && (!t.season || t.season === season);
  const available = (c) => WISHES.filter((t) => fits(t, c) && !state.usedWishes.includes(t.id));

  let citizen = pick(candidates);
  let pool = available(citizen);
  if (!pool.length) {
    // Every template this citizen could use has been used: start a new round.
    state.usedWishes = state.usedWishes.filter((id) => !WISHES.some((t) => t.id === id && fits(t, citizen)));
    pool = available(citizen);
  }
  // Prefer character-specific wishes when a citizen has them – they're funnier.
  const own = pool.filter((t) => t.character === citizen.character);
  const t = own.length && Math.random() < 0.5 ? pick(own) : pick(pool);
  state.usedWishes.push(t.id);

  const d = DISTRICTS[citizen.home];
  const wish = {
    uid: `${t.id}-${state.monthIndex}-${citizen.id}`,
    templateId: t.id,
    citizenId: citizen.id,
    text: fillTemplate(t.text, { loc: d.loc, Loc: capitalize(d.loc) }, citizen.female),
    cost: t.cost ?? null,
    build: t.build ?? null,
    baseline: t.build ? countInDistrict(state, t.build, citizen.home) : 0,
    monthsLeft: CONFIG.wishes.deadlineMonths,
  };
  state.wishes.push(wish);
  return wish;
}

/** Short instruction for the UI, e.g. "Plačaj 1.500 €" or "Zgradi: gostilna v Spodnji vasi". */
export function wishAction(wish, state) {
  if (wish.cost != null) return `Izpolni (${formatEuro(wish.cost)})`;
  const c = state.citizens[wish.citizenId];
  return `Zgradi: ${BUILDINGS[wish.build].short} ${DISTRICTS[c.home].loc}`;
}

function reward(state, wish) {
  const w = CONFIG.wishes;
  const c = state.citizens[wish.citizenId];
  c.happy += w.fulfillHappy;
  c.envy += w.fulfillEnvy;
  c.loyalMonths = w.loyalMonths;
  c.grudgeMonths = 0;
  clampCitizen(c);
  state.wishes = state.wishes.filter((x) => x !== wish);
  state.stats.wishesFulfilled += 1;
  return `${c.name} je dobil${c.female ? 'a' : ''}, kar je želel${c.female ? 'a' : ''}. Na volitvah bo zvest${c.female ? 'a' : ''} županu.`;
}

/**
 * Pays for a wish from the budget or – "iz svojega žepa" – from the secret account.
 * The pocket looks generous (propaganda) but people wonder where the money came from.
 * Returns { ok, reason, news }.
 */
export function payWish(state, uid, fromSecret = false) {
  const wish = state.wishes.find((w) => w.uid === uid);
  if (!wish || wish.cost == null) return { ok: false, reason: '' };
  if (fromSecret) {
    if (state.secret < wish.cost) return { ok: false, reason: 'Na skrivnem računu ni dovolj. Bratranec bo moral spet na razpis.' };
    state.secret -= wish.cost;
    state.propaganda += CONFIG.wishes.secretPropaganda;
    state.affair = clamp(state.affair + CONFIG.wishes.secretAffair);
    return { ok: true, news: `${reward(state, wish)} Župan je plačal iz svojega žepa. Od kod mu toliko, se sprašujejo sosedje.` };
  }
  if (state.budget < wish.cost) return { ok: false, reason: 'Za to željo ni denarja. Občan bo moral še malo počakati.' };
  state.budget -= wish.cost;
  return { ok: true, news: reward(state, wish) };
}

/** After construction: build wishes are fulfilled automatically. Returns news items. */
export function checkBuildWishes(state) {
  const news = [];
  for (const wish of [...state.wishes]) {
    if (!wish.build) continue;
    const c = state.citizens[wish.citizenId];
    if (countInDistrict(state, wish.build, c.home) > wish.baseline) news.push(reward(state, wish));
  }
  return news;
}

/** Monthly: deadlines run out, loyalty and grudges fade. Returns news items. */
export function tickWishes(state) {
  const w = CONFIG.wishes;
  const news = [];
  for (const wish of [...state.wishes]) {
    wish.monthsLeft -= 1;
    if (wish.monthsLeft > 0) continue;
    const c = state.citizens[wish.citizenId];
    c.envy += w.ignoreEnvy;
    c.happy += w.ignoreHappy;
    c.grudgeMonths = w.grudgeMonths;
    clampCitizen(c);
    state.wishes = state.wishes.filter((x) => x !== wish);
    news.push(`${c.name} ni dočakal${c.female ? 'a' : ''} svoje želje. Na Facebooku je že objavil${c.female ? 'a' : ''} 12 zapisov o tem.`);
  }
  for (const c of state.citizens) {
    if (c.loyalMonths > 0) c.loyalMonths -= 1;
    if (c.grudgeMonths > 0) c.grudgeMonths -= 1;
  }
  return news;
}
