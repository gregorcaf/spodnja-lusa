// Monthly report modal shown after "Naslednji mesec".

import { formatEuro } from '../game/util.js';
import { escapeHtml } from './tooltip.js';

export function showMonthReport(r) {
  const modal = document.getElementById('modal');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  modal.innerHTML = `
    <div class="report" role="dialog" aria-modal="true">
      <header>
        <div class="kicker">Mesečno poročilo</div>
        <h3>${cap(r.month)}</h3>
      </header>
      <div class="body">
        <table>
          <tr><td>Osnovni prihodki</td><td>${formatEuro(r.income.base)}</td></tr>
          <tr><td>Davki <span class="muted">(${r.income.houses} hiš)</span></td><td>${formatEuro(r.income.taxes)}</td></tr>
          <tr><td>Plače in kava občinske uprave</td><td>${formatEuro(-r.expenses.base)}</td></tr>
          <tr><td>Vzdrževanje objektov</td><td>${formatEuro(-r.expenses.upkeep)}</td></tr>
          <tr class="sum"><td>Mesečni saldo</td><td class="${r.balance >= 0 ? 'pos-ink' : 'neg-ink'}">${formatEuro(r.balance, { sign: true })}</td></tr>
          <tr><td><strong>Proračun</strong></td><td><strong>${formatEuro(r.budget)}</strong></td></tr>
        </table>
        <div class="districts">
          <div><div class="k">Najbolj zadovoljen konec</div><div class="v">${r.happiest.name}</div><div class="muted">sreča ${Math.round(r.happiest.value)}</div></div>
          <div><div class="k">Najbolj fovšen konec</div><div class="v">${r.enviest.name}</div><div class="muted">fovšija ${Math.round(r.enviest.value)}</div></div>
        </div>
        <div class="muted" style="margin-bottom:4px">Misel meseca</div>
        <blockquote>»${escapeHtml(r.thought.text)}«<cite>— ${escapeHtml(r.thought.name)}</cite></blockquote>
      </div>
      <footer><button id="report-ok">Na delo! (${r.newMonth})</button></footer>
    </div>`;
  modal.hidden = false;
  const btn = modal.querySelector('#report-ok');
  const close = () => {
    modal.hidden = true;
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') close();
  };
  btn.addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close(), { once: true });
  document.addEventListener('keydown', onKey);
  btn.focus();
}
