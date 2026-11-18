// Small hidden surprises (not explained anywhere in the game):
//  - a rare visitor: a strong man with a little mare carrying "something" across the municipality
//    (a nod to the folk tale of Martin Krpan, the salt smuggler),
//  - typing »cviček« on the keyboard: a round of the local wine for everyone,
//  - ringing the church bell by clicking the church seven times in a row.

import { clampCitizen } from './citizens.js';
import { pick } from './util.js';

export const EGGS = {
  krpanMonthlyChance: 0.06,
  krpanCooldownMonths: 12, // at most one visit a year
  krpanMonths: 0.9, // how long he takes to cross the map (game-months)
  krpanSalt: 2500, // the winter service is happy with a sack of "something white"
  cvicekSeconds: 30, // everyone sways this long
  cvicekCooldownMonths: 6,
  bellClicks: 7,
};

const KRPAN_NEWS = {
  arrive: [
    'Čez občino gre močan možak s kobilico. Na njej tovor, za katerega pravi, da so brusni kamni. Carinik je pogledal stran.',
    'Na glavni cesti so opazili orjaka s kobilico in sumljivim tovorom. Lojze pravi, da je sol. Lojze pravi marsikaj.',
  ],
  met: 'Župan je ustavil možaka s kobilico. Ta mu je za zimsko službo pustil vrečo »brusnih kamnov«. Čudno, da se topijo na cesti.',
  left: 'Možak s kobilico je odšel proti Vrhu. Nihče ga ni ustavil, kar je za {obcino} običajno.',
};

const CVICEK_NEWS = [
  'Nekdo je v občinski hiši odprl sod cvička. Pol ure kasneje je bila seja najbolj soglasna doslej.',
  'Cviček za vse! Kmetijski svetovalec pravi, da je »rahlo kiselkast, a zelo pomirjujoč«.',
];

const BELL_NEWS = [
  'Mežnar je zvonil poldne ob napačni uri. Pol vasi je prišlo k maši, druga polovica na kosilo.',
  'Zvonovi so zvonili brez razloga. Župnik je to razglasil za čudež, mežnar za okvaro.',
];

/** Monthly roll for the rare visitor. Returns the news when he shows up, else null. */
export function rollKrpan(state) {
  if (state.krpan) return null;
  if (state.monthIndex - (state.krpanLastMonth ?? -99) < EGGS.krpanCooldownMonths) return null;
  if (Math.random() >= EGGS.krpanMonthlyChance) return null;
  state.krpan = { left: EGGS.krpanMonths, met: false };
  state.krpanLastMonth = state.monthIndex;
  return pick(KRPAN_NEWS.arrive);
}

/** Moves him along (game-months). Returns the farewell news when he leaves. */
export function tickKrpan(state, months) {
  if (!state.krpan) return null;
  state.krpan.left -= months;
  if (state.krpan.left > 0) return null;
  const met = state.krpan.met;
  state.krpan = null;
  return met ? null : KRPAN_NEWS.left;
}

/** How far across the map he is (0 = just arrived, 1 = gone). */
export function krpanProgress(state) {
  return state.krpan ? 1 - state.krpan.left / EGGS.krpanMonths : 0;
}

/** The mayor stops him: a sack of salt for the winter service, once per visit. */
export function meetKrpan(state) {
  if (!state.krpan || state.krpan.met) return { ok: false };
  state.krpan.met = true;
  state.budget += EGGS.krpanSalt;
  return { ok: true, news: KRPAN_NEWS.met, money: EGGS.krpanSalt };
}

/** »cviček« typed on the keyboard: everyone gets a glass (and walks a bit wobbly). */
export function pourCvicek(state) {
  if (state.monthIndex - (state.cvicekLastMonth ?? -99) < EGGS.cvicekCooldownMonths) return { ok: false };
  state.cvicekLastMonth = state.monthIndex;
  for (const c of state.citizens) {
    c.drunk = Math.max(c.drunk || 0, EGGS.cvicekSeconds);
    c.happy += 2;
    clampCitizen(c);
  }
  return { ok: true, news: pick(CVICEK_NEWS) };
}

/** Seven clicks on the church: the bells ring at the wrong time. */
export function ringBells() {
  return { ok: true, news: pick(BELL_NEWS) };
}
