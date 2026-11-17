// Turn handling: advance one month and produce the monthly report.

import { CONFIG } from '../config.js';
import { MONTHS } from './texts.js';
import { clampCitizen, pickThought } from './citizens.js';
import { recoverLevers } from './levers.js';
import { monthlyIncome, monthlyExpenses, districtStats, specialDeals } from './stats.js';
import { tickModifiers, runScheduled } from './effects.js';
import { tickWishes } from './wishes.js';
import { applyMonthlyUnrest, assignProtesters } from './unrest.js';
import { pick } from './util.js';

export function dateLabel(state) {
  return `${MONTHS[state.month]} ${state.year}`;
}

export function advanceMonth(state) {
  const closedMonth = dateLabel(state);
  const income = monthlyIncome(state);
  const expenses = monthlyExpenses(state);
  const startBudget = state.budget;
  const special = specialDeals(state);

  state.budget += income.total - expenses.total + special;
  const unrest = applyMonthlyUnrest(state);
  if (unrest.damage) state.stats.burned += 1;
  tickModifiers(state);
  // Delayed consequences of earlier dilemma choices.
  const events = runScheduled(state);
  const wishNews = tickWishes(state);

  const m = CONFIG.month;
  for (const c of state.citizens) {
    c.happy += (m.happinessTarget - c.happy) * m.happinessPull;
    c.envy += m.envyDrift + state.extraEnvyDrift;
    clampCitizen(c);
  }
  state.propaganda = Math.max(0, state.propaganda - m.propagandaDecay);
  state.affair = Math.max(0, state.affair - m.affairDecay);
  recoverLevers(state);

  // Snow lasts only until the next month.
  state.snow = false;
  state.monthProgress = 0;

  state.monthIndex += 1;
  state.month += 1;
  if (state.month > 11) {
    state.month = 0;
    state.year += 1;
    state.envelopesThisYear = 0; // envelope prices start over every January
  }

  // Moods changed, so the crowd on the street may change too.
  assignProtesters(state);

  const ds = districtStats(state);
  const happiest = ds.reduce((a, b) => (b.happy > a.happy ? b : a));
  const enviest = ds.reduce((a, b) => (b.envy > a.envy ? b : a));
  const thinker = pick(state.citizens);
  thinker.thought = pickThought(thinker, state);

  return {
    month: closedMonth,
    newMonth: dateLabel(state),
    income: {
      base: income.base,
      taxes: income.taxes,
      strike: income.strike,
      houses: income.houses,
      business: income.business,
      total: income.total,
    },
    expenses: { base: expenses.base, upkeep: expenses.upkeep, total: expenses.total },
    special,
    balance: income.total - expenses.total + special - (unrest.damage ? unrest.damage.cost : 0),
    events,
    wishNews,
    unrest: unrest.level,
    damage: unrest.damage,
    startBudget,
    budget: state.budget,
    happiest: { name: happiest.district.name, value: happiest.happy },
    enviest: { name: enviest.district.name, value: enviest.envy },
    thought: { name: thinker.name, text: thinker.thought },
  };
}
