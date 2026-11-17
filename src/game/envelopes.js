// Envelopes for loyalty: any time of the year, paid from the secret account.
// (During the campaign vote buying in elections.js is the sharper tool.)

import { CONFIG } from '../config.js';
import { clamp, pick } from './util.js';

export function envelopePrice(state) {
  const l = CONFIG.loyalty;
  return l.baseCost + l.costStep * state.envelopesThisYear;
}

export function checkEnvelope(state, id) {
  const c = state.citizens[id];
  if (id === state.opponentId) return { ok: false, reason: 'Protikandidat kuverte ne sprejme. Vsaj ne tako majhne.' };
  if (c.loyalMonths > 0) return { ok: false, reason: `${c.name} je že zvest${c.female ? 'a' : ''}. Kuverta bi bila zapravljena.` };
  if (state.secret < envelopePrice(state)) return { ok: false, reason: 'Na skrivnem računu ni dovolj. Bratranec bo moral spet na razpis.' };
  return { ok: true };
}

/** Makes a citizen loyal for CONFIG.wishes.loyalMonths. Returns { ok, reason, news }. */
export function giveEnvelope(state, id) {
  const check = checkEnvelope(state, id);
  if (!check.ok) return check;
  const c = state.citizens[id];
  state.secret -= envelopePrice(state);
  state.envelopesThisYear += 1;
  state.affair = clamp(state.affair + CONFIG.loyalty.affair);
  c.loyalMonths = CONFIG.wishes.loyalMonths;
  c.grudgeMonths = 0;
  const first = c.name.split(' ')[0];
  const a = c.female ? 'a' : '';
  return {
    ok: true,
    news: pick([
      `${first} je od župana dobil${a} »voščilnico«. Precej debelo voščilnico.`,
      `${c.name} je bil${a} povabljen${a} na županovo kosilo. Domov je ${c.female ? 'odšla' : 'odšel'} z nasmehom in kuverto.`,
      `${first} od danes pravi, da je župan »eden redkih, ki razume navadne ljudi«.`,
    ]),
  };
}
