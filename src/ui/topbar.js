// Status bar: date, budget (+ monthly balance), secret account, affair risk, moods, support.

import { MUNICIPALITY } from '../game/texts.js';
import { dateLabel } from '../game/month.js';
import { averages, supportCount, monthlyBalance } from '../game/stats.js';
import { formatEuro } from '../game/util.js';

export function createTopbar(el, game) {
  function stat(label, value, extraClass = '', title = '') {
    return `<div class="stat ${extraClass}" title="${title}"><span class="label">${label}</span><span class="value">${value}</span></div>`;
  }

  function render() {
    const s = game.state;
    const avg = averages(s);
    const balance = monthlyBalance(s);
    const support = supportCount(s);
    const balanceHtml = `<span class="sub ${balance >= 0 ? 'pos' : 'neg'}">(${formatEuro(balance, { sign: true })}/mes)</span>`;

    el.innerHTML = [
      `<div class="brand">⛪ ${MUNICIPALITY}</div>`,
      stat('Datum', capitalizeFirst(dateLabel(s))),
      stat('Proračun', `<span class="${s.budget < 0 ? 'neg' : ''}">${formatEuro(s.budget)}</span>${balanceHtml}`),
      stat('Skrivni račun', formatEuro(s.secret), 'secret', 'Za vsak primer.'),
      stat('Tveganje afere', `${s.affair.toFixed(1).replace('.', ',')} %`, s.affair >= 50 ? 'neg' : ''),
      stat('Povp. sreča', Math.round(avg.happy)),
      stat('Povp. fovšija', Math.round(avg.envy)),
      stat(
        'Podpora županu',
        `${support} / ${s.citizens.length}`,
        '',
        `Občani, pri katerih je sreča − 0,7 × fovšija + propaganda > 25. Propaganda: ${s.propaganda.toFixed(1)}`,
      ),
    ].join('');
  }

  game.on('state', render);
  render();
}

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
