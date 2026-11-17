// Dilemma card dialog: two choices, immediate effects shown, delayed ones only hinted at.

import { openModal } from './modal.js';
import { escapeHtml } from './tooltip.js';

export function showDilemma(card, onChoose) {
  const optionHtml = card.options
    .map(
      (o, i) => `
      <button class="dilemma-option" data-i="${i}">
        <span class="do-label">${escapeHtml(o.label)}</span>
        <span class="do-effects">${o.effects.length ? o.effects.map(escapeHtml).join(' · ') : 'brez takojšnjih posledic'}</span>
        ${o.unknown ? '<span class="do-unknown">❓ Kdo ve, kaj bo iz tega čez nekaj mesecev …</span>' : ''}
      </button>`,
    )
    .join('');
  const { el, close } = openModal(
    `<header><div class="kicker">Županova odločitev · igra je na pavzi</div><h3>${escapeHtml(card.title)}</h3></header>
     <div class="body"><p class="dilemma-text">${escapeHtml(card.text)}</p><div class="dilemma-options">${optionHtml}</div></div>`,
    { className: 'dilemma' },
  );
  el.querySelectorAll('.dilemma-option').forEach((b) =>
    b.addEventListener('click', () => {
      close();
      onChoose(Number(b.dataset.i));
    }),
  );
}
