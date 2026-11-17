// The mayor's levers: five buttons with immediate effects.

import { CONFIG } from '../config.js';
import { SIZE, idx } from './map.js';
import { LEVER_TEXTS, LEVER_ERRORS, NO_MONEY } from './texts.js';
import { clampCitizen } from './citizens.js';
import { clamp, randInt, pick, fillTemplate, formatEuro } from './util.js';
import { seasonOf } from './seasons.js';

export const LEVER_IDS = ['cousin', 'praise', 'neighbor', 'snow', 'party', 'media', 'minister'];

export function findFirehouses(state) {
  const out = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type === 'firehouse') out.push({ x, y });
    }
  }
  return out;
}

/** Validates a lever without using it. Returns { ok, reason }. */
export function checkLever(state, id) {
  const cfg = CONFIG.levers[id];
  const blocked = state.modifiers.find((m) => m.blockLever === id);
  if (blocked) return { ok: false, reason: `${blocked.label}: ta vzvod še ${blocked.months} mes. ni na voljo.` };
  if (id === 'minister' && state.scheduled.some((s) => s.key === 'minister')) {
    return { ok: false, reason: LEVER_ERRORS.ministerPending };
  }
  if (id === 'snow' && state.snow) return { ok: false, reason: LEVER_ERRORS.snowActive };
  if (id === 'party') {
    if (state.party) return { ok: false, reason: LEVER_ERRORS.partyActive };
    if (!findFirehouses(state).length) return { ok: false, reason: LEVER_ERRORS.noFirehouse };
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
      const amount = Math.round(randInt(cfg.secretMin, cfg.secretMax) / 100) * 100;
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
      // Snow in winter surprises nobody: no money for the winter service, no media distraction.
      const winter = seasonOf(state.month) === 'winter';
      if (!winter) {
        state.secret += cfg.secret;
        state.affair = clamp(state.affair + cfg.affair);
      }
      for (const c of state.citizens) {
        c.happy += winter ? Math.round(cfg.happiness / 2) : cfg.happiness;
        clampCitizen(c);
      }
      if (winter) return { ok: true, toast: txt.winterToast, news: txt.winterNews };
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    case 'party': {
      const site = pick(findFirehouses(state));
      const m = state.leverMult.party;
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
  for (const id of ['praise', 'neighbor', 'party', 'media']) {
    const r = CONFIG.levers[id].recovery || 0;
    state.leverMult[id] = Math.min(1, state.leverMult[id] + r);
  }
}
