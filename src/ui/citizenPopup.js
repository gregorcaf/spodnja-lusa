// Popup with citizen details; stays live-updated while open.

import { DISTRICTS } from '../game/map.js';
import { characterName, moodLabel, envyTargetLabel } from '../game/citizens.js';
import { moodOf } from '../game/stats.js';
import { escapeHtml } from './tooltip.js';

const DOT = { happy: '#5cc24f', neutral: '#f2c230', unhappy: '#e0473a' };

export function createCitizenPopup(game) {
  const el = document.getElementById('citizen-popup');
  let currentId = null;

  function render() {
    if (currentId == null) return;
    const s = game.state;
    const c = s.citizens[currentId];
    el.innerHTML = `
      <div class="cp-head">
        <span class="cp-dot" style="background:${DOT[moodOf(c, s)]}"></span>
        <div>
          <div class="cp-name">${escapeHtml(c.name)}</div>
          <div class="cp-role">${characterName(c)} · ${moodLabel(c, s)}</div>
        </div>
        <button class="cp-close" title="Zapri">×</button>
      </div>
      <div class="cp-body">
        <div class="cp-row"><span class="k">Domači konec</span><span>${DISTRICTS[c.home].name}</span></div>
        <div class="cp-row"><span class="k">Sreča</span><span>${Math.round(c.happy)} / 100</span></div>
        <div class="bar happy"><div style="width:${c.happy}%"></div></div>
        <div class="cp-row"><span class="k">Fovšija</span><span>${Math.round(c.envy)} / 100</span></div>
        <div class="bar envy"><div style="width:${c.envy}%"></div></div>
        <div class="cp-thought">»${escapeHtml(c.thought)}«</div>
        <div class="cp-envy"><span class="k">Fovšen${c.female ? 'a' : ''} je:</span> ${escapeHtml(envyTargetLabel(c))}</div>
      </div>`;
    el.querySelector('.cp-close').addEventListener('click', close);
  }

  function open(id, clientX, clientY) {
    currentId = id;
    el.hidden = false;
    render();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const x = Math.min(window.innerWidth - w - 12, clientX + 18);
    const y = Math.min(window.innerHeight - h - 12, Math.max(12, clientY - h / 2));
    el.style.left = `${Math.max(12, x)}px`;
    el.style.top = `${y}px`;
  }

  function close() {
    currentId = null;
    el.hidden = true;
  }

  game.on('state', render);
  game.on('thoughts', render);

  return { open, close };
}
