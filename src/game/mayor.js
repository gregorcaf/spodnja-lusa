// What the mayor does in person on the map: shaking hands and listening.
// (Walking is purely visual; the renderer calls these when the mayor has arrived.)

import { CONFIG } from '../config.js';
import { clampCitizen } from './citizens.js';
import { spawnWish } from './wishes.js';
import { pick } from './util.js';

export function shakeHands(state, id) {
  const m = CONFIG.mayor;
  const c = state.citizens[id];
  const first = c.name.split(' ')[0];
  if (c.shakeCooldown > 0) {
    return { ok: true, effective: false, message: `${first}: »Saj sva se že rokovala, župan. Prejšnji teden.«` };
  }
  c.happy += m.shakeHappy;
  c.envy += m.shakeEnvy;
  clampCitizen(c);
  c.shakeCooldown = m.shakeCooldown;
  if (state.campaign) state.propaganda += m.campaignShakePropaganda;
  state.stats.handshakes = (state.stats.handshakes || 0) + 1;
  const a = c.female ? 'a' : '';
  return {
    ok: true,
    effective: true,
    message: pick([
      `${first} je stisnil${a} županovo roko. Doma bo povedal${a}, da je župan čisto normalen človek.`,
      `Župan in ${first} sta si segla v roko. ${first} si je ne bo umival${a} tri dni.`,
      `${first}: »Župan, ko ste že tukaj … ah, nič. Lep dan vam želim.«`,
    ]),
  };
}

export function listen(state, id) {
  const m = CONFIG.mayor;
  const c = state.citizens[id];
  const first = c.name.split(' ')[0];
  if (c.listenCooldown > 0) return { ok: true, message: `${first}: »Vse sem vam že povedal${c.female ? 'a' : ''}. Dvakrat.«` };
  c.listenCooldown = 2;
  const hasWish = state.wishes.some((w) => w.citizenId === id);
  if (!hasWish && Math.random() < m.listenWishChance) {
    const wish = spawnWish(state, c);
    if (wish) return { ok: true, wish, message: `${first} se je razgovoril${c.female ? 'a' : ''}: »${wish.text}«` };
  }
  c.happy += m.listenHappy;
  clampCitizen(c);
  return { ok: true, message: `${first} je županu povedal${c.female ? 'a' : ''} vse o sosedu, vremenu in cenah. ${c.female ? 'Odšla' : 'Odšel'} je zadovoljen${c.female ? 'a' : ''}.` };
}

/** Monthly countdown of the "we just met" cooldowns. */
export function tickMayorCooldowns(state) {
  for (const c of state.citizens) {
    if (c.shakeCooldown > 0) c.shakeCooldown -= 1;
    if (c.listenCooldown > 0) c.listenCooldown -= 1;
  }
}
