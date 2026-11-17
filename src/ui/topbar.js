// Status bar: date with time controls, budget (+ monthly balance), secret account,
// affair risk (+ unrest badge), moods and mayor support.

import { CONFIG } from '../config.js';
import { MUNICIPALITY, UNREST } from '../game/texts.js';
import { SPEEDS } from '../game/game.js';
import { dateLabel } from '../game/month.js';
import { averages, supportCount, monthlyBalance } from '../game/stats.js';
import { formatEuro } from '../game/util.js';
import { monthsToElection, opponentLabel } from '../game/elections.js';
import { attachHelp } from './tooltip.js';
import { statHelp } from './help.js';

const SPEED_LABELS = { 0: '⏸', 1: '1×', 2: '2×', 3: '3×' };

export function createTopbar(el, game) {
  el.innerHTML = `
    <div class="brand">⛪ ${MUNICIPALITY}</div>
    <div class="stat time-stat" data-help="date">
      <span class="label">Datum</span>
      <span class="value" data-k="date"></span>
      <div class="month-progress"><div data-k="progress"></div></div>
    </div>
    <div class="speed-group" role="group" aria-label="Hitrost časa">
      ${SPEEDS.map((s) => `<button data-speed="${s}" title="${s ? `Hitrost ${s}×` : 'Pavza (preslednica)'}">${SPEED_LABELS[s]}</button>`).join('')}
    </div>
    ${stat('Proračun', 'budget')}
    ${stat('Skrivni račun', 'secret', 'secret', 'Za vsak primer. Z njim lahko utišaš medije.')}
    <div class="stat" data-k="affair-stat" data-help="affair">
      <span class="label">Tveganje afere</span>
      <span class="value"><span data-k="affair"></span><span class="unrest-badge" data-k="unrest" hidden></span></span>
    </div>
    ${stat('Povp. sreča', 'happy')}
    ${stat('Povp. fovšija', 'envy')}
    ${stat('Podpora županu', 'support', '', 'Občani, pri katerih je sreča − 0,7 × fovšija + propaganda > 25.')}
    <div class="stat" data-k="election-stat" data-help="election">
      <span class="label">Volitve</span>
      <span class="value" data-k="election"></span>
    </div>
  `;

  const q = (k) => el.querySelector(`[data-k="${k}"]`);
  el.querySelectorAll('[data-help]').forEach((node) =>
    attachHelp(node, () => {
      const key = node.dataset.help;
      const st = game.state;
      // The election help names the opponent during the campaign.
      const extra =
        key === 'election'
          ? `<div class="tt-muted">${st.campaign ? `Protikandidat: ${opponentLabel(st)}.` : `Trenutno ${st.term}. mandat.`}</div>`
          : '';
      return statHelp(key) + extra;
    }),
  );
  const speedButtons = [...el.querySelectorAll('[data-speed]')];
  speedButtons.forEach((b) => b.addEventListener('click', () => game.setSpeed(Number(b.dataset.speed))));

  function render() {
    const s = game.state;
    const avg = averages(s);
    const balance = monthlyBalance(s);

    q('date').textContent = capitalizeFirst(dateLabel(s));
    q('budget').innerHTML = `<span class="${s.budget < 0 ? 'neg' : ''}">${formatEuro(s.budget)}</span><span class="sub ${balance >= 0 ? 'pos' : 'neg'}">(${formatEuro(balance, { sign: true })}/mes)</span>`;
    q('secret').textContent = formatEuro(s.secret);
    q('affair').textContent = `${s.affair.toFixed(1).replace('.', ',')} %`;
    q('affair').className = s.unrest !== 'calm' ? 'neg' : '';
    const badge = q('unrest');
    badge.hidden = s.unrest === 'calm';
    if (s.unrest !== 'calm') {
      badge.textContent = UNREST[s.unrest].label;
      badge.className = `unrest-badge ${s.unrest}`;
    }
    q('happy').textContent = Math.round(avg.happy);
    q('envy').textContent = Math.round(avg.envy);
    q('support').textContent = `${supportCount(s)} / ${s.citizens.length}`;
    const left = Math.max(0, monthsToElection(s));
    q('election').innerHTML = s.campaign
      ? `<span class="campaign-badge">KAMPANJA</span> čez ${left} mes.`
      : `čez ${left} mes.`;
    renderSpeed();
  }

  function renderSpeed() {
    for (const b of speedButtons) b.classList.toggle('active', Number(b.dataset.speed) === game.state.speed);
    el.classList.toggle('paused', game.state.speed === 0);
  }

  game.on('state', render);
  game.on('time', renderSpeed);
  render();

  return {
    /** Called every frame: the month progress bar moves continuously. */
    updateProgress() {
      q('progress').style.width = `${(game.state.monthProgress * 100).toFixed(2)}%`;
    },
  };
}

function stat(label, key, extraClass = '', title = '') {
  return `<div class="stat ${extraClass}" data-help="${key}"><span class="label">${label}</span><span class="value" data-k="${key}"></span></div>`;
}

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
