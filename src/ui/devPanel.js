// Developer panel: sliders bound directly to CONFIG. Changes apply immediately.

import { CONFIG, getByPath, setByPath, resetConfig } from '../config.js';
import { TOOL_INFO } from '../game/texts.js';
import { BUILD_TOOLS } from '../game/building.js';
import { groupThousands } from '../game/util.js';

const LEVER_NAMES = {
  cousin: 'Razpis za bratranca',
  praise: 'Glasilo: Hvalospevi',
  neighbor: 'Glasilo: Sosednja občina',
  snow: 'Nenadni sneg',
  party: 'Gasilska veselica',
};

function sliderGroups() {
  const groups = [];

  groups.push({
    title: 'Cene in vzdrževanje objektov',
    open: true,
    rows: [
      ...BUILD_TOOLS.flatMap((t) => [
        { path: `buildings.${t}.cost`, label: `${TOOL_INFO[t].name}: cena`, min: 0, max: 300000, step: 500 },
        { path: `buildings.${t}.upkeep`, label: `${TOOL_INFO[t].name}: vzdrževanje`, min: 0, max: 10000, step: 10 },
      ]),
      { path: 'demolish.cost', label: 'Podiranje: cena', min: 0, max: 20000, step: 100 },
    ],
  });

  groups.push({
    title: 'Učinki gradnje',
    rows: BUILD_TOOLS.flatMap((t) => [
      { path: `buildings.${t}.homeHappy`, label: `${TOOL_INFO[t].name}: sreča domačih`, min: -30, max: 30, step: 1 },
      { path: `buildings.${t}.envyElse`, label: `${TOOL_INFO[t].name}: fovšija drugod`, min: -30, max: 30, step: 1 },
      { path: `buildings.${t}.allHappy`, label: `${TOOL_INFO[t].name}: sreča vseh`, min: -20, max: 20, step: 1 },
    ]),
  });

  groups.push({
    title: 'Moč fovšije',
    rows: [
      { path: 'envy.multiplier', label: 'Množitelj fovšije', min: 0, max: 3, step: 0.05 },
      { path: 'envy.oppositeMultiplier', label: 'Nasprotni konec ×', min: 1, max: 3, step: 0.05 },
    ],
  });

  groups.push({
    title: 'Mesečni prihodki in stroški',
    rows: [
      { path: 'economy.baseIncome', label: 'Osnovni prihodki', min: 0, max: 30000, step: 100 },
      { path: 'economy.taxPerHouse', label: 'Davek na hišo', min: 0, max: 2000, step: 10 },
      { path: 'economy.baseCost', label: 'Plače in kava', min: 0, max: 30000, step: 100 },
      { path: 'month.happinessTarget', label: 'Sreča se približa k', min: 0, max: 100, step: 1 },
      { path: 'month.happinessPull', label: 'Hitrost približevanja', min: 0, max: 0.5, step: 0.01 },
      { path: 'month.envyDrift', label: 'Mesečna rast fovšije', min: 0, max: 10, step: 0.5 },
    ],
  });

  const L = (id, key, label, min, max, step) => ({ path: `levers.${id}.${key}`, label: `${LEVER_NAMES[id]}: ${label}`, min, max, step });
  groups.push({
    title: 'Učinki vzvodov',
    rows: [
      L('cousin', 'cost', 'cena', 0, 20000, 100),
      L('cousin', 'secretMin', 'skrivni račun min', 0, 50000, 500),
      L('cousin', 'secretMax', 'skrivni račun max', 0, 80000, 500),
      L('cousin', 'affairMin', 'afera min', 0, 50, 1),
      L('cousin', 'affairMax', 'afera max', 0, 50, 1),
      L('praise', 'cost', 'cena', 0, 20000, 100),
      L('praise', 'propaganda', 'propaganda', 0, 30, 1),
      L('praise', 'decay', 'upad (×)', 0.3, 1, 0.05),
      L('praise', 'recovery', 'obnova na mesec', 0, 1, 0.05),
      L('praise', 'grumblerEnvy', 'fovšija nergačev', 0, 20, 1),
      L('neighbor', 'cost', 'cena', 0, 20000, 100),
      L('neighbor', 'envyReduction', 'fovšija dol', 0, 40, 1),
      L('neighbor', 'decay', 'upad (×)', 0.3, 1, 0.05),
      L('snow', 'cost', 'cena', 0, 20000, 100),
      L('snow', 'happiness', 'sreča', -30, 10, 1),
      L('snow', 'secret', 'skrivni račun', 0, 30000, 500),
      L('snow', 'affair', 'afera', -40, 10, 1),
      L('party', 'cost', 'cena', 0, 20000, 100),
      L('party', 'envyReduction', 'fovšija dol', 0, 50, 1),
      L('party', 'happiness', 'sreča', 0, 40, 1),
      L('party', 'decay', 'upad (×)', 0.3, 1, 0.05),
      L('party', 'duration', 'trajanje (s)', 5, 60, 1),
    ],
  });

  groups.push({
    title: 'Občani',
    rows: [
      { path: 'citizens.walkSpeed', label: 'Hitrost hoje', min: 0, max: 4, step: 0.05 },
      { path: 'citizens.snowSpeedFactor', label: 'Hitrost v snegu (×)', min: 0.1, max: 1, step: 0.05 },
      { path: 'citizens.homeBias', label: 'Zvestoba domačemu koncu', min: 0, max: 1, step: 0.05 },
    ],
  });

  groups.push({
    title: 'Glasba',
    rows: [
      { path: 'audio.musicVolume', label: 'Glasnost', min: 0, max: 1, step: 0.05 },
      { path: 'audio.tempo', label: 'Tempo (udarcev/min)', min: 80, max: 180, step: 1 },
    ],
  });

  return groups;
}

function formatValue(v, step) {
  const decimals = step < 1 ? String(step).split('.')[1].length : 0;
  if (!decimals) return `${v < 0 ? '−' : ''}${groupThousands(v)}`;
  return Number(v).toLocaleString('sl-SI', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function createDevPanel(el, game) {
  const inputs = [];

  el.innerHTML = `
    <div class="dev-head">
      <strong>🛠 Razvijalski panel</strong>
      <button id="dev-reset">Ponastavi</button>
    </div>
    <div class="dev-body"></div>`;
  const body = el.querySelector('.dev-body');

  for (const g of sliderGroups()) {
    const details = document.createElement('details');
    details.open = !!g.open;
    details.innerHTML = `<summary>${g.title}</summary>`;
    for (const r of g.rows) {
      const row = document.createElement('div');
      row.className = 'dev-row';
      const id = `dev-${r.path.replace(/\./g, '-')}`;
      row.innerHTML = `<label for="${id}">${r.label}</label><output></output>
        <input type="range" id="${id}" min="${r.min}" max="${r.max}" step="${r.step}">`;
      const input = row.querySelector('input');
      const output = row.querySelector('output');
      input.addEventListener('input', () => {
        setByPath(CONFIG, r.path, Number(input.value));
        output.textContent = formatValue(input.value, r.step);
        game.configChanged();
      });
      details.appendChild(row);
      inputs.push({ input, output, row: r });
    }
    body.appendChild(details);
  }

  function sync() {
    for (const { input, output, row } of inputs) {
      const v = getByPath(CONFIG, row.path);
      input.value = v;
      output.textContent = formatValue(v, row.step);
    }
  }

  el.querySelector('#dev-reset').addEventListener('click', () => {
    resetConfig();
    sync();
    game.configChanged();
  });

  sync();

  return {
    toggle(force) {
      el.hidden = force === undefined ? !el.hidden : !force;
      return !el.hidden;
    },
  };
}
