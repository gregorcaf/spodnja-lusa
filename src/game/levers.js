// The mayor's levers: five buttons with immediate effects.

import { CONFIG } from '../config.js';
import { SIZE, idx, DISTRICTS, districtOf, isOwned, isWalkable } from './map.js';
import { roadNetwork, hasRoadAccess } from './roads.js';
import { LEVER_TEXTS, LEVER_ERRORS, NO_MONEY } from './texts.js';
import { clampCitizen } from './citizens.js';
import { clamp, randInt, pick, fillTemplate, formatEuro, capitalize } from './util.js';
import { seasonOf } from './seasons.js';
import { partyWineBonus } from './services.js';
import { districtStats } from './stats.js';
import { spawnWish } from './wishes.js';

/** Puts a lever on cooldown (shown with the lasting deals). */
function cooldown(state, id, months) {
  state.modifiers.push({ key: `${id}-cooldown`, label: LEVER_TEXTS[id].cooldown, months, blockLever: id });
}

/** Levers that bring the village together on the map (one gathering at a time). */
const GATHERINGS = ['party', 'holiday', 'contest', 'assembly'];

/** A meadow by the road near the middle of a district, where the town-hall meeting is held. */
export function districtCenter(state, district) {
  const tiles = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) if (districtOf(x, y) === district && isOwned(state, x, y)) tiles.push({ x, y });
  }
  if (!tiles.length) return { x: 0, y: 0 };
  const cx = tiles.reduce((a, t) => a + t.x, 0) / tiles.length;
  const cy = tiles.reduce((a, t) => a + t.y, 0) / tiles.length;
  const dist = (t) => Math.hypot(t.x - cx, t.y - cy);
  const network = roadNetwork(state);
  const meadows = tiles.filter((t) => state.grid[idx(t.x, t.y)].type === 'grass' && hasRoadAccess(state, t.x, t.y, network));
  const roads = tiles.filter((t) => isWalkable(state.grid[idx(t.x, t.y)].type));
  const pool = meadows.length ? meadows : roads.length ? roads : tiles;
  return pool.reduce((a, b) => (dist(b) < dist(a) ? b : a));
}

/** The church tile: the holiday is celebrated on the square in front of it. */
function churchTile(state) {
  const i = state.grid.findIndex((t) => t.type === 'church');
  return { x: i % SIZE, y: Math.floor(i / SIZE) };
}

/** The district whose residents are, on average, the most envious. */
export function mostEnviousDistrict(state) {
  const stats = districtStats(state).filter((s) => s.count > 0);
  return stats.reduce((a, b) => (b.envy > a.envy ? b : a), stats[0])?.district.id ?? 0;
}

export const LEVER_IDS = ['cousin', 'praise', 'neighbor', 'snow', 'party', 'holiday', 'contest', 'assembly', 'media', 'minister'];

/** Fire stations that work, i.e. firefighters can drive out (road access). `all` also returns unreachable ones. */
export function findFirehouses(state, { all = false } = {}) {
  const network = roadNetwork(state);
  const out = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type === 'firehouse' && (all || hasRoadAccess(state, x, y, network))) out.push({ x, y });
    }
  }
  return out;
}

/** Validates a lever without using it. Returns { ok, reason }. */
export function checkLever(state, id) {
  const cfg = CONFIG.levers[id];
  const blocked = state.modifiers.find((m) => m.blockLever === id);
  if (blocked) return { ok: false, reason: `${blocked.label}: ta vzvod še ${blocked.months} mes. ni na voljo.` };
  if (id === 'cousin' && (state.cousinThisMonth || 0) >= cfg.perMonth) {
    return { ok: false, reason: LEVER_ERRORS.cousinLimit.replace('{n}', cfg.perMonth) };
  }
  if (id === 'minister' && state.scheduled.some((s) => s.key === 'minister')) {
    return { ok: false, reason: LEVER_ERRORS.ministerPending };
  }
  if (id === 'snow' && state.snow) return { ok: false, reason: LEVER_ERRORS.snowActive };
  // "Snow in the middle of May" only works when snow is a surprise.
  if (id === 'snow' && seasonOf(state.month) === 'winter') return { ok: false, reason: LEVER_ERRORS.snowWinter };
  if (GATHERINGS.includes(id) && (state.party || state.gathering)) {
    return { ok: false, reason: id === 'party' && state.party ? LEVER_ERRORS.partyActive : LEVER_ERRORS.gatheringActive };
  }
  if (id === 'contest' && !findFirehouses(state).length) {
    const unreachable = findFirehouses(state, { all: true }).length > 0;
    return { ok: false, reason: unreachable ? LEVER_ERRORS.firehouseNoRoad : LEVER_ERRORS.contestNoFirehouse };
  }
  if (id === 'holiday' && state.unrest !== 'calm') return { ok: false, reason: LEVER_ERRORS.holidayUnrest };
  if (id === 'party') {
    if (state.party) return { ok: false, reason: LEVER_ERRORS.partyActive };
    // Nobody dances while the village is out on the street.
    if (state.unrest !== 'calm') return { ok: false, reason: LEVER_ERRORS.partyUnrest };
    if (!findFirehouses(state).length) {
      const unreachable = findFirehouses(state, { all: true }).length > 0;
      return { ok: false, reason: unreachable ? LEVER_ERRORS.firehouseNoRoad : LEVER_ERRORS.noFirehouse };
    }
  }
  if (LEVER_TEXTS[id].fromSecret) {
    if (state.secret < cfg.cost) return { ok: false, reason: LEVER_ERRORS.noSecret };
  } else if (state.budget < cfg.cost) {
    return { ok: false, reason: pick(NO_MONEY) };
  }
  return { ok: true };
}

/** Uses a lever. Returns { ok, reason, toast, news }. */
export function useLever(state, id) {
  const check = checkLever(state, id);
  if (!check.ok) return check;

  const cfg = CONFIG.levers[id];
  const txt = LEVER_TEXTS[id];
  if (txt.fromSecret) state.secret -= cfg.cost;
  else state.budget -= cfg.cost;

  switch (id) {
    case 'cousin': {
      // Every tender in a row pays less – the cousin's "firm" can only invoice so much.
      const amount = Math.round((randInt(cfg.secretMin, cfg.secretMax) * state.leverMult.cousin) / 100) * 100;
      state.leverMult.cousin *= cfg.decay;
      state.cousinThisMonth = (state.cousinThisMonth || 0) + 1;
      state.secret += amount;
      state.stats.cousins += 1;
      state.affair = clamp(state.affair + randInt(cfg.affairMin, cfg.affairMax));
      return {
        ok: true,
        toast: fillTemplate(txt.toast, { amount: formatEuro(amount) }),
        news: fillTemplate(txt.news, { project: pick(txt.projects), company: pick(txt.companies) }),
      };
    }

    case 'praise': {
      // During the election campaign the newsletter works better.
      const boost = state.campaign ? CONFIG.elections.campaignPraiseBoost : 1;
      const gain = cfg.propaganda * state.leverMult.praise * boost;
      state.propaganda += gain;
      state.leverMult.praise *= cfg.decay;
      for (const c of state.citizens) {
        if (c.character === 'grumbler') {
          c.envy += cfg.grumblerEnvy;
          clampCitizen(c);
        }
      }
      return {
        ok: true,
        toast: fillTemplate(txt.toast, { n: gain.toFixed(1).replace('.', ',') }),
        news: pick(txt.news),
      };
    }

    case 'neighbor': {
      const drop = cfg.envyReduction * state.leverMult.neighbor;
      state.leverMult.neighbor *= cfg.decay;
      for (const c of state.citizens) {
        c.envy -= drop;
        c.envyTarget = { district: 'neighbor', what: null };
        clampCitizen(c);
      }
      return {
        ok: true,
        toast: fillTemplate(txt.toast, { n: drop.toFixed(1).replace('.', ',') }),
        news: pick(txt.news),
      };
    }

    case 'snow': {
      state.snow = true;
      state.secret += cfg.secret;
      state.affair = clamp(state.affair + cfg.affair);
      for (const c of state.citizens) {
        c.happy += cfg.happiness;
        clampCitizen(c);
      }
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    case 'party': {
      const site = pick(findFirehouses(state));
      // Local wine makes the party work better (but doesn't slow its wear-off).
      const m = state.leverMult.party * partyWineBonus(state);
      state.leverMult.party *= cfg.decay;
      state.party = { x: site.x, y: site.y, remaining: cfg.duration };
      state.stats.parties += 1;
      // Everyone is too busy dancing to read about the affair.
      state.affair = clamp(state.affair + cfg.affair);
      for (const c of state.citizens) {
        c.envy -= cfg.envyReduction * m;
        c.happy += cfg.happiness * m;
        clampCitizen(c);
      }
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    case 'holiday': {
      for (const c of state.citizens) {
        c.envy -= cfg.envyReduction;
        c.happy += cfg.happiness;
        clampCitizen(c);
      }
      state.propaganda += cfg.propaganda;
      cooldown(state, id, cfg.cooldown);
      state.gathering = { kind: id, ...churchTile(state), remaining: cfg.duration };
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    case 'contest': {
      const drop = cfg.envyReduction * state.leverMult.contest;
      state.leverMult.contest *= cfg.decay;
      const stations = findFirehouses(state);
      const win = Math.random() < Math.min(cfg.winMax, cfg.winBase + (stations.length - 1) * cfg.winPerFirehouse);
      const site = pick(stations);
      state.gathering = { kind: id, x: site.x, y: site.y, remaining: cfg.duration, win };
      for (const c of state.citizens) {
        c.envy -= drop;
        c.happy += win ? cfg.winHappy : cfg.loseHappy;
        c.envyTarget = { district: 'neighbor', what: null };
        clampCitizen(c);
      }
      if (win) state.propaganda += cfg.winPropaganda;
      const news = [pick(win ? txt.win : txt.lose)];
      // Sometimes the after-party with the Žlampe team ends in a fight.
      if (Math.random() < cfg.brawlChance) {
        state.affair = clamp(state.affair + cfg.brawlAffair);
        state.budget -= cfg.brawlCost;
        news.push(fillTemplate(txt.brawl, { cost: formatEuro(cfg.brawlCost) }));
      }
      return {
        ok: true,
        toast: fillTemplate(win ? txt.toastWin : txt.toastLose, { n: drop.toFixed(1).replace('.', ',') }),
        news: news.join(' '),
      };
    }

    case 'assembly': {
      const district = mostEnviousDistrict(state);
      const d = DISTRICTS[district];
      const locals = state.citizens.filter((c) => c.home === district);
      for (const c of locals) {
        c.envy -= cfg.envyReduction;
        c.happy += cfg.happiness;
        clampCitizen(c);
      }
      cooldown(state, id, cfg.cooldown);
      state.gathering = { kind: id, ...districtCenter(state, district), district, remaining: cfg.duration };
      // Someone always stands up at the end with a request. Ignore it and the envy comes back.
      const busy = new Set(state.wishes.map((w) => w.citizenId));
      const asker = locals.filter((c) => !busy.has(c.id)).sort((a, b) => b.envy - a.envy)[0];
      const wish = asker ? spawnWish(state, asker) : null;
      const vars = { loc: d.loc, Loc: capitalize(d.loc) };
      return { ok: true, wish, toast: fillTemplate(txt.toast, vars), news: fillTemplate(pick(txt.news), vars) };
    }

    case 'minister': {
      // The grant (or its absence) arrives a couple of months later.
      state.scheduled.push({
        key: 'minister',
        in: cfg.delay,
        chance: cfg.chance,
        effect: { budget: cfg.payout },
        news: txt.success,
        elseNews: txt.failure,
        ctx: {},
      });
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    case 'media': {
      const drop = -cfg.affair * state.leverMult.media;
      state.leverMult.media *= cfg.decay;
      state.affair = clamp(state.affair - drop);
      return {
        ok: true,
        toast: fillTemplate(txt.toast, { n: drop.toFixed(1).replace('.', ',') }),
        news: pick(txt.news),
      };
    }

    default:
      return { ok: false, reason: '' };
  }
}

/** Monthly slow recovery of diminished lever strength. */
export function recoverLevers(state) {
  state.cousinThisMonth = 0;
  for (const id of ['cousin', 'praise', 'neighbor', 'party', 'media', 'contest']) {
    const r = CONFIG.levers[id].recovery || 0;
    state.leverMult[id] = Math.min(1, state.leverMult[id] + r);
  }
}
