// Popup with citizen details; stays live-updated while open.

import { DISTRICTS } from '../game/map.js';
import { characterName, moodLabel, envyTargetLabel } from '../game/citizens.js';
import { moodOf } from '../game/stats.js';
import { escapeHtml } from './tooltip.js';
import { wishAction } from '../game/wishes.js';
import { checkBuyVote, votePrice } from '../game/elections.js';
import { checkEnvelope, envelopePrice } from '../game/envelopes.js';
import { formatEuro } from '../game/util.js';

const DOT = { happy: '#5cc24f', neutral: '#f2c230', unhappy: '#e0473a' };

export function createCitizenPopup(game, { onPayWish, onBuyVote, onEnvelope, onShake, onListen } = {}) {
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
        <div class="cp-mayor">
          <button class="cp-shake" title="Župan stopi do občana in mu stisne roko">🤝 Rokuj se</button>
          <button class="cp-listen" title="Župan prisluhne – včasih iz tega nastane želja">👂 Prisluhni</button>
        </div>
        ${statusHtml(c, s)}
      </div>`;
    el.querySelector('.cp-close').addEventListener('click', close);
    el.querySelectorAll('.cp-pay').forEach((b) =>
      b.addEventListener('click', () => onPayWish?.(b.dataset.uid, b.dataset.secret === '1')),
    );
    el.querySelector('.cp-envelope')?.addEventListener('click', () => onEnvelope?.(c.id));
    el.querySelector('.cp-shake').addEventListener('click', () => onShake?.(c.id));
    el.querySelector('.cp-listen').addEventListener('click', () => onListen?.(c.id));
    el.querySelector('.cp-buy')?.addEventListener('click', () => onBuyVote?.(c.id));
  }

  function statusHtml(c, s) {
    const parts = [];
    const wish = s.wishes.find((w) => w.citizenId === c.id);
    if (wish) {
      const action =
        wish.cost != null
          ? `<div class="cp-pay-row"><button class="cp-pay" data-uid="${wish.uid}" ${s.budget < wish.cost ? 'disabled' : ''}>${escapeHtml(wishAction(wish, s))}</button>
             <button class="cp-pay secret" data-uid="${wish.uid}" data-secret="1" ${s.secret < wish.cost ? 'disabled' : ''}>iz žepa</button></div>`
          : `<div class="muted">🔨 ${escapeHtml(wishAction(wish, s))}</div>`;
      parts.push(`<div class="cp-wish"><strong>Želja</strong> (še ${wish.monthsLeft} mes.): ${escapeHtml(wish.text)}${action}</div>`);
    }
    if (c.loyalMonths > 0) parts.push(`<div class="cp-tag loyal">💚 Zvest${c.female ? 'a' : ''} županu še ${c.loyalMonths} mes.</div>`);
    if (c.grudgeMonths > 0) parts.push(`<div class="cp-tag grudge">😤 Zamera še ${c.grudgeMonths} mes.</div>`);
    if (c.id === s.opponentId) parts.push('<div class="cp-tag grudge">🗳️ Protikandidat na volitvah</div>');
    if (c.boughtVote) parts.push('<div class="cp-tag loyal">💰 Glas je kupljen</div>');
    else if (!s.campaign && c.id !== s.opponentId && !(c.loyalMonths > 0)) {
      // Outside the campaign: an envelope buys loyalty for a year.
      const check = checkEnvelope(s, c.id);
      parts.push(
        `<button class="cp-envelope" ${check.ok ? '' : `disabled title="${escapeHtml(check.reason)}"`}>💌 Podari kuverto · ${formatEuro(envelopePrice(s))} iz skrivnega računa</button>
         <div class="cp-note">Zvest${c.female ? 'a' : ''} 12 mes. · tveganje afere +5</div>`,
      );
    } else if (s.campaign && c.id !== s.opponentId) {
      const check = checkBuyVote(s, c.id);
      parts.push(
        `<button class="cp-buy" ${check.ok ? '' : `disabled title="${escapeHtml(check.reason)}"`}>💰 Kupi glas · ${formatEuro(votePrice(s))} iz skrivnega računa</button>`,
      );
    }
    return parts.join('');
  }

  let side = 'right'; // which side of the citizen the popup sits on

  function open(id) {
    currentId = id;
    lastThought = game.state.citizens[id].thought;
    el.hidden = false;
    render();
  }

  function close() {
    currentId = null;
    el.hidden = true;
  }

  /**
   * Called every frame with the citizen's screen position: the popup sits next to
   * them and follows as they walk, with an arrow pointing at their head.
   */
  function follow(anchor) {
    if (currentId == null || !anchor) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 26;
    const margin = 12;
    // Switch sides only when there's really no room (avoids flickering at the edge).
    if (side === 'right' && anchor.x + gap + w > window.innerWidth - margin) side = 'left';
    else if (side === 'left' && anchor.x - gap - w < margin) side = 'right';
    let x = side === 'right' ? anchor.x + gap : anchor.x - gap - w;
    x = Math.max(margin, Math.min(window.innerWidth - w - margin, x));
    const y = Math.max(margin, Math.min(window.innerHeight - h - margin, anchor.y - h / 2));
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    el.dataset.side = side;
    // The arrow stays at the citizen's height even when the popup is clamped.
    el.style.setProperty('--arrow-y', `${Math.max(18, Math.min(h - 18, anchor.y - y)).toFixed(1)}px`);
    el.classList.toggle('offscreen', !anchor.inside);
  }

  game.on('state', render);
  // Only redraw when this citizen's thought changed; redrawing on every citizen's
  // thought (several per second) would swap the buttons out from under the mouse.
  let lastThought = null;
  game.on('thoughts', () => {
    if (currentId == null) return;
    const t = game.state.citizens[currentId].thought;
    if (t !== lastThought) {
      lastThought = t;
      render();
    }
  });
  game.on('wishes', render);

  return {
    open,
    close,
    follow,
    get currentId() {
      return currentId;
    },
  };
}
