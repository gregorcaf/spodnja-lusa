// Derived values: mood, support, averages, monthly balance.

import { CONFIG } from '../config.js';
import { DISTRICTS } from './map.js';

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

export function districtStats(state) {
  return DISTRICTS.map((d) => {
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
  const houses = countTiles(state, 'house');
  const fullTaxes = CONFIG.economy.taxPerHouse * houses;
  // During protests and riots part of the citizens refuse to pay (tax strike).
  const strike = state.unrest && state.unrest !== 'calm' ? Math.round(fullTaxes * CONFIG.unrest.taxStrike) : 0;
  // Inns and factories earn a fixed amount every month.
  let business = 0;
  for (const t of state.grid) business += CONFIG.buildings[t.type]?.income || 0;
  return {
    base: CONFIG.economy.baseIncome,
    taxes: fullTaxes - strike,
    strike,
    houses,
    business,
    get total() {
      return this.base + this.taxes + this.business;
    },
  };
}

export function monthlyExpenses(state) {
  let upkeep = 0;
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
