// Election night (district-by-district results), recount gamble and the game-over screen.

import { CONFIG } from '../config.js';
import { openModal } from './modal.js';
import { escapeHtml } from './tooltip.js';
import { formatEuro } from '../game/util.js';

const REVEAL_MS = 700;

/** `place` is the municipality's title, e.g. »Občina Spodnja Luša«. */
export function showElection(result, { onContinue, onRecount, onAccept, onVerdict, place = '' }) {
  const rows = result.districts
    .map(
      (d, i) => `<tr class="er-row" data-i="${i}" hidden>
        <td>${escapeHtml(d.name)}</td>
        <td class="er-mayor">${d.mayor}</td>
        <td class="er-opp">${d.opponent}</td></tr>`,
    )
    .join('');
  const { el, close } = openModal(
    `<header><div class="kicker">${escapeHtml(place)} · ${result.early ? 'Nezaupnica občinskega sveta' : `Volilna noč · ${result.term}. mandat`}</div><h3>${result.early ? 'Predčasne volitve' : 'Volitve župana'}</h3></header>
     <div class="body">
       <p>Protikandidat: <strong>${escapeHtml(result.opponentName)}</strong></p>
       <table class="election-table">
         <tr class="er-head"><td></td><td>Župan</td><td>Proti</td></tr>
         ${rows}
         <tr class="sum er-total" hidden><td>Skupaj</td><td class="er-mayor">${result.mayor}</td><td class="er-opp">${result.opponent}</td></tr>
       </table>
       <p class="muted">Za zmago: več kot polovica glasov.</p>
       <div class="election-verdict" hidden></div>
     </div>
     <footer class="election-actions" hidden></footer>`,
    { className: 'election' },
  );

  // Results arrive one district at a time, like on a real election night.
  const rowEls = [...el.querySelectorAll('.er-row')];
  rowEls.forEach((r, i) => setTimeout(() => (r.hidden = false), REVEAL_MS * (i + 1)));
  setTimeout(() => {
    el.querySelector('.er-total').hidden = false;
    const verdict = el.querySelector('.election-verdict');
    const actions = el.querySelector('.election-actions');
    verdict.hidden = false;
    actions.hidden = false;
    onVerdict?.(result.won);
    if (result.won) {
      verdict.className = 'election-verdict won';
      verdict.textContent = 'Zmaga! Občani so vam zaupali še en mandat. Pričakujejo pa več.';
      actions.innerHTML = '<button id="el-continue">Na delo, nov mandat!</button>';
      el.querySelector('#el-continue').addEventListener('click', () => {
        close();
        onContinue();
      });
    } else {
      verdict.className = 'election-verdict lost';
      verdict.textContent = 'Poraz. Občani so izbrali drugega. Ali pa so se zmotili pri štetju?';
      const cost = formatEuro(CONFIG.elections.recountCost);
      const chance = Math.round(CONFIG.elections.recountChance * 100);
      actions.innerHTML = `
        ${result.canRecount ? `<button id="el-recount" class="danger">Ponovno štetje (${cost} iz skrivnega računa, ${chance} % možnosti, tveganje afere +${CONFIG.elections.recountAffair})</button>` : '<p class="muted">Za ponovno štetje ni denarja na skrivnem računu (ali pa ste ga že porabili).</p>'}
        <button id="el-accept" class="secondary">Sprejmi poraz</button>`;
      el.querySelector('#el-recount')?.addEventListener('click', () => {
        close();
        onRecount();
      });
      el.querySelector('#el-accept').addEventListener('click', () => {
        close();
        onAccept();
      });
    }
  }, REVEAL_MS * (rowEls.length + 1));
}

export function showGameOver(e, place = '') {
  const { el } = openModal(
    `<header><div class="kicker">${escapeHtml(place)} · Konec mandata</div><h3>Bivši župan</h3></header>
     <div class="body">
       ${e.lines.map((l) => `<p class="epilogue">${escapeHtml(l)}</p>`).join('')}
       <div class="districts">
         <div><div class="k">V službi</div><div class="v">${e.years} let, ${e.months} mes.</div></div>
         <div><div class="k">Mandati</div><div class="v">${e.terms}</div></div>
         <div><div class="k">Zgrajeno</div><div class="v">${e.built} objektov</div><div class="muted">od tega ${e.roundabouts} krožišč</div></div>
         <div><div class="k">Izpolnjene želje</div><div class="v">${e.wishes}</div></div>
         <div><div class="k">Veselice</div><div class="v">${e.parties}</div></div>
         <div><div class="k">Skrivni račun</div><div class="v">${formatEuro(e.secret)}</div></div>
       </div>
     </div>
     <footer><button id="new-game">Nova igra</button></footer>`,
    { className: 'gameover' },
  );
  el.querySelector('#new-game').addEventListener('click', () => window.location.reload());
}
