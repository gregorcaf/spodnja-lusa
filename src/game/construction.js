// New buildings: scaffolding first, then an opening ceremony that waits for the mayor's scissors.
// tile.build = { phase: 'construction' | 'opening', left: game-months }

import { CONFIG } from '../config.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { BUILDINGS } from './texts.js';
import { applyEffect } from './effects.js';
import { capitalize, fillTemplate, pick } from './util.js';

const RIBBON_NEWS = [
  'Župan je {loc} slovesno prerezal trak in odprl {what}. Godba je igrala, škarje so bile zlate.',
  'Otvoritev {whatGen} {loc}: župan je prerezal trak v prvem poskusu. Prisotni so zaploskali iz olajšanja.',
];
const MISSED_NEWS = [
  'Župana ni bilo na otvoritvi {whatGen} {loc}. Trak je prerezal bratranec. Z zobmi.',
  '{Loc} so odprli {what} brez župana. Na fotografiji je ostal prazen prostor v obliki župana.',
];
const GENITIVE = { roundabout: 'krožišča', firehouse: 'gasilskega doma', hall: 'večnamenske dvorane', inn: 'gostilne', factory: 'tovarne' };

/** Puts scaffolding on a freshly built tile (types without a construction time open at once). */
export function startConstruction(tile) {
  const months = CONFIG.construction.months[tile.type];
  if (months) tile.build = { phase: 'construction', left: months };
}

function text(template, type, x, y) {
  const d = DISTRICTS[districtOf(x, y)];
  return fillTemplate(template, { loc: d.loc, Loc: capitalize(d.loc), what: BUILDINGS[type].what, whatGen: GENITIVE[type] || '' });
}

/**
 * Advances construction and openings. Returns changes:
 * [{ x, y, kind: 'opening' | 'built' | 'missed', news? }]
 */
export function tickConstruction(state, months) {
  const out = [];
  const c = CONFIG.construction;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = state.grid[idx(x, y)];
      const b = tile.build;
      if (!b) continue;
      b.left -= months;
      if (b.left > 0) continue;
      if (b.phase === 'construction') {
        if (c.ribbonPropaganda[tile.type]) {
          tile.build = { phase: 'opening', left: c.ribbonWindow };
          out.push({ x, y, kind: 'opening' });
        } else {
          delete tile.build;
          out.push({ x, y, kind: 'built' });
        }
      } else {
        // Nobody came to cut the ribbon.
        delete tile.build;
        applyEffect(state, { districtHappy: c.missedDistrictHappy }, { district: districtOf(x, y) });
        out.push({ x, y, kind: 'missed', news: text(pick(MISSED_NEWS), tile.type, x, y) });
      }
    }
  }
  return out;
}

/** Buildings waiting for the ribbon to be cut: [{ x, y, type, left }]. */
export function pendingRibbons(state) {
  const out = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = state.grid[idx(x, y)];
      if (t.build?.phase === 'opening') out.push({ x, y, type: t.type, left: t.build.left / CONFIG.construction.ribbonWindow });
    }
  }
  return out;
}

/** The mayor cuts the ribbon. Returns { ok, news } . */
export function cutRibbon(state, x, y) {
  const tile = state.grid[idx(x, y)];
  if (tile.build?.phase !== 'opening') return { ok: false };
  delete tile.build;
  const c = CONFIG.construction;
  applyEffect(state, { districtHappy: c.ribbonDistrictHappy, propaganda: c.ribbonPropaganda[tile.type] || 0 }, { district: districtOf(x, y) });
  state.stats.ribbons = (state.stats.ribbons || 0) + 1;
  return { ok: true, news: text(pick(RIBBON_NEWS), tile.type, x, y) };
}
