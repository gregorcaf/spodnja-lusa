// "Želje občanov" panel on the map: active wishes with deadlines and a pay button.

import { CONFIG } from '../config.js';
import { wishAction } from '../game/wishes.js';
import { escapeHtml } from './tooltip.js';

export function createWishPanel(el, game, { onPay, onSelect }) {
  function render() {
    const s = game.state;
    if (!s.wishes.length) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.innerHTML = `<div class="wp-head">📋 Želje občanov</div>${s.wishes
      .map((w) => {
        const c = s.citizens[w.citizenId];
        const urgent = w.monthsLeft <= 1 ? ' urgent' : '';
        const action =
          w.cost != null
            ? `<div class="wp-actions">
                 <button class="wp-pay" data-uid="${w.uid}" ${s.budget < w.cost ? 'disabled' : ''}>${escapeHtml(wishAction(w, s))}</button>
                 <button class="wp-pay secret" data-uid="${w.uid}" data-secret="1" ${s.secret < w.cost ? 'disabled' : ''}
                   title="Iz skrivnega računa: +${CONFIG.wishes.secretPropaganda} propaganda, +${CONFIG.wishes.secretAffair} tveganje afere">iz žepa</button>
               </div>`
            : `<span class="wp-build">🔨 ${escapeHtml(wishAction(w, s))}</span>`;
        return `<div class="wp-item${urgent}">
          <div class="wp-top"><button class="wp-name" data-id="${c.id}">${escapeHtml(c.name)}</button>
          <span class="wp-left">še ${w.monthsLeft} mes.</span></div>
          <div class="wp-text">»${escapeHtml(w.text)}«</div>
          ${action}</div>`;
      })
      .join('')}`;
    el.querySelectorAll('.wp-pay').forEach((b) =>
      b.addEventListener('click', () => onPay(b.dataset.uid, b.dataset.secret === '1')),
    );
    el.querySelectorAll('.wp-name').forEach((b) => b.addEventListener('click', (e) => onSelect(Number(b.dataset.id), e)));
  }

  game.on('wishes', render);
  game.on('state', render);
  render();
}
