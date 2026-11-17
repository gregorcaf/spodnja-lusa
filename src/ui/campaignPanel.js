// Campaign panel (top-right of the map, only during the campaign): opponent,
// projected votes, bought votes and the risky "bribe the opponent" button.

import { CONFIG } from '../config.js';
import { monthsToElection, opponentLabel, votePrice, checkBribe } from '../game/elections.js';
import { moodScore } from '../game/stats.js';
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
    const sure = s.citizens.filter(
      (c) => c.id !== s.opponentId && (c.boughtVote || moodScore(c, s) > CONFIG.mood.supportThreshold),
    ).length;
    const need = CONFIG.elections.votesToWin;
    const bribe = checkBribe(s);
    const e = CONFIG.elections;
    el.innerHTML = `
      <div class="cmp-head">🗳️ Kampanja · volitve čez ${Math.max(0, monthsToElection(s))} mes.</div>
      <div class="cmp-row">Protikandidat: <strong>${escapeHtml(opponentLabel(s))}</strong>${s.opponentWithdrawn ? ' <span class="muted">(nadomestni)</span>' : ''}</div>
      <div class="cmp-row">Zanesljivi glasovi: <strong class="${sure >= need ? 'pos-ink' : 'neg-ink'}">${sure} / 25</strong> <span class="muted">(potrebnih ${need})</span></div>
      <div class="cmp-row">Kupljeni glasovi: <strong>${s.votesBought}</strong> · naslednji ${formatEuro(votePrice(s))}</div>
      <div class="cmp-hint">💰 Glas kupiš s klikom na občana (iz skrivnega računa, tveganje afere +${e.voteAffair}).</div>
      <button class="cmp-bribe" ${bribe.ok ? '' : 'disabled'} title="${escapeHtml(bribe.ok ? '' : bribe.reason)}">
        💼 Podkupi protikandidata · ${formatEuro(e.bribeCost)}
        <span>${Math.round(e.bribeChance * 100)} % da sprejme · sicer škandal (+${e.bribeRefuseAffair} afera)</span>
      </button>`;
    el.querySelector('.cmp-bribe').addEventListener('click', onBribe);
  }

  game.on('state', render);
  game.on('campaign', render);
  render();
}
