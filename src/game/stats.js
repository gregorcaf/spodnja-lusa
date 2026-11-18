// Derived values: mood, support, averages, monthly balance.

import { CONFIG } from '../config.js';
import { activeDistricts, SIZE, idx } from './map.js';
import { roadNetwork, hasRoadAccess } from './roads.js';
import { taxRate } from './taxes.js';
import { upgradeMonthly } from './upgrades.js';
import { households, population } from './population.js';
import { harvestIncome } from './services.js';

/** Mood score used for both the figure colour and mayor support. */
export function moodScore(c, state) {
  // Citizens whose wish was fulfilled stay loyal for a while.
  const loyal = c.loyalMonths > 0 ? CONFIG.wishes.loyalBonus : 0;
  return c.happy - CONFIG.mood.envyWeight * c.envy + state.propaganda + loyal;
}

/** 'happy' | 'neutral' | 'unhappy' */
export function moodOf(c, state) {
  const s = moodScore(c, state);
  if (s > CONFIG.mood.greenAbove) return 'happy';
  if (s > CONFIG.mood.yellowAbove) return 'neutral';
  return 'unhappy';
}

/** Share (0..1) of the 25 named citizens on the mayor's side – they are the municipality's sample. */
export function supportShare(state) {
  return supportCount(state) / state.citizens.length;
}

/** Estimated supporters among all residents (the sample scaled up to the population). */
export function supportPeople(state) {
  return Math.round(supportShare(state) * population(state));
}

export function supportCount(state) {
  return state.citizens.filter((c) => moodScore(c, state) > CONFIG.mood.supportThreshold).length;
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export function averages(state) {
  return {
    happy: avg(state.citizens.map((c) => c.happy)),
    envy: avg(state.citizens.map((c) => c.envy)),
  };
}

/** Mood per district – only districts that exist (quarters + bought hamlets). */
export function districtStats(state) {
  return activeDistricts(state).map((d) => {
    const people = state.citizens.filter((c) => c.home === d.id);
    return {
      district: d,
      count: people.length,
      happy: avg(people.map((c) => c.happy)),
      envy: avg(people.map((c) => c.envy)),
    };
  });
}

export function countTiles(state, type) {
  return state.grid.filter((t) => t.type === type).length;
}

export function monthlyIncome(state) {
  const houses = households(state);
  const rate = taxRate(state);
  const fullTaxes = rate * houses;
  // During protests and riots part of the citizens refuse to pay (tax strike).
  const strike = state.unrest && state.unrest !== 'calm' ? Math.round(fullTaxes * CONFIG.unrest.taxStrike) : 0;
  // Inns and factories earn a fixed amount every month.
  // Inns and factories earn a fixed amount every month, some upgrades a bit more.
  let business = upgradeMonthly(state).income;
  // … but only when customers and workers can get there (road access).
  const network = roadNetwork(state);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const income = CONFIG.buildings[state.grid[idx(x, y)].type]?.income;
      if (income && hasRoadAccess(state, x, y, network)) business += income;
    }
  }
  return {
    base: CONFIG.economy.baseIncome,
    taxes: fullTaxes - strike,
    strike,
    houses,
    rate,
    business,
    harvest: harvestIncome(state), // vineyards, end of September only
    get total() {
      return this.base + this.taxes + this.business + this.harvest;
    },
  };
}

export function monthlyExpenses(state) {
  let upkeep = upgradeMonthly(state).upkeep;
  for (const t of state.grid) {
    const b = CONFIG.buildings[t.type];
    if (b) upkeep += b.upkeep;
  }
  return {
    base: CONFIG.economy.baseCost,
    upkeep,
    get total() {
      return this.base + this.upkeep;
    },
  };
}

/** Monthly sum of special deals from dilemma cards (positive = income). */
export function specialDeals(state) {
  return (state.modifiers || []).reduce((s, m) => s + (m.monthlyBudget || 0), 0);
}

export function monthlyBalance(state) {
  return monthlyIncome(state).total - monthlyExpenses(state).total + specialDeals(state);
}
