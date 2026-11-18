// Expanding the municipality: buy one of the plots around it and it becomes a new hamlet,
// with roads, a few first citizens, and room to build.

import { CONFIG } from '../config.js';
import { DISTRICTS, PLOTS, idx } from './map.js';
import { NEWCOMER_NAMES } from './texts.js';
import { createNewcomer, clampCitizen } from './citizens.js';
import { envyFactor } from './envy.js';
import { formatEuro } from './util.js';

export function hamletPrice(state) {
  const h = CONFIG.hamlets;
  return h.basePrice + h.priceStep * (state.hamlets || []).length;
}

export function checkHamlet(state, plotId) {
  if (!PLOTS.some((p) => p.id === plotId)) return { ok: false, reason: '' };
  if ((state.hamlets || []).includes(plotId)) return { ok: false, reason: 'To zemljišče je že naše.' };
  const price = hamletPrice(state);
  if (state.budget < price) return { ok: false, reason: `Za nakup zemljišča potrebuješ ${formatEuro(price)}. Kmet ne sprejema obljub.` };
  return { ok: true, price };
}

/** Buys a plot. Returns { ok, reason, news, tiles, citizens }. */
export function buyHamlet(state, plotId) {
  const check = checkHamlet(state, plotId);
  if (!check.ok) return check;
  state.budget -= check.price;
  state.hamlets = [...(state.hamlets || []), plotId];
  const plot = PLOTS.find((p) => p.id === plotId);
  const d = DISTRICTS[plotId];

  // Roads into the new hamlet (the main road continues, plus a side street).
  const tiles = [];
  for (const [x, y] of plot.roads) {
    state.grid[idx(x, y)] = { type: 'road', variant: Math.floor(Math.random() * 1000) };
    tiles.push({ x, y });
  }

  // The first settlers: new named citizens (they join the sample of "voices").
  const h = CONFIG.hamlets;
  const citizens = [];
  for (let i = 0; i < h.newCitizens; i++) {
    const n = state.newcomerIndex || 0;
    state.newcomerIndex = n + 1;
    const name = NEWCOMER_NAMES[n % NEWCOMER_NAMES.length];
    const c = createNewcomer(state, name, n % 2 === 1, plotId);
    state.citizens.push(c);
    citizens.push(c);
  }

  // The old quarters notice that the new hamlet gets all the attention.
  for (const c of state.citizens) {
    if (c.home === plotId) continue;
    c.envy += h.othersEnvy * envyFactor(c.home, plotId);
    c.envyTarget = { district: plotId, what: null };
    clampCitizen(c);
  }

  state.stats.hamlets = (state.stats.hamlets || 0) + 1;
  return {
    ok: true,
    tiles,
    citizens,
    news: `Občina je kupila zemljišče in ustanovila nov zaselek ${d.name}. Prvi prebivalci so ${citizens.map((c) => c.name.split(' ')[0]).join(', ')} – in en zelo zadovoljen kmet, ki je prodal njivo.`,
  };
}
