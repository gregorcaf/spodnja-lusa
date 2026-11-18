// Public buildings with their own rules: clinic, police, shop, vineyard and cemetery.
// A building only "works" once its scaffolding is gone and (where needed) a road reaches it.

import { CONFIG } from '../config.js';
import { SIZE, idx, districtOf, DISTRICTS } from './map.js';
import { NEEDS_ROAD, roadNetwork, hasRoadAccess } from './roads.js';
import { clampCitizen } from './citizens.js';
import { population } from './population.js';
import { SERVICE_NEWS } from './texts.js';
import { clamp, pick, fillTemplate, formatEuro, capitalize } from './util.js';

/** Working buildings of a type: [{ x, y, district }]. */
export function working(state, type, network = null) {
  const out = [];
  const needsRoad = NEEDS_ROAD.has(type);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = state.grid[idx(x, y)];
      if (t.type !== type || t.build) continue;
      if (needsRoad) {
        network ??= roadNetwork(state);
        if (!hasRoadAccess(state, x, y, network)) continue;
      }
      out.push({ x, y, district: districtOf(x, y) });
    }
  }
  return out;
}

export function canBuildClinic(state) {
  return population(state) >= CONFIG.services.clinicMin;
}

/** Districts protected from riot fires by a working police station. */
export function policeDistricts(state) {
  return new Set(working(state, 'police').map((p) => p.district));
}

/** Share of protest vandalism that still has to be paid (police keeps an eye on things). */
export function vandalismShare(state) {
  return working(state, 'police').length ? CONFIG.services.policeVandalismShare : 1;
}

/** Is the municipality big enough to need a cemetery, and does it lack one? */
export function cemeteryMissing(state) {
  return population(state) >= CONFIG.services.cemeteryNeededAt && !state.grid.some((t) => t.type === 'cemetery' && !t.build);
}

/** How much better the party works thanks to the local wine (1 = no vineyards). */
export function partyWineBonus(state) {
  const s = CONFIG.services;
  return 1 + Math.min(s.vineyardPartyMax, working(state, 'vineyard').length) * s.vineyardPartyBonus;
}

/** Harvest money for the month being closed (only at the end of September). */
export function harvestIncome(state) {
  if (state.month !== 8) return 0;
  return working(state, 'vineyard').length * CONFIG.services.vineyardHarvest;
}

/**
 * Monthly effects of the public buildings (the harvest money itself is part of the income).
 * Returns news lines for the month report.
 */
export function applyMonthlyServices(state) {
  const s = CONFIG.services;
  const news = [];
  const network = roadNetwork(state);

  // A working clinic keeps everyone a little healthier and happier (one is enough).
  const clinic = working(state, 'clinic', network).length > 0;
  // A shop in your own district: no need to drive to town.
  const shopDistricts = new Set(working(state, 'shop', network).map((p) => p.district));
  const noCemetery = cemeteryMissing(state);
  for (const c of state.citizens) {
    if (clinic) c.happy += s.clinicMonthlyHappy;
    if (shopDistricts.has(c.home)) c.happy += s.shopMonthlyHappy;
    if (noCemetery) c.happy += s.cemeteryMissingHappy;
    clampCitizen(c);
  }
  if (noCemetery && Math.random() < 0.35) news.push(pick(SERVICE_NEWS.noCemetery));

  // Harvest: the vineyards pay out, and the tastings with the right people get noticed.
  const harvest = harvestIncome(state);
  if (harvest) {
    const vineyards = harvest / s.vineyardHarvest;
    state.affair = clamp(state.affair + vineyards * s.vineyardHarvestAffair);
    news.push(fillTemplate(pick(SERVICE_NEWS.harvest), { money: formatEuro(harvest) }));
  }
  return news;
}

/** News when the police stopped a riot fire in a district. */
export function policeSavedNews(district) {
  const d = DISTRICTS[district];
  return fillTemplate(SERVICE_NEWS.policeSaved, { loc: d.loc, Loc: capitalize(d.loc) });
}
