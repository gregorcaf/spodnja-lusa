// Right panel: build tools, mayor's levers and the "next month" button.

import { CONFIG } from '../config.js';
import { TOOLS, toolCost } from '../game/building.js';
import { LEVER_IDS } from '../game/levers.js';
import { TOOL_INFO, LEVER_TEXTS } from '../game/texts.js';
import { formatEuro } from '../game/util.js';

export function createSidebar(el, game, { onToolChange, onLever, onNextMonth }) {
  let selected = null;

  el.innerHTML = `
    <div class="side-scroll">
      <section class="side-section">
        <h2>Gradnja</h2>
        <div class="tool-grid" id="tool-grid"></div>
      </section>
      <section class="side-section">
        <h2>Županovi vzvodi</h2>
        <div class="lever-grid" id="lever-list"></div>
        <div class="deal-list" id="deal-list"></div>
      </section>
    </div>
    <div class="side-footer">
      <button id="next-month">Naslednji mesec ⏭</button>
      <div class="next-sub" id="next-sub"></div>
    </div>`;

  const toolGrid = el.querySelector('#tool-grid');
  const leverList = el.querySelector('#lever-list');
  const nextSub = el.querySelector('#next-sub');
  const dealList = el.querySelector('#deal-list');

  // Build tool buttons once; refresh() only updates their texts.
  const toolButtons = {};
  // Order: inspect + demolish first, the big hall last (full width).
  for (const id of ['inspect', 'demolish', 'road', 'house', 'roundabout', 'firehouse', 'inn', 'factory', 'hall']) {
    const info = TOOL_INFO[id];
    const b = document.createElement('button');
    b.className = 'tool';
    b.dataset.tool = id;
    if (id === 'hall') b.classList.add('wide');
    b.innerHTML = `<span class="t-name">${info.icon} ${info.name}</span><span class="t-cost"></span><span class="t-note"></span>`;
    b.addEventListener('click', () => setTool(id === 'inspect' ? null : id));
    toolGrid.appendChild(b);
    toolButtons[id] = b;
  }

  const leverButtons = {};
  for (const id of LEVER_IDS) {
    const t = LEVER_TEXTS[id];
    const b = document.createElement('button');
    b.className = 'lever';
    b.title = t.desc;
    b.innerHTML = `<span class="l-name">${t.icon} ${t.name}</span><span class="l-cost"></span>`;
    b.addEventListener('click', () => onLever(id));
    leverList.appendChild(b);
    leverButtons[id] = b;
  }

  el.querySelector('#next-month').addEventListener('click', onNextMonth);

  function setTool(tool) {
    selected = tool;
    for (const [id, b] of Object.entries(toolButtons)) {
      b.classList.toggle('selected', (id === 'inspect' && !tool) || id === tool);
    }
    onToolChange(tool);
  }

  function refresh() {
    const s = game.state;
    toolButtons.inspect.querySelector('.t-cost').textContent = 'brezplačno';
    toolButtons.inspect.querySelector('.t-note').textContent = TOOL_INFO.inspect.note;
    for (const id of TOOLS) {
      const b = toolButtons[id];
      const cost = toolCost(id);
      const b2 = CONFIG.buildings[id];
      b.querySelector('.t-cost').textContent = formatEuro(cost);
      // Income buildings show what they earn, the rest what they cost per month.
      let monthly = '';
      if (b2?.income) monthly = `${formatEuro(b2.income, { sign: true })}/mes · `;
      else if (id === 'house') monthly = `${formatEuro(CONFIG.economy.taxPerHouse, { sign: true })}/mes · `;
      else if (b2) monthly = `${formatEuro(b2.upkeep)}/mes · `;
      b.querySelector('.t-note').textContent = monthly + TOOL_INFO[id].note;
      b.querySelector('.t-note').classList.toggle('earns', !!b2?.income || id === 'house');
      b.classList.toggle('unaffordable', s.budget < cost);
    }
    for (const id of LEVER_IDS) {
      const b = leverButtons[id];
      const mult = s.leverMult[id];
      const multHtml = mult !== undefined && mult < 0.999 ? `<span class="l-mult">učinek ${Math.round(mult * 100)} %</span>` : '';
      const from = LEVER_TEXTS[id].fromSecret ? '<span class="l-mult">iz skrivnega računa</span>' : '';
      b.querySelector('.l-cost').innerHTML = `${formatEuro(CONFIG.levers[id].cost)}${from}${multHtml}`;
      b.classList.toggle('unavailable', !game.canUseLever(id).ok);
    }
    nextSub.textContent = 'Čas teče sam. Gumb preskoči na konec meseca.';
    // Lasting deals from dilemma cards.
    dealList.innerHTML = s.modifiers
      .map((m) => {
        const money = m.monthlyBudget ? ` · ${formatEuro(m.monthlyBudget, { sign: true })}/mes` : '';
        return `<div class="deal ${m.monthlyBudget > 0 ? 'good' : ''}">⏳ ${m.label}${money} <span>še ${m.months} mes.</span></div>`;
      })
      .join('');
  }

  game.on('state', refresh);
  game.on('config', refresh);
  refresh();
  setTool(null);

  return {
    setTool,
    get tool() {
      return selected;
    },
  };
}
