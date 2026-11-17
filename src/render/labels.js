// HTML labels projected onto the 3D map: district names and citizen thought bubbles.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { DISTRICTS, HALF } from '../game/map.js';

// Labels sit inside each district, towards its outer corner, so all four stay on screen.
const INSET = HALF - 1.6;
const CORNERS = [
  [-INSET, -INSET],
  [INSET, -INSET],
  [-INSET, INSET],
  [INSET, INSET],
];

export class Labels {
  constructor(container, camera) {
    this.container = container;
    this.camera = camera;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();

    this.districtEls = DISTRICTS.map((d, i) => {
      const el = document.createElement('div');
      el.className = 'district-label';
      el.innerHTML = `<span class="name">${d.name}</span><span class="extra"></span>`;
      container.appendChild(el);
      return { el, extra: el.querySelector('.extra'), pos: new THREE.Vector3(CORNERS[i][0], 0, CORNERS[i][1]) };
    });

    this.bubble = null; // { el, citizenId, remaining }
    this.bubbleTimer = 2;
    this.wishMarkers = new Map(); // citizenId -> element
  }

  /** ✂️ markers with a countdown above buildings waiting for the ribbon to be cut. */
  updateRibbonMarkers(list) {
    this.ribbonMarkers ??= new Map();
    const keep = new Set();
    for (const r of list) {
      const key = `${r.x},${r.y}`;
      keep.add(key);
      let el = this.ribbonMarkers.get(key);
      if (!el) {
        el = document.createElement('div');
        el.className = 'event-marker ribbon-marker';
        el.innerHTML = '<div class="em-icon">✂️</div><div class="em-bar"><div></div></div>';
        this.container.appendChild(el);
        this.ribbonMarkers.set(key, el);
      }
      const bar = el.querySelector('.em-bar > div');
      bar.style.width = `${(Math.max(0, r.left) * 100).toFixed(1)}%`;
      bar.classList.toggle('low', r.left < 0.3);
      this.place(el, this.tmp2.set(r.x - 7.5, 1.0, r.y - 7.5));
    }
    for (const [key, el] of this.ribbonMarkers) {
      if (!keep.has(key)) {
        el.remove();
        this.ribbonMarkers.delete(key);
      }
    }
  }

  /** A short floating emoji (🤝, ✂️ …) above something that may move. */
  emote(text, getWorldPos, seconds = 1.6) {
    const el = document.createElement('div');
    el.className = 'emote';
    el.textContent = text;
    this.container.appendChild(el);
    (this.emotes ??= []).push({ el, getWorldPos, remaining: seconds, total: seconds });
  }

  updateEmotes(dt) {
    if (!this.emotes) return;
    for (let i = this.emotes.length - 1; i >= 0; i--) {
      const e = this.emotes[i];
      e.remaining -= dt;
      const p = e.getWorldPos();
      if (e.remaining <= 0 || !p) {
        e.el.remove();
        this.emotes.splice(i, 1);
        continue;
      }
      const rise = (1 - e.remaining / e.total) * 0.4;
      this.place(e.el, this.tmp2.set(p.x, 0.7 + rise, p.z));
      e.el.style.opacity = String(Math.min(1, e.remaining * 2));
    }
  }

  /** Bouncing marker with icon and a countdown bar above the current map event. */
  updateEventMarker(info, worldPos) {
    if (!info) {
      if (this.eventMarker) {
        this.eventMarker.remove();
        this.eventMarker = null;
      }
      return;
    }
    if (!this.eventMarker) {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = '<div class="em-icon"></div><div class="em-bar"><div></div></div>';
      this.container.appendChild(el);
      this.eventMarker = el;
    }
    this.eventMarker.querySelector('.em-icon').textContent = info.icon;
    const bar = this.eventMarker.querySelector('.em-bar > div');
    bar.style.width = `${(info.timeLeft * 100).toFixed(1)}%`;
    bar.classList.toggle('low', info.timeLeft < 0.3);
    this.place(this.eventMarker, worldPos);
  }

  /** "!" markers above citizens who currently want something. */
  updateWishMarkers(state, citizenLayer) {
    const active = new Set((state.wishes || []).map((w) => w.citizenId));
    for (const [id, el] of this.wishMarkers) {
      if (!active.has(id)) {
        el.remove();
        this.wishMarkers.delete(id);
      }
    }
    for (const id of active) {
      let el = this.wishMarkers.get(id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'wish-marker';
        el.textContent = '!';
        this.container.appendChild(el);
        this.wishMarkers.set(id, el);
      }
      const head = this.tmp.copy(citizenLayer.figureById(id).pos);
      head.y = 0.62;
      this.place(el, head.clone());
    }
  }

  /** Shows "fovšija 42" next to district names while the envy map is on. */
  setDistrictExtras(texts) {
    this.districtEls.forEach((d, i) => {
      d.extra.textContent = texts ? texts[i] : '';
      d.el.classList.toggle('with-extra', !!texts);
    });
  }

  project(worldPos) {
    const v = this.tmp.copy(worldPos).project(this.camera);
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, visible: v.z < 1 && v.z > -1 };
  }

  place(el, worldPos) {
    const p = this.project(worldPos);
    el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
  }

  showBubble(citizen, figure) {
    this.hideBubble();
    const el = document.createElement('div');
    el.className = `thought-bubble${citizen.protesting ? ' shout' : ''}`;
    el.innerHTML = `<div class="bubble-inner"><strong></strong><span></span></div>`;
    el.querySelector('strong').textContent = citizen.name.split(' ')[0];
    el.querySelector('span').textContent = citizen.thought;
    this.container.appendChild(el);
    this.bubble = { el, figure, remaining: CONFIG.citizens.bubbleDuration };
  }

  hideBubble() {
    if (this.bubble) {
      this.bubble.el.remove();
      this.bubble = null;
    }
  }

  update(dt, state, citizenLayer) {
    for (const d of this.districtEls) this.place(d.el, d.pos);
    this.updateWishMarkers(state, citizenLayer);

    // Occasionally a random citizen says what they think.
    // During unrest the protesters shout their slogans much more often.
    this.bubbleTimer -= dt;
    const protesters = state.unrest !== 'calm' && !state.party ? citizenLayer.protesters() : [];
    if (protesters.length && this.bubbleTimer > 2.2) this.bubbleTimer = 2.2;
    if (this.bubbleTimer <= 0) {
      const pool = protesters.length ? protesters : state.citizens.map((c) => c.id);
      const c = state.citizens[pool[Math.floor(Math.random() * pool.length)]];
      this.showBubble(c, citizenLayer.figureById(c.id));
      this.bubbleTimer = protesters.length ? 2.2 : CONFIG.citizens.bubbleEvery + CONFIG.citizens.bubbleDuration;
    }
    if (this.bubble) {
      this.bubble.remaining -= dt;
      const head = this.tmp.copy(this.bubble.figure.pos);
      head.y = 0.55;
      this.place(this.bubble.el, head.clone());
      if (this.bubble.remaining <= 0) this.hideBubble();
    }
  }
}
