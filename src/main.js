// Entry point: wires game logic (src/game), Three.js view (src/render) and HTML UI (src/ui).

import './ui/styles.css';
import { Game } from './game/game.js';
import { MapView } from './render/scene.js';
import { DISTRICTS, districtOf } from './game/map.js';
import { TOOL_INFO } from './game/texts.js';
import { createTopbar } from './ui/topbar.js';
import { createSidebar } from './ui/sidebar.js';
import { createCitizenPopup } from './ui/citizenPopup.js';
import { showMonthReport } from './ui/monthReport.js';
import { NewsTicker } from './ui/newsTicker.js';
import { createDevPanel } from './ui/devPanel.js';
import { toast } from './ui/toast.js';
import { showTooltip, hideTooltip, escapeHtml } from './ui/tooltip.js';

const game = new Game();
const view = new MapView(document.getElementById('map'), game);
const ticker = new NewsTicker(document.getElementById('news'));
const popup = createCitizenPopup(game);
const devPanel = createDevPanel(document.getElementById('dev-panel'), game);
createTopbar(document.getElementById('topbar'), game);

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
game.on('month', (report) => showMonthReport(report));
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
    hideTooltip();
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
    hideTooltip();
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar.setTool(null);
    popup.close();
  }
});

// ---------------------------------------------------------------------------
// Main loop

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);
  view.update(dt);
  ticker.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

toast('Dobrodošli, župan! Občani vas imajo radi. Še.', 'good', 5000);

// Debug handle for the browser console (dev server only).
if (import.meta.env.DEV) window.__obcina = { game, view };
