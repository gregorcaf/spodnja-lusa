// Turn handling: advance one month and produce the monthly report.

import { CONFIG } from '../config.js';
import { MONTHS } from './texts.js';
import { clampCitizen, pickThought } from './citizens.js';
import { recoverLevers } from './levers.js';
import { monthlyIncome, monthlyExpenses, districtStats } from './stats.js';
import { pick } from './util.js';

export function dateLabel(state) {
  return `${MONTHS[state.month]} ${state.year}`;
}

export function advanceMonth(state) {
  const closedMonth = dateLabel(state);
  const income = monthlyIncome(state);
  const expenses = monthlyExpenses(state);
  const startBudget = state.budget;

  state.budget += income.total - expenses.total;

  const m = CONFIG.month;
  for (const c of state.citizens) {
    c.happy += (m.happinessTarget - c.happy) * m.happinessPull;
    c.envy += m.envyDrift;
    clampCitizen(c);
  }
  state.propaganda = Math.max(0, state.propaganda - m.propagandaDecay);
  state.affair = Math.max(0, state.affair - m.affairDecay);
  recoverLevers(state);

  // Snow lasts only until the next month.
  state.snow = false;

  state.month += 1;
  if (state.month > 11) {
    state.month = 0;
    state.year += 1;
  }

  const ds = districtStats(state);
  const happiest = ds.reduce((a, b) => (b.happy > a.happy ? b : a));
  const enviest = ds.reduce((a, b) => (b.envy > a.envy ? b : a));
  const thinker = pick(state.citizens);
  thinker.thought = pickThought(thinker, state);

  return {
    month: closedMonth,
    newMonth: dateLabel(state),
    income: { base: income.base, taxes: income.taxes, houses: income.houses, total: income.total },
    expenses: { base: expenses.base, upkeep: expenses.upkeep, total: expenses.total },
    balance: income.total - expenses.total,
    startBudget,
    budget: state.budget,
    happiest: { name: happiest.district.name, value: happiest.happy },
    enviest: { name: enviest.district.name, value: enviest.envy },
    thought: { name: thinker.name, text: thinker.thought },
  };
}
