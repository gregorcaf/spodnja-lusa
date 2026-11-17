// The municipal house tax: the mayor sets it. More tax means more money and grumpier citizens;
// a very high tax also brings angry news, extra envy ("in Žlampe it's cheaper") and bigger protests.

import { CONFIG } from '../config.js';
import { clampCitizen } from './citizens.js';
import { TAX_NEWS } from './texts.js';
import { pick, formatEuro } from './util.js';

export function taxRate(state) {
  return state.taxRate ?? CONFIG.taxes.start;
}

/** 'low' | 'normal' | 'high' | 'veryHigh' */
export function taxLevel(rate) {
  const t = CONFIG.taxes;
  if (rate >= t.veryHighAt) return 'veryHigh';
  if (rate >= t.highAt) return 'high';
  if (rate < t.lowBelow) return 'low';
  return 'normal';
}

/** Monthly happiness change for every citizen caused by the tax (negative above the neutral rate). */
export function taxHappiness(rate) {
  const t = CONFIG.taxes;
  const v = ((t.neutral - rate) / 100) * t.happyPer100;
  return v || 0; // avoid −0 at the neutral rate
}

/** Sets the tax, rounded to the step and kept within limits. Returns the new rate. */
export function setTaxRate(state, rate) {
  const t = CONFIG.taxes;
  const r = Math.round(rate / t.step) * t.step;
  state.taxRate = Math.max(t.min, Math.min(t.max, r));
  return state.taxRate;
}

/** Applies the monthly effect of the tax. Returns news items. */
export function applyMonthlyTax(state) {
  const rate = taxRate(state);
  const news = [];
  const happy = taxHappiness(rate);
  const veryHigh = taxLevel(rate) === 'veryHigh';
  for (const c of state.citizens) {
    c.happy += happy;
    if (veryHigh) c.envy += CONFIG.taxes.veryHighEnvy;
    clampCitizen(c);
  }

  // Tell people when the tax changed since last month.
  const prev = state.lastTaxRate ?? CONFIG.taxes.start;
  if (rate !== prev) {
    const list = rate > prev ? TAX_NEWS.raised : TAX_NEWS.lowered;
    news.push(pick(list).replace('{rate}', formatEuro(rate)));
  } else if (veryHigh && Math.random() < 0.5) {
    news.push(pick(TAX_NEWS.veryHigh));
  }
  state.lastTaxRate = rate;
  return news;
}
