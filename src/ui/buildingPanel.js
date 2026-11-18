// Building panel: opened by clicking a building. Shows its status (construction / ribbon),
// monthly money and the upgrades that can be bought.

import { CONFIG } from '../config.js';
import { DISTRICTS, idx, districtOf } from '../game/map.js';
import { BUILDINGS, TOOL_INFO, NO_ROAD } from '../game/texts.js';
import { upgradesFor, checkUpgrade } from '../game/upgrades.js';
import { describeEffect } from '../game/effects.js';
import { taxRate } from '../game/taxes.js';
import { formatEuro } from '../game/util.js';
import { NEEDS_ROAD, hasRoadAccess } from '../game/roads.js';
import { escapeHtml } from './tooltip.js';

const ICONS = { ...Object.fromEntries(Object.entries(TOOL_INFO).map(([k, v]) => [k, v.icon])), church: '⛪' };

export function createBuildingPanel(game, { onBuy, onRibbon }) {
  const el = document.getElementById('building-panel');
  let current = null; // { x, y }

  function render() {
    if (!current) return;
    const s = game.state;
    const { x, y } = current;
    const tile = s.grid[idx(x, y)];
    if (!BUILDINGS[tile.type] || tile.type === 'road') return close();
    const district = DISTRICTS[districtOf(x, y)];
    const b = CONFIG.buildings[tile.type];

    let status = '';
    if (NEEDS_ROAD.has(tile.type) && !hasRoadAccess(s, x, y)) {
      status += `<div class="bp-status ribbon">🚧 ${NO_ROAD[tile.type]}</div>`;
    }
    if (tile.build?.phase === 'construction') status += '<div class="bp-status">🏗️ V gradnji</div>';
    if (tile.build?.phase === 'opening') status += `<div class="bp-status ribbon"><button class="bp-ribbon">✂️ Prereži trak</button></div>`;

    const money = [];
    if (tile.type === 'house') money.push(`👥 ${CONFIG.population.perHousehold} · ${formatEuro(taxRate(s), { sign: true })}/mes`);
    if (tile.type === 'flats') {
      const n = CONFIG.population.flatsHouseholds;
      money.push(`👥 ${n * CONFIG.population.perHousehold} · ${formatEuro(taxRate(s) * n, { sign: true })}/mes`);
    }
    if (b?.income) money.push(`${formatEuro(b.income, { sign: true })}/mes`);
    if (b?.upkeep) money.push(`${formatEuro(-b.upkeep)}/mes`);

    const ctx = { district: districtOf(x, y) };
    const ups = upgradesFor(tile.type)
      .map((u) => {
        const done = tile.upgrades?.includes(u.id);
        const check = checkUpgrade(s, x, y, u.id);
        const effects = describeEffect(u.effect, ctx, s);
        if (u.monthly) effects.push(`${formatEuro(u.monthly, { sign: true })}/mes`);
        const action = done
          ? '<span class="bp-done">✔ narejeno</span>'
          : `<button class="bp-buy" data-id="${u.id}" ${check.ok ? '' : `disabled title="${escapeHtml(check.reason)}"`}>Kupi · ${formatEuro(u.cost)}</button>`;
        return `<div class="bp-up${done ? ' done' : ''}">
          <div class="bp-up-name" title="${escapeHtml(u.desc)}">${escapeHtml(u.name)}</div>
          <div class="bp-up-fx">${escapeHtml(effects.join(' · '))}</div>
          ${action}</div>`;
      })
      .join('');

    el.innerHTML = `
      <div class="cp-head">
        <span class="bp-icon">${ICONS[tile.type] || '🏠'}</span>
        <div><div class="cp-name">${escapeHtml(BUILDINGS[tile.type].name)}</div><div class="cp-role">${district.name}</div></div>
        <button class="cp-close" title="Zapri">×</button>
      </div>
      <div class="cp-body">
        ${status}
        ${money.length ? `<div class="bp-money">${money.join(' · ')}</div>` : ''}
        ${ups ? `<div class="bp-title">Izboljšave</div>${ups}` : '<div class="muted">Tukaj ni kaj izboljšati.</div>'}
      </div>`;
    el.querySelector('.cp-close').addEventListener('click', close);
    el.querySelector('.bp-ribbon')?.addEventListener('click', () => onRibbon(x, y));
    el.querySelectorAll('.bp-buy').forEach((btn) => btn.addEventListener('click', () => onBuy(x, y, btn.dataset.id)));
  }

  function open(x, y, clientX, clientY) {
    current = { x, y };
    el.hidden = false;
    render();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, clientX + 20))}px`;
    el.style.top = `${Math.max(12, Math.min(window.innerHeight - h - 12, clientY - h / 2))}px`;
  }

  function close() {
    current = null;
    el.hidden = true;
  }

  game.on('state', render);
  game.on('tile', ({ x, y }) => current && current.x === x && current.y === y && render());

  return {
    open,
    close,
    get current() {
      return current;
    },
  };
}
