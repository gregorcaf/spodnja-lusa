// Building upgrades: bought once per building, with a one-off effect and sometimes a monthly one.
// tile.upgrades = [upgrade ids]

import { UPGRADES } from './content/upgrades.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { applyEffect } from './effects.js';

export function upgradesFor(type) {
  return UPGRADES[type] || [];
}

export function checkUpgrade(state, x, y, id) {
  const tile = state.grid[idx(x, y)];
  const up = upgradesFor(tile.type).find((u) => u.id === id);
  if (!up) return { ok: false, reason: '' };
  if (tile.build) return { ok: false, reason: 'Najprej mora biti stavba odprta.' };
  if (tile.upgrades?.includes(id)) return { ok: false, reason: 'To je že narejeno.' };
  if (state.budget < up.cost) return { ok: false, reason: 'Za to ni denarja. Morda drugo leto.' };
  return { ok: true, upgrade: up };
}

/** Buys an upgrade for the building at (x, y). Returns { ok, reason, news }. */
export function buyUpgrade(state, x, y, id) {
  const check = checkUpgrade(state, x, y, id);
  if (!check.ok) return check;
  const tile = state.grid[idx(x, y)];
  const up = check.upgrade;
  state.budget -= up.cost;
  tile.upgrades = [...(tile.upgrades || []), id];
  const district = districtOf(x, y);
  applyEffect(state, up.effect, { district });
  state.stats.upgrades = (state.stats.upgrades || 0) + 1;
  return { ok: true, news: `${DISTRICTS[district].name}: ${up.name}. ${up.desc}` };
}

/** Monthly money from upgrades: { income, upkeep } (both positive numbers). */
export function upgradeMonthly(state) {
  let income = 0;
  let upkeep = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = state.grid[idx(x, y)];
      for (const id of tile.upgrades || []) {
        const m = upgradesFor(tile.type).find((u) => u.id === id)?.monthly || 0;
        if (m > 0) income += m;
        else upkeep -= m;
      }
    }
  }
  return { income, upkeep };
}
