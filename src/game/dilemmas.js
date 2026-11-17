// Dilemma cards: picking a fitting card, filling its text and resolving a choice.

import { DILEMMAS } from './content/dilemmas.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { applyEffect, describeEffect } from './effects.js';
import { pick, capitalize, fillTemplate } from './util.js';

/** Districts that contain at least one tile of `type`. */
function districtsWith(state, type) {
  const set = new Set();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) if (state.grid[idx(x, y)].type === type) set.add(districtOf(x, y));
  }
  return [...set];
}

/** Builds a concrete card instance (district, citizen) or null if the card doesn't fit right now. */
function instantiate(card, state) {
  if (card.when && !card.when(state)) return null;
  let district = null;
  if (card.district === 'random') district = Math.floor(Math.random() * DISTRICTS.length);
  else if (card.district) {
    const options = districtsWith(state, card.district);
    if (!options.length) return null;
    district = pick(options);
  }
  let citizenId = null;
  if (card.citizen) {
    const pool = state.citizens.filter((c) => card.citizen === true || c.character === card.citizen);
    if (!pool.length) return null;
    const c = pick(pool);
    citizenId = c.id;
    if (district == null) district = c.home;
  }
  return { id: card.id, ctx: { district, citizenId } };
}

/** Picks the next card. Cards don't repeat until every currently possible card has been shown. */
export function drawDilemma(state) {
  const tryDraw = () => {
    const fresh = DILEMMAS.filter((c) => !state.usedDilemmas.includes(c.id));
    for (const card of shuffleCopy(fresh)) {
      const inst = instantiate(card, state);
      if (inst) return inst;
    }
    return null;
  };
  let inst = tryDraw();
  if (!inst) {
    state.usedDilemmas = [];
    inst = tryDraw();
  }
  if (inst) state.usedDilemmas.push(inst.id);
  return inst;
}

function shuffleCopy(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardById(id) {
  return DILEMMAS.find((c) => c.id === id);
}

function fill(text, ctx, state) {
  const d = ctx.district != null ? DISTRICTS[ctx.district] : null;
  const c = ctx.citizenId != null ? state.citizens[ctx.citizenId] : null;
  return fillTemplate(
    text,
    {
      loc: d ? d.loc : '',
      Loc: d ? capitalize(d.loc) : '',
      district: d ? d.name : '',
      name: c ? c.name : '',
      first: c ? c.name.split(' ')[0] : '',
    },
    c ? c.female : false,
  );
}

/** Everything the UI needs to show a card. */
export function presentDilemma(inst, state) {
  const card = cardById(inst.id);
  return {
    title: card.title,
    text: fill(card.text, inst.ctx, state),
    options: card.options.map((o) => ({
      label: o.label,
      effects: describeEffect(o.effect, inst.ctx, state),
      unknown: !!(o.later && o.later.length),
    })),
  };
}

/** Applies the chosen option. Returns { news, tiles }. Delayed consequences are scheduled. */
export function resolveDilemma(state, inst, optionIndex) {
  const card = cardById(inst.id);
  const option = card.options[optionIndex];
  const { tiles } = applyEffect(state, option.effect, inst.ctx);
  for (const l of option.later || []) {
    state.scheduled.push({
      in: l.in,
      chance: l.chance,
      effect: l.effect,
      elseEffect: l.elseEffect,
      news: l.news ? fill(l.news, inst.ctx, state) : null,
      elseNews: l.elseNews ? fill(l.elseNews, inst.ctx, state) : null,
      ctx: inst.ctx,
    });
  }
  return { news: option.news ? fill(option.news, inst.ctx, state) : null, tiles };
}
