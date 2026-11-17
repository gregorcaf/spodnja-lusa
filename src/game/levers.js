// The mayor's levers: five buttons with immediate effects.

import { CONFIG } from '../config.js';
import { SIZE, idx } from './map.js';
import { LEVER_TEXTS, LEVER_ERRORS, NO_MONEY } from './texts.js';
import { clampCitizen } from './citizens.js';
import { clamp, randInt, pick, fillTemplate, formatEuro } from './util.js';

export const LEVER_IDS = ['cousin', 'praise', 'neighbor', 'snow', 'party'];

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
  if (id === 'snow' && state.snow) return { ok: false, reason: LEVER_ERRORS.snowActive };
  if (id === 'party') {
    if (state.party) return { ok: false, reason: LEVER_ERRORS.partyActive };
    if (!findFirehouses(state).length) return { ok: false, reason: LEVER_ERRORS.noFirehouse };
  }
  if (state.budget < cfg.cost) return { ok: false, reason: pick(NO_MONEY) };
  return { ok: true };
}

/** Uses a lever. Returns { ok, reason, toast, news }. */
export function useLever(state, id) {
  const check = checkLever(state, id);
  if (!check.ok) return check;

  const cfg = CONFIG.levers[id];
  const txt = LEVER_TEXTS[id];
  state.budget -= cfg.cost;

  switch (id) {
    case 'cousin': {
      const amount = Math.round(randInt(cfg.secretMin, cfg.secretMax) / 100) * 100;
      state.secret += amount;
      state.affair = clamp(state.affair + randInt(cfg.affairMin, cfg.affairMax));
      return {
        ok: true,
        toast: fillTemplate(txt.toast, { amount: formatEuro(amount) }),
        news: fillTemplate(txt.news, { project: pick(txt.projects), company: pick(txt.companies) }),
      };
    }

    case 'praise': {
      const gain = cfg.propaganda * state.leverMult.praise;
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
      const m = state.leverMult.party;
      state.leverMult.party *= cfg.decay;
      state.party = { x: site.x, y: site.y, remaining: cfg.duration };
      for (const c of state.citizens) {
        c.envy -= cfg.envyReduction * m;
        c.happy += cfg.happiness * m;
        clampCitizen(c);
      }
      return { ok: true, toast: txt.toast, news: pick(txt.news) };
    }

    default:
      return { ok: false, reason: '' };
  }
}

/** Monthly slow recovery of diminished lever strength. */
export function recoverLevers(state) {
  for (const id of ['praise', 'neighbor', 'party']) {
    const r = CONFIG.levers[id].recovery || 0;
    state.leverMult[id] = Math.min(1, state.leverMult[id] + r);
  }
}
