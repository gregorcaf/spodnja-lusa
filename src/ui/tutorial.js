// Guided tour for new mayors: a spotlight walks over the real UI and explains what
// influences what. Some steps are hands-on: the spotlighted area stays clickable and a
// small task (click a villager, turn on the envy map, build a house …) is ticked off when
// done. The game clock is paused for the whole tour; it can be skipped at any step.
// Player-facing text is Slovenian.

import { CONFIG } from '../config.js';
import { municipalityForms } from '../game/municipality.js';
import { escapeHtml as escapeText } from './tooltip.js';

const POINTER_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick'];

let active = false;

const $ = (sel) => () => document.querySelector(sel);
/** Elements of the top bar are found by their data-k hooks. */
const stat = (key) => () => document.querySelector(`#topbar [data-k="${key}"]`)?.closest('.stat');
const mapArea = $('#map-wrap');
const tooltipVisible = () => !document.getElementById('tooltip').hidden;
const hideTooltipNow = () => {
  document.getElementById('tooltip').hidden = true;
};

/** Houses (finished or under construction) – used to notice the player's first build. */
function houseCount(game) {
  return game.state.grid.filter((t) => t.type === 'house').length;
}

/** The first "for sale" sign that is actually on screen (falls back to the whole map). */
function visibleSaleSign() {
  const map = document.getElementById('map').getBoundingClientRect();
  for (const el of document.querySelectorAll('.sale-label')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.left < map.left || r.right > map.right || r.top < map.top || r.bottom > map.bottom) continue;
    // The wrapper sits on the anchor point; its pill and price are shifted left by half,
    // so the visible sign is the union of the children.
    return { getBoundingClientRect: () => [...el.children].map((c) => c.getBoundingClientRect()).reduce(unionRect) };
  }
  return document.getElementById('map');
}

/**
 * Step fields:
 *   target()   element (or {getBoundingClientRect}) to spotlight; none = centred card
 *   extra()    a neighbouring element spotlighted together with target
 *   focus()    element to ring with a pulsing marker (e.g. the button to press)
 *   interactive  the spotlighted area accepts clicks and hover
 *   noClick    hover only: clicks inside the spotlight are swallowed
 *   task       { text, begin?() → memo, done(memo), auto? (go on by itself once done) }
 *   doneText   extra explanation shown once the task is done
 *   enter()    setup before the step is shown (e.g. open a menu)
 *   leave()    cleanup when the step is left
 */
function steps(game, hooks) {
  const years = CONFIG.elections.termMonths / 12;
  return [
    {
      title: 'Dobrodošli, župan!',
      text: `<p>Pravkar ste postali župan ${escapeText(municipalityForms(game.state).obcine)}. Čestitamo – in sožalje.</p>
        <p>Cilj: <b>preživeti volitve</b> vsakih ${years} leta.</p>`,
    },
    {
      target: mapArea,
      interactive: true,
      title: 'Vaši občani',
      text: `<p>Figurice na cestah so občani.</p>`,
      task: { text: 'Kliknite na katerega koli občana.', done: () => hooks.popupOpen() },
      doneText: '<p>Z <b>rokovanjem</b> ga malo razveselite.</p>',
      leave: () => hooks.closePopup(),
    },
    {
      target: mapArea,
      focus: () => unionOf(document.getElementById('rot-left'), document.getElementById('rot-right')),
      interactive: true,
      title: 'Razgled po občini',
      text: `<p><b>Povlecite</b> za premik, <b>kolešček</b> za približevanje.</p>`,
      task: { text: 'Zasukajte pogled z gumbom ↩️ ali ↪️.', begin: () => hooks.cameraAngle(), done: (angle) => hooks.cameraAngle() !== angle },
      doneText: '',
    },
    {
      target: $('#topbar .speed-group'),
      title: 'Čas teče sam',
      text: `<p>Čas teče sam. Preslednica ga ustavi.</p>`,
    },
    {
      target: stat('budget'),
      title: 'Proračun',
      text: `<p>V oklepaju je mesečni izid.</p>`,
    },
    {
      target: stat('happy'),
      extra: stat('envy'),
      title: 'Sreča in fovšija',
      text: `<p>Kar zgradite v enem koncu, tamkajšnje razveseli, <b>vse ostale pa naredi fovšne</b>.</p>`,
    },
    {
      target: mapArea,
      focus: $('#envy-toggle'),
      interactive: true,
      title: 'Karta fovšije',
      text: `<p>Kje je fovšija največja?</p>`,
      task: { text: 'Kliknite gumb »Karta fovšije« zgoraj levo.', done: () => hooks.envyOn() },
      doneText: '<p><b>Rdeče je slabo.</b></p>',
      // The overlay would hide the village in later steps, so it goes off again.
      leave: () => hooks.setEnvy(false),
    },
    {
      target: stat('support'),
      extra: $('#topbar [data-k="election-stat"]'),
      title: 'Podpora in volitve',
      text: `<p>Na volitvah potrebujete <b>več kot polovico</b>.</p>`,
    },
    {
      target: stat('secret'),
      extra: $('#topbar [data-k="affair-stat"]'),
      title: 'Skrivni račun in afere',
      text: `<p>Umazan denar je priročen. Previsoko <b>tveganje afere</b> pa pripelje proteste.</p>`,
    },
    {
      target: $('#flyout'),
      focus: $('#tool-grid [data-tool="house"]'),
      interactive: true,
      title: 'Gradnja',
      text: `<p>Stavbe so v menijih desno.</p>`,
      task: { text: 'Izberite 🏠 Hišo.', begin: () => hooks.openMenu('homes'), done: () => hooks.tool() === 'house', auto: true },
      leave: () => hooks.closeMenu(),
    },
    {
      target: mapArea,
      interactive: true,
      title: 'Gradnja',
      text: `<p>Hiša mora stati <b>ob cesti</b>.</p>`,
      task: {
        text: 'Kliknite travnik ob cesti.',
        begin: () => houseCount(game),
        done: (memo) => houseCount(game) > memo,
      },
      doneText: `<p>Ko bo gotova, kliknite trak ✂️ za otvoritev.</p>`,
      leave: () => hooks.setTool(null),
    },
    {
      target: $('#lever-list'),
      interactive: true,
      noClick: true,
      enter: () => hooks.openMenu('levers'),
      leave: () => hooks.closeMenu(),
      title: 'Županovi vzvodi',
      text: `<p>Hitri ukrepi – vsak s stranskimi učinki.</p>`,
      task: { text: 'Z miško pokažite na kateri koli vzvod.', begin: hideTooltipNow, done: tooltipVisible },
      doneText: '<p>Tak oblaček je skoraj povsod.</p>',
    },
    {
      target: $('#tax-row'),
      enter: () => hooks.openMenu('tax'),
      leave: () => hooks.closeMenu(),
      title: 'Davek',
      text: `<p>Več davka, več denarja – in bolj sitni občani.</p>`,
    },
    {
      target: visibleSaleSign,
      interactive: true,
      noClick: true,
      title: 'Nova zemljišča',
      text: `<p>Kupljeno zemljišče postane nov zaselek.</p>`,
      task: { text: 'Pokažite z miško na tablo.', begin: hideTooltipNow, done: tooltipVisible },
    },
    {
      title: 'Še zadnje',
      text: `<p>Občasno vas čakajo odločitve in dogodki na zemljevidu.</p>
        <p><b>Srečno, župan. Občani vas imajo radi. Še.</b></p>`,
    },
  ];
}

/**
 * Runs the tour. Pauses the game and restores the previous speed at the end.
 * hooks: { popupOpen, closePopup, envyOn, setEnvy, cameraAngle, tool, setTool, openMenu, closeMenu } – UI state the tasks watch.
 * `onEnd(skipped)` runs when the tour closes.
 */
export function startTutorial(game, { hooks, onEnd } = {}) {
  if (active) return;
  active = true;
  const list = steps(game, hooks);
  const speedBefore = game.state.speed; // a tour started while paused stays paused
  game.setSpeed(0);
  document.body.classList.add('tutorial-on');

  const layer = document.createElement('div');
  layer.className = 'tut-layer';
  layer.innerHTML = `
    <div class="tut-block"></div><div class="tut-block"></div><div class="tut-block"></div><div class="tut-block"></div>
    <div class="tut-spot"></div>
    <div class="tut-focus"></div>
    <div class="tut-bubble" role="dialog" aria-live="polite">
      <div class="tut-kicker"></div>
      <h3 class="tut-title"></h3>
      <div class="tut-text"></div>
      <div class="tut-task"></div>
      <div class="tut-dots"></div>
      <footer class="tut-actions">
        <button class="tut-skip">Preskoči vodič</button>
        <span class="tut-gap"></span>
        <button class="tut-back">Nazaj</button>
        <button class="tut-next">Naprej</button>
      </footer>
    </div>`;
  document.body.appendChild(layer);

  const spot = layer.querySelector('.tut-spot');
  const focusRing = layer.querySelector('.tut-focus');
  const blocks = [...layer.querySelectorAll('.tut-block')];
  const bubble = layer.querySelector('.tut-bubble');
  const taskEl = layer.querySelector('.tut-task');
  const nextBtn = layer.querySelector('.tut-next');
  const backBtn = layer.querySelector('.tut-back');
  let i = 0;
  let memo = null; // per-step value from task.begin
  let taskDone = false;
  let hole = null; // spotlight rect of an interactive step
  let autoTimer = 0;

  function show() {
    const step = list[i];
    clearTimeout(autoTimer);
    step.enter?.();
    memo = step.task?.begin?.() ?? null;
    taskDone = false;
    layer.querySelector('.tut-kicker').textContent = i === 0 ? 'Vodič za nove župane' : `Vodič · ${i} / ${list.length - 1}`;
    layer.querySelector('.tut-title').textContent = step.title;
    layer.querySelector('.tut-dots').innerHTML = list.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('');
    backBtn.hidden = i === 0;
    layer.querySelector('.tut-skip').textContent = i === 0 ? 'Preskoči, znam sam' : 'Preskoči vodič';
    renderTask();
    place();
    nextBtn.focus({ preventScroll: true });
  }

  /** Text, task line and the "next" button for the current task state. */
  function renderTask() {
    const step = list[i];
    layer.querySelector('.tut-text').innerHTML = step.text + (taskDone && step.doneText ? step.doneText : '');
    taskEl.hidden = !step.task;
    if (step.task) {
      taskEl.className = `tut-task ${taskDone ? 'done' : ''}`;
      taskEl.textContent = taskDone ? '✓ Odlično!' : `👉 ${step.task.text}`;
    }
    // While a task is open, "next" is quieter (it still works, so nobody gets stuck).
    nextBtn.classList.toggle('pending', !!step.task && !taskDone);
    nextBtn.textContent = i === 0 ? 'Pokaži mi' : i === list.length - 1 ? 'Začni igrati' : step.task && !taskDone ? 'Preskoči korak' : 'Naprej';
  }

  /** Watches the current task. */
  const poll = setInterval(() => {
    const step = list[i];
    if (!step.task || taskDone || !step.task.done(memo)) return;
    taskDone = true;
    renderTask();
    place(); // the bubble may have grown
    if (step.task.auto) autoTimer = setTimeout(() => go(1), 700);
  }, 150);

  /** Positions the spotlight, click blockers, focus ring and the bubble. */
  function place() {
    const step = list[i];
    const target = step.target?.();
    layer.classList.toggle('tut-centered', !target);
    if (!target) {
      spot.hidden = true;
      focusRing.hidden = true;
      hole = null;
      blocks.forEach((b) => (b.hidden = true));
      bubble.style.left = '';
      bubble.style.top = '';
      return;
    }
    // Paired stats sit next to each other, so one spotlight covers both.
    const r = pad(unionRect(target.getBoundingClientRect(), step.extra?.()?.getBoundingClientRect()), 6);
    setBox(spot, r);
    spot.hidden = false;
    const f = step.focus?.();
    focusRing.hidden = !f;
    if (f) setBox(focusRing, pad(f.getBoundingClientRect(), 4));
    // Everything outside the spotlight is blocked; inside it only on interactive steps.
    hole = step.interactive ? r : null;
    placeBlocks(step.interactive ? r : null);

    const b = bubble.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;
    let x;
    let y;
    if (r.bottom + gap + b.height < vh) [x, y] = [r.left + r.width / 2 - b.width / 2, r.bottom + gap];
    else if (r.left - gap - b.width > 0) [x, y] = [r.left - gap - b.width, r.top + r.height / 2 - b.height / 2];
    else if (r.top - gap - b.height > 0) [x, y] = [r.left + r.width / 2 - b.width / 2, r.top - gap - b.height];
    else if (r.right + gap + b.width < vw) [x, y] = [r.right + gap, r.top + r.height / 2 - b.height / 2];
    // A big target (the map): inside it, bottom left, so the middle of the village stays free.
    else [x, y] = [r.left + 16, r.bottom - b.height - 40];
    bubble.style.left = `${Math.round(clampTo(x, 12, vw - b.width - 12))}px`;
    bubble.style.top = `${Math.round(clampTo(y, 12, vh - b.height - 12))}px`;
  }

  /** Four blockers around the hole (or one covering everything when there is no hole). */
  function placeBlocks(r) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const boxes = r
      ? [
          { left: 0, top: 0, width: vw, height: Math.max(0, r.top) },
          { left: 0, top: r.bottom, width: vw, height: Math.max(0, vh - r.bottom) },
          { left: 0, top: r.top, width: Math.max(0, r.left), height: r.height },
          { left: r.right, top: r.top, width: Math.max(0, vw - r.right), height: r.height },
        ]
      : [{ left: 0, top: 0, width: vw, height: vh }];
    blocks.forEach((el, k) => {
      el.hidden = !boxes[k];
      if (boxes[k]) setBox(el, boxes[k]);
    });
  }

  /** Hover-only steps: clicks inside the spotlight don't reach the game. */
  function swallowClicks(e) {
    const step = list[i];
    if (!step.noClick || !hole || bubble.contains(e.target)) return;
    if (e.clientX >= hole.left && e.clientX <= hole.right && e.clientY >= hole.top && e.clientY <= hole.bottom) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  function end(skipped) {
    clearInterval(poll);
    clearTimeout(autoTimer);
    list[i].leave?.();
    window.removeEventListener('resize', place);
    document.removeEventListener('keydown', onKey, true);
    POINTER_EVENTS.forEach((t) => window.removeEventListener(t, swallowClicks, true));
    layer.remove();
    document.body.classList.remove('tutorial-on');
    hooks?.setTool(null);
    hooks?.closeMenu?.();
    game.setSpeed(speedBefore);
    active = false;
    onEnd?.(skipped);
  }

  function onKey(e) {
    // The tour owns the keyboard while it is open (no pausing or tool shortcuts underneath).
    e.stopPropagation();
    if (e.key === 'Escape') end(true);
    else if (e.key === 'ArrowRight' || e.key === 'Enter') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    if (e.key !== 'Tab') e.preventDefault();
  }

  function go(delta) {
    clearTimeout(autoTimer);
    list[i].leave?.();
    if (i + delta >= list.length) return end(false);
    i = Math.max(0, i + delta);
    show();
  }

  nextBtn.addEventListener('click', () => go(1));
  backBtn.addEventListener('click', () => go(-1));
  layer.querySelector('.tut-skip').addEventListener('click', () => end(true));
  window.addEventListener('resize', place);
  document.addEventListener('keydown', onKey, true);
  POINTER_EVENTS.forEach((t) => window.addEventListener(t, swallowClicks, true));
  show();
}

export function tutorialActive() {
  return active;
}

/** A rect-like covering several elements (for the focus ring). */
function unionOf(...els) {
  return { getBoundingClientRect: () => els.map((e) => e.getBoundingClientRect()).reduce(unionRect) };
}

function setBox(el, r) {
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
}

function pad(r, p) {
  return { left: r.left - p, top: r.top - p, right: r.right + p, bottom: r.bottom + p, width: r.width + p * 2, height: r.height + p * 2 };
}

function unionRect(a, b) {
  if (!b) return a;
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  const right = Math.max(a.right, b.right);
  const bottom = Math.max(a.bottom, b.bottom);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function clampTo(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
