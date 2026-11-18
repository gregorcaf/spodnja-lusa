// Monthly report: a small card in the map corner (game keeps running) that
// expands into the full report modal (game pauses while it is open).

import { formatEuro } from '../game/util.js';
import { UNREST } from '../game/texts.js';
import { escapeHtml } from './tooltip.js';

const CARD_SECONDS = 8;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let cardTimer = null;

export function showMonthCard(r, { onOpen, onClose }) {
  const card = document.getElementById('month-card');
  clearTimeout(cardTimer);
  const unrest =
    r.unrest !== 'calm' ? `<span class="unrest-badge ${r.unrest}">${UNREST[r.unrest].label}</span>` : '';
  card.innerHTML = `
    <div class="mc-head"><span>Mesečno poročilo · ${cap(r.month)}</span>${unrest}</div>
    <div class="mc-row"><span>Saldo</span><strong class="${r.balance >= 0 ? 'pos-ink' : 'neg-ink'}">${formatEuro(r.balance, { sign: true })}</strong></div>
    <div class="mc-row"><span>Proračun</span><strong>${formatEuro(r.budget)}</strong></div>
    ${r.damage?.cost ? `<div class="mc-row neg-ink"><span>${r.unrest === 'riot' ? '🔥 Škoda po neredih' : '🪧 Škoda po protestih'}</span><strong>${formatEuro(-r.damage.cost)}</strong></div>` : ''}
    <div class="mc-thought">»${escapeHtml(r.thought.text)}« <span>— ${escapeHtml(r.thought.name)}</span></div>
    <button class="mc-more">Podrobnosti ▸</button>`;
  card.hidden = false;
  card.classList.remove('out');
  card.querySelector('.mc-more').addEventListener('click', () => {
    hideCard();
    showMonthReport(r, { onOpen, onClose });
  });
  cardTimer = setTimeout(hideCard, CARD_SECONDS * 1000);
}

function hideCard() {
  const card = document.getElementById('month-card');
  clearTimeout(cardTimer);
  card.classList.add('out');
  cardTimer = setTimeout(() => (card.hidden = true), 300);
}

export function showMonthReport(r, { onOpen, onClose } = {}) {
  const modal = document.getElementById('modal');
  const unrestRow =
    r.unrest !== 'calm'
      ? `<div class="report-unrest ${r.unrest}">${UNREST[r.unrest].label}: ${r.unrest === 'riot' ? 'občina gori, dobesedno.' : 'občani so na ulicah.'}</div>`
      : '';
  modal.innerHTML = `
    <div class="report" role="dialog" aria-modal="true">
      <header>
        <div class="kicker">Mesečno poročilo · igra je na pavzi</div>
        <h3>${cap(r.month)}</h3>
      </header>
      <div class="body">
        ${unrestRow}
        <table>
          <tr><td>Osnovni prihodki</td><td>${formatEuro(r.income.base)}</td></tr>
          <tr><td>Davki <span class="muted">(${r.income.houses} gospodinjstev × ${formatEuro(r.income.rate)})</span></td><td>${formatEuro(r.income.taxes)}</td></tr>
          ${r.income.business ? `<tr><td>Podjetja in storitve</td><td>${formatEuro(r.income.business)}</td></tr>` : ''}
          ${r.income.harvest ? `<tr class="pos-ink"><td>🍇 Trgatev</td><td>${formatEuro(r.income.harvest)}</td></tr>` : ''}
          ${r.income.strike ? `<tr class="neg-ink"><td>Davčna stavka protestnikov</td><td>${formatEuro(-r.income.strike)}</td></tr>` : ''}
          <tr><td>Plače in kava občinske uprave</td><td>${formatEuro(-r.expenses.base)}</td></tr>
          <tr><td>Vzdrževanje objektov</td><td>${formatEuro(-r.expenses.upkeep)}</td></tr>
          ${r.damage?.cost ? `<tr class="neg-ink"><td>${r.unrest === 'riot' ? 'Sanacija po neredih' : 'Popravila po protestih'}</td><td>${formatEuro(-r.damage.cost)}</td></tr>` : ''}
          <tr class="sum"><td>Mesečni saldo</td><td class="${r.balance >= 0 ? 'pos-ink' : 'neg-ink'}">${formatEuro(r.balance, { sign: true })}</td></tr>
          <tr><td><strong>Proračun</strong></td><td><strong>${formatEuro(r.budget)}</strong></td></tr>
        </table>
        ${r.damage ? `<p class="report-damage">${r.unrest === 'riot' ? (r.damage.type ? '🔥' : '👮') : '🪧'} ${escapeHtml(r.damage.news)}</p>` : ''}
        <div class="districts">
          <div><div class="k">Najbolj zadovoljen konec</div><div class="v">${r.happiest.name}</div><div class="muted">😊 ${Math.round(r.happiest.value)}</div></div>
          <div><div class="k">Najbolj fovšen konec</div><div class="v">${r.enviest.name}</div><div class="muted">😒 ${Math.round(r.enviest.value)}</div></div>
        </div>
        <div class="muted" style="margin-bottom:4px">Misel meseca</div>
        <blockquote>»${escapeHtml(r.thought.text)}«<cite>— ${escapeHtml(r.thought.name)}</cite></blockquote>
      </div>
      <footer><button id="report-ok">Nadaljuj</button></footer>
    </div>`;
  modal.hidden = false;
  onOpen?.();
  const btn = modal.querySelector('#report-ok');
  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') close();
  };
  btn.addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close(), { once: true });
  document.addEventListener('keydown', onKey);
  btn.focus();
}
