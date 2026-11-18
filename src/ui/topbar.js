// Status bar: date with time controls, budget (+ monthly balance), secret account,
// affair risk (+ unrest badge), moods and mayor support.

import { CONFIG } from '../config.js';
import { population } from '../game/population.js';
import { SEASONS, seasonOf } from '../game/seasons.js';
import { UNREST } from '../game/texts.js';
import { municipalityTitle } from '../game/municipality.js';
import { SPEEDS } from '../game/game.js';
import { dateLabel } from '../game/month.js';
import { averages, supportPeople, supportShare, monthlyBalance } from '../game/stats.js';
import { formatEuro } from '../game/util.js';
import { monthsToElection, opponentLabel } from '../game/elections.js';
import { attachHelp } from './tooltip.js';
import { statHelp } from './help.js';

const SPEED_LABELS = { 0: '⏸', 1: '1×', 2: '2×', 3: '3×' };

export function createTopbar(el, game) {
  el.innerHTML = `
    <div class="brand" data-k="brand"></div>
    <div class="stat time-stat" data-help="date" aria-label="Datum">
      <span class="value" data-k="date"></span>
      <div class="month-progress"><div data-k="progress"></div></div>
    </div>
    <div class="speed-group" role="group" aria-label="Hitrost časa">
      ${SPEEDS.map((s) => `<button data-speed="${s}" title="${s ? `Hitrost ${s}×` : 'Pavza (preslednica)'}">${SPEED_LABELS[s]}</button>`).join('')}
    </div>
    ${stat('💰', 'Proračun', 'budget')}
    ${stat('🤫', 'Skrivni račun', 'secret', 'secret')}
    <div class="stat" data-k="affair-stat" data-help="affair" aria-label="Tveganje afere">
      <span class="s-icon">🕵️</span>
      <span class="value"><span data-k="affair"></span><span class="unrest-badge" data-k="unrest" hidden></span></span>
    </div>
    ${stat('😊', 'Povprečna sreča', 'happy')}
    ${stat('😒', 'Povprečna fovšija', 'envy')}
    ${stat('👥', 'Prebivalci', 'population')}
    ${stat('👍', 'Podpora županu', 'support')}
    <div class="stat" data-k="election-stat" data-help="election" aria-label="Volitve">
      <span class="s-icon">🗳️</span>
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

    // The municipality's own name (chosen at the start), also in the browser tab.
    const title = municipalityTitle(s);
    if (q('brand').textContent !== `⛪ ${title}`) {
      q('brand').textContent = `⛪ ${title}`;
      q('brand').title = title;
      document.title = title;
    }
    const season = SEASONS[seasonOf(s.month)];
    q('date').textContent = `${season.icon} ${capitalizeFirst(dateLabel(s))}`;
    q('budget').innerHTML = `<span class="${s.budget < 0 ? 'neg' : ''}">${formatEuro(s.budget)}</span><span class="sub ${balance >= 0 ? 'pos' : 'neg'}">(${formatEuro(balance, { sign: true })}/mes)</span>`;
    q('secret').textContent = formatEuro(s.secret);
    // A full secret account catches the anti-corruption commission's eye.
    q('secret').classList.toggle('warn', s.secret >= CONFIG.kpk.secretAtLeast);
    q('affair').textContent = `${s.affair.toFixed(1).replace('.', ',')} %`;
    q('affair').className = s.unrest !== 'calm' ? 'neg' : tone(s.affair, { warnAt: 30, badAt: CONFIG.unrest.protestAt });
    const badge = q('unrest');
    badge.hidden = s.unrest === 'calm';
    if (s.unrest !== 'calm') {
      // During riots, count the months towards a vote of no confidence.
      badge.textContent = s.unrest === 'riot' && s.riotMonths > 0 ? `${UNREST.riot.label} · ${s.riotMonths}/${CONFIG.unrest.noConfidenceMonths}` : UNREST[s.unrest].label;
      badge.className = `unrest-badge ${s.unrest}`;
    }
    q('happy').textContent = Math.round(avg.happy);
    q('happy').className = `value ${toneUp(avg.happy, { goodAt: 50, okAt: 35 })}`;
    q('envy').textContent = Math.round(avg.envy);
    q('envy').className = `value ${tone(avg.envy, { warnAt: 30, badAt: 50 })}`;
    q('support').textContent = `${supportPeople(s)} / ${population(s)}`;
    const share = supportShare(s);
    q('support').className = `value ${share > 0.5 ? 'pos' : share <= CONFIG.unrest.supportProtestAtMost ? 'neg' : 'warn'}`;
    q('population').textContent = population(s);
    const left = Math.max(0, monthsToElection(s));
    q('election').innerHTML = s.campaign
      ? `<span class="campaign-badge">KAMPANJA</span> ${left} mes.`
      : `${left} mes.`;
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

/** One top-bar value with its emoji; the name is for screen readers, the hover help explains it. */
function stat(icon, name, key, extraClass = '') {
  return `<div class="stat ${extraClass}" data-help="${key}" aria-label="${name}"><span class="s-icon">${icon}</span><span class="value" data-k="${key}"></span></div>`;
}

/** Traffic-light colour for a value where lower is better (envy, affair risk). */
function tone(value, { warnAt, badAt }) {
  return value >= badAt ? 'neg' : value >= warnAt ? 'warn' : 'pos';
}

/** Traffic-light colour for a value where higher is better (happiness). */
function toneUp(value, { goodAt, okAt }) {
  return value >= goodAt ? 'pos' : value >= okAt ? 'warn' : 'neg';
}

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
