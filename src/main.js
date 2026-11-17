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
import { toast } from './ui/toast.js';
import { showTooltip, hideTooltip, escapeHtml } from './ui/tooltip.js';
import { Music } from './audio/music.js';
import { Sfx } from './audio/sfx.js';
import { showDilemma } from './ui/dilemmaCard.js';
import { showElection, showGameOver } from './ui/election.js';
import { createWishPanel } from './ui/wishPanel.js';
import { createCampaignPanel } from './ui/campaignPanel.js';
import { loadGame, saveGame, clearSave, describeSave } from './game/save.js';
import { MONTHS } from './game/texts.js';
import { openModal } from './ui/modal.js';
import { createBuildingPanel } from './ui/buildingPanel.js';
import { idx } from './game/map.js';

// A saved game continues where it stopped (paused until the player confirms).
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
const saved = storage ? loadGame(storage) : null;
const game = new Game(saved && !saved.over ? saved : null);
const view = new MapView(document.getElementById('map'), game);
const sfx = new Sfx();
// Audio may only start after a user gesture; the first click or key press unlocks the sound effects.
const unlockSfx = () => {
  sfx.ready();
  window.removeEventListener('pointerdown', unlockSfx);
  window.removeEventListener('keydown', unlockSfx);
};
window.addEventListener('pointerdown', unlockSfx);
window.addEventListener('keydown', unlockSfx);

const LEVER_SOUNDS = { cousin: 'coin', praise: 'paper', neighbor: 'paper', snow: 'chime', party: 'fanfare', media: 'shush', minister: 'clink' };
const ticker = new NewsTicker(document.getElementById('news'));
// ---------------------------------------------------------------------------
// The mayor in person: he walks to people, events and ribbons before acting.

function sendMayorToCitizen(id, act) {
  const name = game.state.citizens[id].name.split(' ')[0];
  view.mayor.approach(
    () => view.citizenWorld(id),
    () => {
      const res = act(id);
      if (res?.message) toast(res.message, res.effective === false ? 'info' : 'good', 4500);
      view.labels.emote(act === shake ? '🤝' : '👂', () => view.citizenWorld(id));
      view.mayor.cheer();
      sfx.play('pat');
    },
  );
  toast(`Župan gre do ${name} …`, 'info', 1800);
}

function sendMayorToRibbon(x, y) {
  const spot = view.tileWorld(x, y).add({ x: 0, y: 0, z: 0.55 }); // the ribbon hangs in front
  view.mayor.approach(
    () => (game.state.grid[idx(x, y)].build?.phase === 'opening' ? spot : null),
    () => {
      if (game.cutRibbon(x, y).ok) {
        view.mayor.cheer();
        view.labels.emote('✂️', () => spot);
        sfx.play('snip');
      }
    },
    () => toast('Prepozno – otvoritev je že mimo.', 'error'),
  );
}

function sendMayorToEvent() {
  view.mayor.approach(
    () => view.eventWorld(),
    () => {
      if (game.state.mapEvent) game.clickMapEvent();
    },
    () => {},
  );
}

const shake = (id) => game.shakeHands(id);
const listen = (id) => game.listen(id);

const popup = createCitizenPopup(game, {
  onShake: (id) => sendMayorToCitizen(id, shake),
  onListen: (id) => sendMayorToCitizen(id, listen),
  onPayWish: payWish,
  onEnvelope(id) {
    const res = game.giveEnvelope(id);
    toast(res.ok ? res.news : res.reason, res.ok ? 'good' : 'error');
    sfx.play(res.ok ? 'coin' : 'error');
  },
  onBuyVote(id) {
    const res = game.buyVote(id);
    toast(res.ok ? res.news : res.reason, res.ok ? 'good' : 'error');
    sfx.play(res.ok ? 'coin' : 'error');
  },
});
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
    sfx.play(res.ok ? LEVER_SOUNDS[id] : 'error');
  },
  onNextMonth() {
    game.nextMonth();
  },
});

game.on('news', (text) => ticker.push(text));
// Time runs on its own; the report appears as a corner card. Opening the full report pauses.
let speedBeforeReport = 0;
game.on('month', (report) => {
  sfx.play(report.damage && report.unrest === 'riot' ? 'fire' : 'bell');
  showMonthCard(report, {
    onOpen() {
      speedBeforeReport = game.state.speed;
      game.setSpeed(0);
    },
    onClose() {
      if (speedBeforeReport > 0) game.setSpeed(speedBeforeReport);
    },
  });
});
game.on('unrest', (u) => {
  toast(u.toast, u.level === 'calm' ? 'good' : 'error', 5000);
  // Protests bring chanting, riots fire and a minor-key polka.
  sfx.setAmbient(u.level);
  music.setMinor(u.level === 'riot');
});

// Dilemma cards pause the game until the mayor decides.
function openDilemma(card) {
  sfx.play('card');
  showDilemma(card, (i) => {
    sfx.play('click');
    game.chooseDilemma(i);
  });
}
game.on('dilemma', openDilemma);

// Wishes: panel on the map, pay from the panel or the citizen popup; building wishes complete themselves.
function payWish(uid, fromSecret = false) {
  const res = game.payWish(uid, fromSecret);
  if (!res.ok && res.reason) toast(res.reason, 'error');
}
createWishPanel(document.getElementById('wish-panel'), game, {
  onPay: payWish,
  onSelect: (id, e) => popup.open(id, e.clientX, e.clientY),
});
// After the party: drunk citizens stagger home, and sometimes something goes wrong.
const INCIDENT_SOUNDS = { brawl: 'punch', tanker: 'demolish', photo: 'camera', hangover: 'error' };
game.on('party-after', ({ incident }) => {
  if (!incident) {
    toast('Veselica je mimo. Nekaj občanov se domov vrača po zelo vijugasti poti.', 'info', 4000);
    return;
  }
  toast(incident.news, 'error', 6000);
  sfx.play(INCIDENT_SOUNDS[incident.type]);
  if (incident.type === 'brawl') {
    const [a, b] = incident.citizens;
    view.citizens.brawl(a, b, 4);
    for (const id of [a, b]) view.labels.emote('💥', () => view.citizenWorld(id), 4);
  }
  for (const t of incident.tiles) view.labels.emote('💥', () => view.tileWorld(t.x, t.y), 3);
  if (incident.type === 'photo') view.labels.emote('📸', () => view.mayor.pos, 3);
});

// Openings: a finished building waits for the mayor's scissors.
game.on('ribbon', (r) => {
  if (r.kind === 'opening') {
    toast('✂️ Nova stavba čaka na otvoritev! Klikni nanjo in župan pride prerezat trak.', 'info', 4500);
    sfx.play('alert');
  } else if (r.kind === 'missed') {
    toast(r.news, 'error', 5000);
  } else if (r.kind === 'cut') {
    toast(r.news, 'good', 4500);
  }
});

// Live map events: announce, then report how it ended.
const EVENT_SOUNDS = { bear: 'growl', tractor: 'tractor', wedding: 'fanfare', fire: 'fire', journalist: 'camera' };
game.on('mapevent', (e) => {
  if (e.phase === 'start') {
    toast(`${e.info.icon} ${e.info.announce}`, 'info', 5000);
    sfx.play('alert');
    setTimeout(() => sfx.play(EVENT_SOUNDS[e.type]), 250);
  } else {
    toast(e.news, e.clicked ? 'good' : 'error', 5500);
    sfx.play(e.clicked ? 'wish' : 'error');
    hideTooltip('map');
  }
});

game.on('wishes', ({ fulfilled } = {}) => {
  if (fulfilled?.length) sfx.play('wish');
  fulfilled?.forEach((n) => toast(n, 'good', 4500));
});

// Elections.
game.on('campaign', ({ opponent, replaced }) => {
  if (!replaced) toast(`Volilna kampanja! Proti vam kandidira ${opponent}. Glasilo zdaj deluje bolje.`, 'info', 6000);
});
function openElection(result) {
  sfx.play('drumroll');
  showElection(result, {
    onContinue: () => game.acknowledgeElection(),
    onRecount: () => {
      sfx.play('drumroll');
      if (game.requestRecount()) {
        setTimeout(() => sfx.play('win'), 2400);
        toast('Ponovno štetje: ostajate župan! Nekaj glasovnic je bilo »v kleti«.', 'good', 6000);
      } else setTimeout(() => sfx.play('lose'), 2400);
    },
    onAccept: () => game.acceptDefeat(),
    onVerdict: (won) => sfx.play(won ? 'win' : 'lose'),
  });
}
game.on('election', openElection);
game.on('gameover', (e) => {
  if (storage) clearSave(storage); // a finished game can't be continued
  showGameOver(e);
});
createCampaignPanel(document.getElementById('campaign-panel'), game, {
  onBribe() {
    const res = game.bribeOpponent();
    if (!res.ok) toast(res.reason, 'error');
    else toast(res.news, res.success ? 'good' : 'error', 6000);
    sfx.play(res.ok && res.success ? 'coin' : 'error');
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
  if (h?.mayor) {
    view.preview.hide();
    showTooltip(
      `<div class="tt-title">🎩 Župan (vi)</div>
       <div class="tt-muted">Klikni cesto ali travnik za sprehod. Klikni občana za rokovanje, dogodek ali trak, da župan steče tja.</div>`,
      h.clientX,
      h.clientY,
    );
    return;
  }
  // A live event under the mouse: say what clicking does and what happens if ignored.
  if (h?.mapEvent && game.state.mapEvent) {
    const info = game.describeMapEvent();
    view.preview.hide();
    showTooltip(
      `<div class="tt-title">${info.icon} ${escapeHtml(info.name)} · klikni!</div>
       <div class="tt-good">${escapeHtml(info.action)}</div>
       <div class="tt-muted">Župan mora priti do tja. ${escapeHtml(info.ignoreHint)}</div>`,
      h.clientX,
      h.clientY,
    );
    return;
  }
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

const buildingPanel = createBuildingPanel(game, {
  onBuy(x, y, id) {
    const res = game.buyUpgrade(x, y, id);
    if (!res.ok) toast(res.reason, 'error');
    else {
      toast(res.news, 'good', 4000);
      sfx.play('build');
    }
  },
  onRibbon: (x, y) => sendMayorToRibbon(x, y),
});

view.onClick = ({ tile, citizenId, mapEvent, point, clientX, clientY }) => {
  // Live events take priority over everything else, even an active build tool: the mayor runs there.
  if (mapEvent && game.state.mapEvent) {
    sendMayorToEvent();
    return;
  }
  if (tool) {
    if (!tile) return;
    const res = game.act(tool, tile.x, tile.y);
    if (!res.ok && res.reason) toast(res.reason, 'error');
    sfx.play(!res.ok ? 'error' : tool === 'demolish' ? 'demolish' : 'build');
    // After every successful build the tool lets go of the mouse: back to "Na teren".
    if (res.ok) sidebar.setTool(null);
    return;
  }
  // With a villager or building window open, a click on empty map only closes it.
  const windowOpen = popup.currentId != null || buildingPanel.current != null;

  if (citizenId != null) {
    buildingPanel.close();
    popup.open(citizenId, clientX, clientY);
    return;
  }
  const t = tile && game.state.grid[idx(tile.x, tile.y)];
  // A building waiting for its opening: the mayor goes to cut the ribbon.
  if (t?.build?.phase === 'opening') {
    popup.close();
    buildingPanel.close();
    sendMayorToRibbon(tile.x, tile.y);
    return;
  }
  // Any building (church and roundabouts included): open its panel.
  if (t && t.type !== 'grass' && t.type !== 'road') {
    popup.close();
    buildingPanel.open(tile.x, tile.y, clientX, clientY);
    return;
  }
  popup.close();
  buildingPanel.close();
  if (windowOpen) return; // that click was just "close the window" – the mayor stays put
  // Meadow or road: the mayor takes a walk.
  if (point) view.mayor.goTo(point);
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
// A loaded game may already be in unrest.
sfx.setAmbient(game.state.unrest);
music.setMinor(game.state.unrest === 'riot');

const sfxBtn = document.getElementById('sfx-toggle');
sfxBtn.addEventListener('click', () => sfxBtn.classList.toggle('active', sfx.toggle()));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar.setTool(null);
    popup.close();
    buildingPanel.close();
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
  sfx.setPaused(game.paused); // chants and fire go quiet while paused
  // The citizen popup follows its citizen around the map.
  view.selectedId = popup.currentId;
  if (popup.currentId != null) popup.follow(view.citizenScreenPos(popup.currentId));
  view.update(dt);
  ticker.update(dt);
  topbar.updateProgress();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------------------
// Saving: automatically every month and whenever the tab is hidden or closed.

// Set when the player starts over, so the reload doesn't save the old game again on its way out.
let discardOnExit = false;

function autosave() {
  if (storage && !game.state.over && !discardOnExit) saveGame(storage, game.state);
}
game.on('month', autosave);
document.addEventListener('visibilitychange', () => document.hidden && autosave());
window.addEventListener('pagehide', autosave);

if (game.state === saved) {
  // Continue screen: the game waits paused until the mayor decides.
  const speed = game.state.speed || game.state.lastSpeed || 1;
  game.setSpeed(0);
  const { el, close } = openModal(
    `<header><div class="kicker">Shranjena igra</div><h3>Dobrodošli nazaj, župan!</h3></header>
     <div class="body"><p>Občani so vas pogrešali. Nekateri.</p><p class="muted">${describeSave(game.state, MONTHS)}</p></div>
     <footer class="election-actions">
       <button id="continue-game">Nadaljuj</button>
       <button id="new-game-start" class="secondary">Nova igra</button>
     </footer>`,
  );
  el.querySelector('#continue-game').addEventListener('click', () => {
    close();
    game.setSpeed(speed);
    // Answer whatever was still open when the game was saved.
    if (game.state.dilemma) openDilemma(game.presentDilemma());
    else if (game.state.election) openElection(game.state.election);
  });
  el.querySelector('#new-game-start').addEventListener('click', () => {
    discardOnExit = true;
    if (storage) clearSave(storage);
    window.location.reload();
  });
} else {
  toast('Dobrodošli, župan! Občani vas imajo radi. Še.', 'good', 5000);
}

// Debug handle for the browser console (dev server only).
if (import.meta.env.DEV) window.__obcina = { game, view };
