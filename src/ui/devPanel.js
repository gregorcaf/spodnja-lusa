// Developer panel: sliders bound directly to CONFIG. Changes apply immediately.

import { CONFIG, getByPath, setByPath, resetConfig } from '../config.js';
import { groupThousands } from '../game/util.js';

// For now only taxes are adjustable. The full set of sliders (prices, effects, levers,
// unrest, music, ...) is in git history if we need it again for balancing.
function sliderGroups() {
  return [
    {
      title: 'Davki',
      open: true,
      rows: [{ path: 'economy.taxPerHouse', label: 'Davek na hišo (€/mes)', min: 0, max: 2000, step: 10 }],
    },
  ];
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
