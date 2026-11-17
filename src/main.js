// Entry point: wires game logic (src/game), Three.js view (src/render) and HTML UI (src/ui).

import './ui/styles.css';
import { Game } from './game/game.js';
import { MapView } from './render/scene.js';
import { DISTRICTS, districtOf } from './game/map.js';
import { TOOL_INFO } from './game/texts.js';
import { createTopbar } from './ui/topbar.js';
import { createSidebar } from './ui/sidebar.js';
import { createCitizenPopup } from './ui/citizenPopup.js';
import { showMonthCard } from './ui/monthReport.js';
import { NewsTicker } from './ui/newsTicker.js';
import { createDevPanel } from './ui/devPanel.js';
import { toast } from './ui/toast.js';
import { showTooltip, hideTooltip, escapeHtml } from './ui/tooltip.js';
import { Music } from './audio/music.js';
import { showDilemma } from './ui/dilemmaCard.js';
import { showElection, showGameOver } from './ui/election.js';
import { createWishPanel } from './ui/wishPanel.js';
import { createCampaignPanel } from './ui/campaignPanel.js';

const game = new Game();
const view = new MapView(document.getElementById('map'), game);
const ticker = new NewsTicker(document.getElementById('news'));
const popup = createCitizenPopup(game, {
  onPayWish: payWish,
  onEnvelope(id) {
    const res = game.giveEnvelope(id);
    toast(res.ok ? res.news : res.reason, res.ok ? 'good' : 'error');
  },
  onBuyVote(id) {
    const res = game.buyVote(id);
    toast(res.ok ? res.news : res.reason, res.ok ? 'good' : 'error');
  },
});
const devPanel = createDevPanel(document.getElementById('dev-panel'), game);
const topbar = createTopbar(document.getElementById('topbar'), game);

let tool = null;
let hover = null;

const sidebar = createSidebar(document.getElementById('sidebar'), game, {
  onToolChange(t) {
    tool = t;
    renderHover();
  },
  onLever(id) {
    const res = game.useLever(id);
    toast(res.ok ? res.toast : res.reason, res.ok ? 'good' : 'error');
  },
  onNextMonth() {
    game.nextMonth();
  },
});

game.on('news', (text) => ticker.push(text));
// Time runs on its own; the report appears as a corner card. Opening the full report pauses.
let speedBeforeReport = 0;
game.on('month', (report) =>
  showMonthCard(report, {
    onOpen() {
      speedBeforeReport = game.state.speed;
      game.setSpeed(0);
    },
    onClose() {
      if (speedBeforeReport > 0) game.setSpeed(speedBeforeReport);
    },
  }),
);
game.on('unrest', (u) => toast(u.toast, u.level === 'calm' ? 'good' : 'error', 5000));

// Dilemma cards pause the game until the mayor decides.
game.on('dilemma', (card) => showDilemma(card, (i) => game.chooseDilemma(i)));

// Wishes: panel on the map, pay from the panel or the citizen popup; building wishes complete themselves.
function payWish(uid, fromSecret = false) {
  const res = game.payWish(uid, fromSecret);
  if (!res.ok && res.reason) toast(res.reason, 'error');
}
createWishPanel(document.getElementById('wish-panel'), game, {
  onPay: payWish,
  onSelect: (id, e) => popup.open(id, e.clientX, e.clientY),
});
game.on('wishes', ({ fulfilled } = {}) => fulfilled?.forEach((n) => toast(n, 'good', 4500)));

// Elections.
game.on('campaign', ({ opponent, replaced }) => {
  if (!replaced) toast(`Volilna kampanja! Proti vam kandidira ${opponent}. Glasilo zdaj deluje bolje.`, 'info', 6000);
});
game.on('election', (result) =>
  showElection(result, {
    onContinue: () => game.acknowledgeElection(),
    onRecount: () => {
      if (game.requestRecount()) toast('Ponovno štetje: ostajate župan! Nekaj glasovnic je bilo »v kleti«.', 'good', 6000);
    },
    onAccept: () => game.acceptDefeat(),
  }),
);
game.on('gameover', (e) => showGameOver(e));
createCampaignPanel(document.getElementById('campaign-panel'), game, {
  onBribe() {
    const res = game.bribeOpponent();
    if (!res.ok) toast(res.reason, 'error');
    else toast(res.news, res.success ? 'good' : 'error', 6000);
  },
});
// After any change the forecast under the cursor may be different.
game.on('state', () => renderHover());

// ---------------------------------------------------------------------------
// Hover: construction preview + tooltip (citizen or forecast)

view.onHover = (h) => {
  hover = h;
  renderHover();
};

function renderHover() {
  const h = hover;
  if (!h || (!h.tile && h.citizenId == null)) {
    view.preview.hide();
    hideTooltip('map');
    return;
  }

  let forecast = null;
  if (tool && h.tile) {
    forecast = game.forecast(tool, h.tile.x, h.tile.y);
    view.preview.show(tool, h.tile.x, h.tile.y, forecast.ok);
  } else {
    view.preview.hide();
  }

  if (h.citizenId != null) {
    const c = game.state.citizens[h.citizenId];
    showTooltip(
      `<div class="tt-title">${escapeHtml(c.name)}</div><div>»${escapeHtml(c.thought)}«</div>` +
        (tool ? '' : '<div class="tt-muted">Klikni za podrobnosti</div>'),
      h.clientX,
      h.clientY,
    );
  } else if (forecast) {
    const district = DISTRICTS[districtOf(h.tile.x, h.tile.y)].name;
    let html = `<div class="tt-title">${TOOL_INFO[tool].icon} ${TOOL_INFO[tool].name} · ${district}</div>`;
    if (forecast.text) html += `<div class="${forecast.ok ? 'tt-good' : ''}">${escapeHtml(forecast.text)}</div>`;
    if (!forecast.ok && forecast.reason) html += `<div class="tt-bad">${escapeHtml(forecast.reason)}</div>`;
    showTooltip(html, h.clientX, h.clientY);
  } else {
    hideTooltip('map');
  }
}

// ---------------------------------------------------------------------------
// Clicks: build with the selected tool, otherwise inspect citizens

view.onClick = ({ tile, citizenId, clientX, clientY }) => {
  if (tool) {
    if (!tile) return;
    const res = game.act(tool, tile.x, tile.y);
    if (!res.ok && res.reason) toast(res.reason, 'error');
    return;
  }
  if (citizenId != null) popup.open(citizenId, clientX, clientY);
  else popup.close();
};

// ---------------------------------------------------------------------------
// Map buttons and keyboard

document.getElementById('rot-left').addEventListener('click', () => view.rotate(-1));
document.getElementById('rot-right').addEventListener('click', () => view.rotate(1));

const envyBtn = document.getElementById('envy-toggle');
envyBtn.addEventListener('click', () => {
  const on = !envyBtn.classList.contains('active');
  envyBtn.classList.toggle('active', on);
  view.setOverlay(on);
});

const devBtn = document.getElementById('dev-toggle');
devBtn.addEventListener('click', () => devBtn.classList.toggle('active', devPanel.toggle()));

// Background polka. Starts on the first click/key press (browser autoplay rules).
const music = new Music();
const musicBtn = document.getElementById('music-toggle');
musicBtn.classList.toggle('active', music.enabled);
musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  musicBtn.classList.toggle('active', music.toggle());
});
game.on('party-start', () => music.setParty(true));
game.on('party-end', () => music.setParty(false));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar.setTool(null);
    popup.close();
  }
  // Space pauses / resumes time (but not while typing or dragging a slider).
  if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && document.getElementById('modal').hidden) {
    e.preventDefault();
    game.togglePause();
  }
});

// ---------------------------------------------------------------------------
// Main loop

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);
  // The citizen popup follows its citizen around the map.
  view.selectedId = popup.currentId;
  if (popup.currentId != null) popup.follow(view.citizenScreenPos(popup.currentId));
  view.update(dt);
  ticker.update(dt);
  topbar.updateProgress();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

toast('Dobrodošli, župan! Občani vas imajo radi. Še.', 'good', 5000);

// Debug handle for the browser console (dev server only).
if (import.meta.env.DEV) window.__obcina = { game, view };
