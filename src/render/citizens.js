// Citizen figures: smooth walking on the road network, mood colours, party dancing.
// Movement is purely visual; the game state only tells us where people *want* to be.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SIZE, idx, inBounds, isWalkable, districtOf } from '../game/map.js';
import { moodOf } from '../game/stats.js';
import { createFigure } from './models.js';
import { tileToWorld, worldToTile } from './coords.js';

const MOOD_COLORS = {
  happy: new THREE.Color('#5cc24f'),
  neutral: new THREE.Color('#f2c230'),
  unhappy: new THREE.Color('#e0473a'),
};

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export class CitizenLayer {
  constructor(scene, game) {
    this.game = game;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.figures = [];
    this.time = 0;

    const state = game.state;
    for (const c of state.citizens) {
      const fig = createFigure();
      fig.hit.userData.citizenId = c.id;
      const start = this.randomRoadTile(c.home) || { x: 7, y: 7 };
      const f = {
        id: c.id,
        ...fig,
        // Each citizen walks slightly off the tile centre, like on a sidewalk.
        offset: new THREE.Vector2((Math.random() - 0.5) * 0.44, (Math.random() - 0.5) * 0.44),
        pos: new THREE.Vector3(),
        path: [],
        prevTile: null,
        mode: 'wander',
        pause: Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speedJitter: 0.8 + Math.random() * 0.4,
        danceSpot: null,
      };
      this.tileCenter(start.x, start.y, f, f.pos);
      f.group.position.copy(f.pos);
      this.group.add(f.group);
      this.figures.push(f);
    }
  }

  get hitboxes() {
    return this.figures.map((f) => f.hit);
  }

  figureById(id) {
    return this.figures[id];
  }

  tileCenter(x, y, f, target = new THREE.Vector3()) {
    tileToWorld(x, y, target);
    target.x += f.offset.x;
    target.z += f.offset.y;
    return target;
  }

  walkable(x, y) {
    return inBounds(x, y) && isWalkable(this.game.state.grid[idx(x, y)].type);
  }

  randomRoadTile(district) {
    const tiles = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (this.walkable(x, y) && (district == null || districtOf(x, y) === district)) tiles.push({ x, y });
      }
    }
    return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null;
  }

  /** Closest walkable tile to a world position, preferring the citizen's home district. */
  nearestWalkable(wx, wz, home = null) {
    let best = null;
    let bestScore = Infinity;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!this.walkable(x, y)) continue;
        const c = tileToWorld(x, y);
        let score = Math.hypot(c.x - wx, c.z - wz);
        if (home != null && districtOf(x, y) !== home) score += 2.5;
        if (score < bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
    }
    return best;
  }

  /** Breadth-first search over walkable tiles. Returns a list of tiles or null. */
  findPath(from, to) {
    const key = (t) => idx(t.x, t.y);
    const prev = new Map([[key(from), null]]);
    const queue = [from];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === to.x && cur.y === to.y) {
        const path = [];
        for (let t = cur; t; t = prev.get(key(t))) path.unshift(t);
        return path;
      }
      for (const [dx, dy] of DIRS) {
        const n = { x: cur.x + dx, y: cur.y + dy };
        if (!this.walkable(n.x, n.y) || prev.has(key(n))) continue;
        prev.set(key(n), cur);
        queue.push(n);
      }
    }
    return null;
  }

  planWander(f, c) {
    const here = worldToTile(f.pos.x, f.pos.z);
    if (!this.walkable(here.x, here.y)) {
      // Off-road (road demolished, or just back from the party): walk to the nearest road.
      const t = this.nearestWalkable(f.pos.x, f.pos.z, c.home);
      if (t) f.path.push(this.tileCenter(t.x, t.y, f));
      else f.pause = 1;
      f.prevTile = null;
      return;
    }

    const options = [];
    for (const [dx, dy] of DIRS) {
      const n = { x: here.x + dx, y: here.y + dy };
      if (!this.walkable(n.x, n.y)) continue;
      const back = f.prevTile && f.prevTile.x === n.x && f.prevTile.y === n.y;
      let w = districtOf(n.x, n.y) === c.home ? CONFIG.citizens.homeBias : 1 - CONFIG.citizens.homeBias;
      w = Math.max(w, 0.02);
      if (back) w *= 0.08; // avoid U-turns unless it's a dead end
      options.push({ n, w });
    }
    if (!options.length) {
      f.pause = 1 + Math.random();
      return;
    }
    let r = Math.random() * options.reduce((s, o) => s + o.w, 0);
    let choice = options[0].n;
    for (const o of options) {
      r -= o.w;
      if (r <= 0) {
        choice = o.n;
        break;
      }
    }
    f.prevTile = here;
    f.path.push(this.tileCenter(choice.x, choice.y, f));
    if (Math.random() < 0.08) f.pause = 0.5 + Math.random() * 1.5;
  }

  startParty(site) {
    const n = this.figures.length;
    const center = tileToWorld(site.x, site.y);
    const goal = this.nearestWalkable(center.x, center.z);
    this.figures.forEach((f, i) => {
      f.mode = 'party';
      f.path = [];
      f.pause = Math.random() * 0.6;
      const angle = (i / n) * Math.PI * 2;
      const radius = 0.85 + (i % 3) * 0.22;
      f.danceSpot = new THREE.Vector3(center.x + Math.cos(angle) * radius, 0, center.z + Math.sin(angle) * radius);

      const here = worldToTile(f.pos.x, f.pos.z);
      const start = this.walkable(here.x, here.y) ? here : this.nearestWalkable(f.pos.x, f.pos.z);
      const route = start && goal ? this.findPath(start, goal) : null;
      if (route) for (const t of route.slice(1)) f.path.push(this.tileCenter(t.x, t.y, f));
      f.path.push(f.danceSpot.clone());
    });
  }

  endParty() {
    for (const f of this.figures) {
      f.mode = 'wander';
      f.path = [];
      f.danceSpot = null;
      f.inner.position.y = 0;
      f.inner.rotation.set(0, 0, 0);
      f.pause = Math.random() * 1.5;
    }
  }

  /** Positions of figures currently dancing (for music-note effects). */
  dancers() {
    return this.figures.filter((f) => f.mode === 'party' && !f.path.length).map((f) => f.pos);
  }

  update(dt, hoveredId = null) {
    this.time += dt;
    const state = this.game.state;
    const speed = CONFIG.citizens.walkSpeed * (state.snow ? CONFIG.citizens.snowSpeedFactor : 1);

    for (const f of this.figures) {
      const c = state.citizens[f.id];
      f.bodyMat.color.copy(MOOD_COLORS[moodOf(c, state)]);
      f.bodyMat.emissive.setRGB(hoveredId === f.id ? 0.25 : 0, hoveredId === f.id ? 0.25 : 0, hoveredId === f.id ? 0.25 : 0);

      if (f.pause > 0) {
        f.pause -= dt;
        f.inner.position.y = 0;
      } else if (f.path.length) {
        const target = f.path[0];
        const dx = target.x - f.pos.x;
        const dz = target.z - f.pos.z;
        const dist = Math.hypot(dx, dz);
        // Partygoers hurry a bit.
        const step = speed * f.speedJitter * (f.mode === 'party' ? 1.6 : 1) * dt;
        if (dist <= step) {
          f.pos.set(target.x, 0, target.z);
          f.path.shift();
        } else {
          f.pos.x += (dx / dist) * step;
          f.pos.z += (dz / dist) * step;
        }
        if (dist > 0.001) f.group.rotation.y = Math.atan2(dx, dz);
        // Little walking bob.
        f.inner.position.y = Math.abs(Math.sin(this.time * 10 * speed + f.phase)) * 0.025;
        f.inner.rotation.y = 0;
      } else if (f.mode === 'party') {
        // Dance: hop and spin.
        f.inner.position.y = Math.abs(Math.sin(this.time * 7 + f.phase)) * 0.12;
        f.inner.rotation.y += dt * 4;
      } else {
        this.planWander(f, c);
      }
      f.group.position.copy(f.pos);
    }
  }
}
