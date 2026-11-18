// Right side: a slim bar of icon buttons. »Na teren« and »Podiranje« are tools on their own;
// the building groups, the mayor's levers and the tax open a flyout menu next to the bar,
// so the map keeps as much room as possible. ⏭ ends the month.

import { CONFIG } from '../config.js';
import { TOOLS, toolCost, toolBlocked } from '../game/building.js';
import { LEVER_IDS } from '../game/levers.js';
import { TOOL_INFO, LEVER_TEXTS } from '../game/texts.js';
import { formatEuro, formatSigned } from '../game/util.js';
import { taxRate, taxHappiness, taxLevel } from '../game/taxes.js';
import { households } from '../game/population.js';
import { attachHelp } from './tooltip.js';
import { toolHelp, leverHelp, taxHelp } from './help.js';

/** Building groups, each its own menu. */
const BUILD_MENUS = [
  { id: 'homes', icon: '🏠', name: 'Bivanje', tools: ['road', 'house', 'flats', 'roundabout'] },
  { id: 'public', icon: '🏛️', name: 'Javno', tools: ['firehouse', 'clinic', 'police', 'cemetery', 'hall'] },
  { id: 'business', icon: '💼', name: 'Posel', tools: ['inn', 'shop', 'factory', 'vineyard'] },
];
const OTHER_MENUS = {
  levers: { icon: '🤝', name: 'Vzvodi', title: 'Županovi vzvodi' },
  tax: { icon: '💶', name: 'Davek', title: 'Davek na gospodinjstvo' },
};

export function createSidebar(el, game, { onToolChange, onLever, onNextMonth, onBlocked }) {
  let selected = null;
  let menu = null; // open flyout: 'homes' | 'public' | 'business' | 'levers' | 'tax' | null

  const railButton = (attrs, icon, label) => `<button class="rail-btn" ${attrs}><span class="r-icon">${icon}</span><small>${label}</small></button>`;
  el.innerHTML = `
    <nav class="rail" aria-label="Orodja">
      ${railButton('data-tool="inspect"', TOOL_INFO.inspect.icon, 'Na teren')}
      ${railButton('data-tool="demolish"', TOOL_INFO.demolish.icon, 'Podiranje')}
      <div class="rail-sep"></div>
      ${BUILD_MENUS.map((m) => railButton(`data-menu="${m.id}" title="${m.name}"`, m.icon, m.name)).join('')}
      <div class="rail-sep"></div>
      ${railButton('data-menu="levers" title="Županovi vzvodi"', OTHER_MENUS.levers.icon, OTHER_MENUS.levers.name)}
      ${railButton('data-menu="tax"', OTHER_MENUS.tax.icon, '<span id="rail-tax"></span>')}
      <div class="rail-gap"></div>
      <button id="next-month" class="rail-btn next" title="Naslednji mesec"><span class="r-icon">⏭</span><small>Mesec</small></button>
    </nav>
    <div class="flyout" id="flyout" hidden>
      <header class="flyout-head"><h2 id="flyout-title"></h2><button class="flyout-close" title="Zapri (Esc)">×</button></header>
      <div class="tool-grid" id="tool-grid"></div>
      <div id="lever-panel">
        <div class="lever-grid" id="lever-list"></div>
        <div class="deal-list" id="deal-list"></div>
      </div>
      <div class="tax-row" id="tax-row">
        <div class="tax-main">
          <button class="tax-btn" id="tax-down" title="Znižaj davek">−</button>
          <strong id="tax-value"></strong>
          <button class="tax-btn" id="tax-up" title="Zvišaj davek">+</button>
        </div>
        <div class="tax-effect" id="tax-effect"></div>
      </div>
    </div>`;

  const flyout = el.querySelector('#flyout');
  const toolGrid = el.querySelector('#tool-grid');
  const leverPanel = el.querySelector('#lever-panel');
  const leverList = el.querySelector('#lever-list');
  const dealList = el.querySelector('#deal-list');
  const taxRow = el.querySelector('#tax-row');
  const taxValue = el.querySelector('#tax-value');
  const taxEffect = el.querySelector('#tax-effect');
  const railTax = el.querySelector('#rail-tax');
  const menuButtons = [...el.querySelectorAll('[data-menu]')];
  el.querySelector('#tax-down').addEventListener('click', () => game.setTaxRate(taxRate(game.state) - CONFIG.taxes.step));
  el.querySelector('#tax-up').addEventListener('click', () => game.setTaxRate(taxRate(game.state) + CONFIG.taxes.step));
  attachHelp(taxRow, () => taxHelp(game));
  attachHelp(el.querySelector('[data-menu="tax"]'), () => taxHelp(game));
  el.querySelector('.flyout-close').addEventListener('click', () => closeMenu());
  el.querySelector('#next-month').addEventListener('click', onNextMonth);
  for (const b of menuButtons) b.addEventListener('click', () => (menu === b.dataset.menu ? closeMenu() : openMenu(b.dataset.menu)));

  // »Na teren« and »Podiranje«: tools right on the bar.
  const toolButtons = {};
  for (const id of ['inspect', 'demolish']) {
    const b = el.querySelector(`.rail [data-tool="${id}"]`);
    b.addEventListener('click', () => {
      setTool(id === 'inspect' ? null : id);
      closeMenu();
    });
    attachHelp(b, () => toolHelp(id, game));
    toolButtons[id] = b;
  }
  // Building tiles (icon, short name, price; the rest is in the hover help).
  for (const id of BUILD_MENUS.flatMap((m) => m.tools)) {
    const info = TOOL_INFO[id];
    const b = document.createElement('button');
    b.className = 'tool';
    b.dataset.tool = id;
    b.innerHTML = `<span class="t-icon">${info.icon}</span><span class="t-name">${info.label || info.name}</span><span class="t-cost"></span>`;
    b.addEventListener('click', () => {
      // Greyed out (too expensive or not yet possible): say why instead of picking it.
      const blocked = toolBlocked(game.state, id);
      if (blocked) return onBlocked?.(blocked.reason);
      setTool(id);
      closeMenu(); // pick and go: the map is free again for building
    });
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
    b.innerHTML = `<span class="l-icon">${t.icon}</span><span class="l-name">${t.label || t.name}</span><span class="l-cost"></span>`;
    b.addEventListener('click', () => onLever(id));
    leverList.appendChild(b);
    leverButtons[id] = b;
  }

  /** Opens one flyout menu (closing any other). */
  function openMenu(id) {
    menu = id;
    const group = BUILD_MENUS.find((m) => m.id === id);
    el.querySelector('#flyout-title').textContent = group ? `${group.icon} ${group.name}` : `${OTHER_MENUS[id].icon} ${OTHER_MENUS[id].title}`;
    toolGrid.hidden = !group;
    for (const t of BUILD_MENUS.flatMap((m) => m.tools)) toolButtons[t].hidden = !group?.tools.includes(t);
    leverPanel.hidden = id !== 'levers';
    taxRow.hidden = id !== 'tax';
    flyout.hidden = false;
    for (const b of menuButtons) b.classList.toggle('open', b.dataset.menu === id);
  }

  /** Closes the flyout. Returns true if one was open (so a map click only closes it). */
  function closeMenu() {
    if (!menu) return false;
    menu = null;
    flyout.hidden = true;
    for (const b of menuButtons) b.classList.remove('open');
    return true;
  }

  function setTool(tool) {
    selected = tool;
    for (const [id, b] of Object.entries(toolButtons)) {
      b.classList.toggle('selected', (id === 'inspect' && !tool) || id === tool);
    }
    // The group of the chosen building lights up on the bar.
    for (const b of menuButtons) {
      const group = BUILD_MENUS.find((m) => m.id === b.dataset.menu);
      b.classList.toggle('selected', !!group && group.tools.includes(tool));
    }
    onToolChange(tool);
  }

  function refresh() {
    const s = game.state;
    for (const id of TOOLS) {
      const b = toolButtons[id];
      if (id === 'demolish') continue;
      // Three looks: buildable, too expensive (grey, red price), locked by a condition (grey, 🔒).
      const blocked = toolBlocked(s, id);
      b.querySelector('.t-cost').textContent = blocked?.kind === 'locked' ? `🔒 ${blocked.need} preb.` : formatEuro(toolCost(id));
      b.classList.toggle('unaffordable', blocked?.kind === 'money');
      b.classList.toggle('locked', blocked?.kind === 'locked');
    }
    for (const id of LEVER_IDS) {
      const b = leverButtons[id];
      // 🤫 = paid from the secret account. Strength and conditions are in the hover help.
      const cost = formatEuro(CONFIG.levers[id].cost);
      b.querySelector('.l-cost').textContent = LEVER_TEXTS[id].fromSecret ? `🤫 ${cost}` : cost;
      b.querySelector('.l-cost').classList.toggle('secret', !!LEVER_TEXTS[id].fromSecret);
      b.classList.toggle('unavailable', !game.canUseLever(id).ok);
    }
    // Tax: the rate is always visible on the bar, the controls are in the menu.
    const rate = taxRate(s);
    const happy = taxHappiness(rate);
    const level = taxLevel(rate);
    const face = level === 'veryHigh' ? '🤬' : happy < -0.05 ? '😠' : happy > 0.05 ? '🙂' : '😐';
    taxValue.textContent = formatEuro(rate);
    railTax.textContent = `${rate} €`;
    const mood = Math.abs(happy) < 0.05 ? '' : ` ${formatSigned(happy, 1)}`;
    taxEffect.textContent = `${formatEuro(rate * households(s), { sign: true })}/mes · ${face}${mood}`;
    taxEffect.className = `tax-effect ${happy < -0.05 ? 'bad' : happy > 0.05 ? 'good' : ''}`;
    el.querySelector('#tax-down').disabled = rate <= CONFIG.taxes.min;
    el.querySelector('#tax-up').disabled = rate >= CONFIG.taxes.max;
    // Lasting deals from dilemma cards (shown with the levers).
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
    openMenu,
    closeMenu,
    get menuOpen() {
      return menu != null;
    },
    get tool() {
      return selected;
    },
  };
}
