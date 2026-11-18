// Anti-corruption investigation (KPK): when the affair risk or the secret account gets too big,
// the commission may open an investigation – a special card with risky choices (content/dilemmas.js).

import { CONFIG } from '../config.js';

/** Monthly check. Returns true when a new investigation starts (the card comes soon after). */
export function checkKpk(state) {
  const k = CONFIG.kpk;
  if (state.kpkDue || state.monthIndex < (state.kpkCooldownUntil || 0)) return false;
  const suspicious = state.affair >= k.affairAtLeast || state.secret >= k.secretAtLeast;
  if (!suspicious || Math.random() >= k.monthlyChance) return false;
  state.kpkDue = true;
  state.kpkCooldownUntil = state.monthIndex + k.cooldownMonths;
  state.stats.investigations = (state.stats.investigations || 0) + 1;
  return true;
}
