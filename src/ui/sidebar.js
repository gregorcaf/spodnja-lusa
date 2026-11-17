// Right panel: build tools, mayor's levers and the "next month" button.

import { CONFIG } from '../config.js';
import { TOOLS, toolCost } from '../game/building.js';
import { LEVER_IDS } from '../game/levers.js';
import { TOOL_INFO, LEVER_TEXTS } from '../game/texts.js';
import { formatEuro, formatSigned } from '../game/util.js';
import { taxRate, taxHappiness, taxLevel } from '../game/taxes.js';
import { countTiles } from '../game/stats.js';
import { attachHelp } from './tooltip.js';
import { toolHelp, leverHelp, taxHelp } from './help.js';

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
      <div class="tax-row" id="tax-row">
        <div class="tax-main">
          <span class="tax-label">Davek na hišo</span>
          <button class="tax-btn" id="tax-down" title="Znižaj davek">−</button>
          <strong id="tax-value"></strong>
          <button class="tax-btn" id="tax-up" title="Zvišaj davek">+</button>
        </div>
        <div class="tax-effect" id="tax-effect"></div>
      </div>
      <button id="next-month">Naslednji mesec ⏭</button>
    </div>`;

  const toolGrid = el.querySelector('#tool-grid');
  const leverList = el.querySelector('#lever-list');
  const taxValue = el.querySelector('#tax-value');
  const taxEffect = el.querySelector('#tax-effect');
  el.querySelector('#tax-down').addEventListener('click', () => game.setTaxRate(taxRate(game.state) - CONFIG.taxes.step));
  el.querySelector('#tax-up').addEventListener('click', () => game.setTaxRate(taxRate(game.state) + CONFIG.taxes.step));
  attachHelp(el.querySelector('#tax-row'), () => taxHelp(game));
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
    attachHelp(b, () => toolHelp(id, game));
    toolGrid.appendChild(b);
    toolButtons[id] = b;
  }

  const leverButtons = {};
  for (const id of LEVER_IDS) {
    const t = LEVER_TEXTS[id];
    const b = document.createElement('button');
    b.className = 'lever';
    attachHelp(b, () => leverHelp(id, game));
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
    toolButtons.inspect.querySelector('.t-cost').textContent = 'brez gradnje';
    toolButtons.inspect.querySelector('.t-note').textContent = TOOL_INFO.inspect.note;
    for (const id of TOOLS) {
      const b = toolButtons[id];
      const cost = toolCost(id);
      const b2 = CONFIG.buildings[id];
      b.querySelector('.t-cost').textContent = formatEuro(cost);
      // Income buildings show what they earn, the rest what they cost per month.
      // Short line: monthly money (+ a hint only where it matters; hover help has the rest).
      let monthly = '';
      if (b2?.income) monthly = `${formatEuro(b2.income, { sign: true })}/mes`;
      else if (id === 'house') monthly = `${formatEuro(taxRate(s), { sign: true })}/mes`;
      else if (b2) monthly = `${formatEuro(b2.upkeep)}/mes`;
      const note = TOOL_INFO[id].note;
      b.querySelector('.t-note').textContent = [monthly, note].filter(Boolean).join(' · ');
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
    // Tax control: current rate and what it does to happiness every month.
    const rate = taxRate(s);
    const happy = taxHappiness(rate);
    const level = taxLevel(rate);
    taxValue.textContent = formatEuro(rate);
    const mood = Math.abs(happy) < 0.05 ? 'brez vpliva na srečo' : `sreča ${formatSigned(happy, 1)}/mes`;
    const warn = level === 'veryHigh' ? ' · ⚠️ občani besnijo' : level === 'high' ? ' · občani godrnjajo' : '';
    taxEffect.textContent = `${formatEuro(rate * countTiles(s, 'house'))}/mes · ${mood}${warn}`;
    taxEffect.className = `tax-effect ${happy < -0.05 ? 'bad' : happy > 0.05 ? 'good' : ''}`;
    el.querySelector('#tax-down').disabled = rate <= CONFIG.taxes.min;
    el.querySelector('#tax-up').disabled = rate >= CONFIG.taxes.max;
    // Lasting deals from dilemma cards.
    dealList.innerHTML = s.modifiers
      .map((m) => {
        const money = m.monthlyBudget ? ` · ${formatEuro(m.monthlyBudget, { sign: true })}/mes` : '';
        return `<div class="deal ${m.monthlyBudget > 0 ? 'good' : ''}">⏳ ${m.label}${money} <span>še ${m.months} mes.</span></div>`;
      })
      .join('');
  }

  game.on('state', refresh);
  refresh();
  setTool(null);

  return {
    setTool,
    get tool() {
      return selected;
    },
  };
}
