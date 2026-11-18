// Campaign panel (top-right of the map, only during the campaign): opponent,
// projected votes, bought votes and the risky "bribe the opponent" button.

import { CONFIG } from '../config.js';
import { monthsToElection, opponentLabel, votePrice, checkBribe } from '../game/elections.js';
import { moodScore } from '../game/stats.js';
import { districtPopulation } from '../game/population.js';
import { formatEuro } from '../game/util.js';
import { escapeHtml } from './tooltip.js';

export function createCampaignPanel(el, game, { onBribe }) {
  function render() {
    const s = game.state;
    if (!s.campaign || s.over) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    // Sure votes per district (from its named citizens), scaled to the district's residents.
    const pops = districtPopulation(s);
    let sure = 0;
    for (let d = 0; d < pops.length; d++) {
      const reps = s.citizens.filter((c) => c.home === d);
      const yes = reps.filter((c) => c.id !== s.opponentId && (c.boughtVote || moodScore(c, s) > CONFIG.mood.supportThreshold)).length;
      if (reps.length) sure += Math.round((pops[d] * yes) / reps.length);
    }
    const total = pops.reduce((a, b) => a + b, 0);
    const need = Math.floor(total / 2) + 1;
    const bribe = checkBribe(s);
    const e = CONFIG.elections;
    el.innerHTML = `
      <div class="cmp-head">🗳️ Kampanja · ${Math.max(0, monthsToElection(s))} mes.</div>
      <div class="cmp-row">Proti: <strong>${escapeHtml(opponentLabel(s))}</strong></div>
      <div class="cmp-row" title="Zanesljivi glasovi · klik na občana: kupi glas (🤫 ${formatEuro(votePrice(s))})">👍 <strong class="${sure >= need ? 'pos-ink' : 'neg-ink'}">${sure}</strong> <span class="muted">/ ${need} potrebnih</span></div>
      <button class="cmp-bribe" ${bribe.ok ? '' : 'disabled'} title="${escapeHtml(bribe.ok ? `${Math.round(e.bribeChance * 100)} % da sprejme, sicer škandal` : bribe.reason)}">
        💼 Podkupi protikandidata · 🤫 ${formatEuro(e.bribeCost)}
      </button>`;
    el.querySelector('.cmp-bribe').addEventListener('click', onBribe);
  }

  game.on('state', render);
  game.on('campaign', render);
  render();
}
