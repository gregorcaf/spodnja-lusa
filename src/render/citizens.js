// Citizen figures: smooth walking on the road network, mood colours, party dancing.
// Movement is purely visual; the game state only tells us where people *want* to be.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SIZE, idx, inBounds, isWalkable, districtOf } from '../game/map.js';
import { moodOf } from '../game/stats.js';
import { seasonOf } from '../game/seasons.js';
import { createFigure } from './models.js';
import { tileToWorld, worldToTile } from './coords.js';

const MOOD_COLORS = {
  happy: new THREE.Color('#5cc24f'),
  neutral: new THREE.Color('#f2c230'),
  unhappy: new THREE.Color('#e0473a'),
};

const RIOT_COLOR = new THREE.Color('#ff2a1a');
const CHURCH_POS = new THREE.Vector3(-1.5, 0, -1.5);
const PROTEST_CENTER = new THREE.Vector3(0, 0, 0);

/** Random standing spot on the plus-shaped main crossroads (world x/z within the two-lane roads). */
function randomProtestSpot() {
  const along = (Math.random() * 2 - 1) * 2.6;
  const across = (Math.random() * 2 - 1) * 0.85;
  return Math.random() < 0.5 ? new THREE.Vector3(along, 0, across) : new THREE.Vector3(across, 0, along);
}

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
        spot: null, // where to stand while partying / protesting
        protestSpot: randomProtestSpot(),
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
      if (f.fleeing && this.threat) {
        // Run from the bear: strongly prefer tiles that lead away from it.
        const p = tileToWorld(n.x, n.y);
        const away = Math.hypot(p.x - this.threat.x, p.z - this.threat.z) - Math.hypot(f.pos.x - this.threat.x, f.pos.z - this.threat.z);
        w = away > 0 ? 10 : 0.01;
      }
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

  /** What a figure should be doing right now, according to the game state. */
  desiredMode(c, state) {
    if (state.party) return 'party';
    if (c.protesting) return 'protest';
    return 'wander';
  }

  setMode(f, mode, state) {
    f.mode = mode;
    f.path = [];
    f.inner.position.y = 0;
    f.inner.rotation.set(0, 0, 0);
    f.sign.visible = mode === 'protest';
    f.pause = Math.random() * (mode === 'wander' ? 1.5 : 0.6);

    if (mode === 'party') {
      const site = tileToWorld(state.party.x, state.party.y);
      const angle = (f.id / this.figures.length) * Math.PI * 2;
      const radius = 0.85 + (f.id % 3) * 0.22;
      f.spot = new THREE.Vector3(site.x + Math.cos(angle) * radius, 0, site.z + Math.sin(angle) * radius);
      this.routeTo(f, site, f.spot);
    } else if (mode === 'protest') {
      // Everyone gathers on the main crossroads next to the church.
      f.spot = f.protestSpot;
      this.routeTo(f, PROTEST_CENTER, f.spot);
    } else {
      f.spot = null; // planWander() walks back to the nearest road
    }
  }

  /** Walks along roads towards `center`, then straight to `spot`. */
  routeTo(f, center, spot) {
    const goal = this.nearestWalkable(center.x, center.z);
    const here = worldToTile(f.pos.x, f.pos.z);
    const start = this.walkable(here.x, here.y) ? here : this.nearestWalkable(f.pos.x, f.pos.z);
    const route = start && goal ? this.findPath(start, goal) : null;
    if (route) for (const t of route.slice(1)) f.path.push(this.tileCenter(t.x, t.y, f));
    f.path.push(spot.clone());
  }

  /** Two citizens stop and square up to each other for a few seconds (party brawl). */
  brawl(id1, id2, seconds = 4) {
    const a = this.figures[id1];
    const b = this.figures[id2];
    const mid = a.pos.clone().add(b.pos).multiplyScalar(0.5);
    for (const [f, side] of [[a, -1], [b, 1]]) {
      f.path = [mid.clone().add(new THREE.Vector3(side * 0.15, 0, 0))];
      f.brawlFor = seconds;
    }
  }

  /** Positions of figures currently dancing (for music-note effects). */
  dancers() {
    return this.figures.filter((f) => f.mode === 'party' && !f.path.length).map((f) => f.pos);
  }

  /** Ids of figures currently standing in the protest. */
  protesters() {
    return this.figures.filter((f) => f.mode === 'protest' && !f.path.length).map((f) => f.id);
  }

  /** @param threat world position citizens run away from (the bear), or null */
  update(dt, hoveredId = null, selectedId = null, threat = null) {
    this.threat = threat;
    this.time += dt;
    const state = this.game.state;
    // Deep snow from the lever slows people down a lot, ordinary winter a little.
    const weather = state.snow ? CONFIG.citizens.snowSpeedFactor : seasonOf(state.month) === 'winter' ? 0.75 : 1;
    const speed = CONFIG.citizens.walkSpeed * weather;

    const rioting = state.unrest === 'riot';
    for (const f of this.figures) {
      const c = state.citizens[f.id];
      // Within reach of the bear: drop everything and run.
      const near = threat && f.mode === 'wander' && Math.hypot(f.pos.x - threat.x, f.pos.z - threat.z) < 3;
      if (near && !f.fleeing) f.path.length = Math.min(f.path.length, 1);
      f.fleeing = !!near;
      const want = this.desiredMode(c, state);
      if (want !== f.mode) this.setMode(f, want, state);

      f.bodyMat.color.copy(MOOD_COLORS[moodOf(c, state)]);
      // Rioters flash red.
      if (rioting && f.mode === 'protest' && Math.sin(this.time * 9 + f.phase) > 0) f.bodyMat.color.copy(RIOT_COLOR);
      // Hovered and selected citizens glow a little (the selected one pulses).
      const glow = f.id === selectedId ? 0.25 + Math.sin(this.time * 6) * 0.15 : hoveredId === f.id ? 0.25 : 0;
      f.bodyMat.emissive.setRGB(glow, glow, glow);

      if (f.pause > 0) {
        f.pause -= dt;
        f.inner.position.y = 0;
      } else if (f.path.length) {
        const target = f.path[0];
        const dx = target.x - f.pos.x;
        const dz = target.z - f.pos.z;
        const dist = Math.hypot(dx, dz);
        // Partygoers and protesters hurry a bit.
        // Drunk citizens stagger slowly; frightened ones run.
        const hurry = f.fleeing ? 2.4 : c.drunk > 0 ? 0.55 : f.mode === 'wander' ? 1 : 1.6;
        const step = speed * f.speedJitter * hurry * dt;
        if (dist <= step) {
          f.pos.set(target.x, 0, target.z);
          f.path.shift();
        } else {
          f.pos.x += (dx / dist) * step;
          f.pos.z += (dz / dist) * step;
          if (c.drunk > 0) {
            // Zigzag sideways across the road.
            const sway = Math.sin(this.time * 4 + f.phase) * 0.012;
            f.pos.x += (-dz / dist) * sway;
            f.pos.z += (dx / dist) * sway;
          }
        }
        if (dist > 0.001) f.group.rotation.y = Math.atan2(dx, dz);
        // Little walking bob.
        f.inner.position.y = Math.abs(Math.sin(this.time * 10 * speed + f.phase)) * 0.025;
        f.inner.rotation.y = 0;
        f.inner.rotation.z = c.drunk > 0 ? Math.sin(this.time * 3 + f.phase) * 0.35 : 0;
      } else if (f.brawlFor > 0) {
        // Fighting: hop and lunge.
        f.brawlFor -= dt;
        f.inner.position.y = Math.abs(Math.sin(this.time * 12 + f.phase)) * 0.08;
        f.inner.rotation.z = Math.sin(this.time * 9 + f.phase) * 0.4;
      } else if (f.mode === 'party') {
        // Dance: hop and spin.
        f.inner.position.y = Math.abs(Math.sin(this.time * 7 + f.phase)) * 0.12;
        f.inner.rotation.y += dt * 4;
      } else if (f.mode === 'protest') {
        // Face the church, wave the sign; rioters jump around angrily.
        f.group.rotation.y = Math.atan2(CHURCH_POS.x - f.pos.x, CHURCH_POS.z - f.pos.z);
        const beat = this.time * (rioting ? 9 : 4) + f.phase;
        f.inner.position.y = Math.abs(Math.sin(beat)) * (rioting ? 0.1 : 0.03);
        f.inner.rotation.z = Math.sin(beat) * (rioting ? 0.25 : 0.1);
      } else {
        this.planWander(f, c);
      }
      f.group.position.copy(f.pos);
    }
  }
}
