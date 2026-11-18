// Citizen figures: smooth walking on the road network, mood colours, party dancing.
// Movement is purely visual; the game state only tells us where people *want* to be.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SIZE, idx, inBounds, isWalkable, districtOf, activeDistricts } from '../game/map.js';
import { moodOf } from '../game/stats.js';
import { seasonOf } from '../game/seasons.js';
import { population, startPopulation } from '../game/population.js';

// Clothes of the anonymous residents (they have no mood colour).
const EXTRA_COLORS = ['#8a93a3', '#a38a7a', '#7a8fa3', '#9a8aa8', '#8aa39a', '#b0a27a'];
import { createFigure, PAVEMENT_WIDTH } from './models.js';
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

// Distance of the pavement's middle from the tile centre.
const SIDEWALK = 0.5 - PAVEMENT_WIDTH / 2;

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

    for (const c of game.state.citizens) this.addFigure(c);
  }

  /** A figure for a named citizen (also used when newcomers move into a hamlet). */
  addFigure(c) {
    {
      const fig = createFigure();
      fig.hit.userData.citizenId = c.id;
      const start = this.randomRoadTile(c.home) || { x: 15, y: 15 };
      const f = {
        id: c.id,
        ...fig,
        // Each citizen walks slightly off the tile centre, like on a sidewalk.
        lane: (Math.random() - 0.5) * 0.05, // a little left or right on the pavement
        side: { x: Math.random() < 0.5 ? 1 : -1, z: Math.random() < 0.5 ? 1 : -1 }, // which pavement
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
      this.sidePoint(start.x, start.y, f, f.pos);
      f.group.position.copy(f.pos);
      this.group.add(f.group);
      this.figures.push(f);
    }
  }

  get hitboxes() {
    return this.figures.map((f) => f.hit);
  }

  /**
   * Anonymous residents: more people move in, more figures walk the roads.
   * They just wander (no moods, not clickable) – the 25 named citizens stay the "voices".
   */
  syncExtras(state) {
    const p = CONFIG.population;
    const want = Math.max(0, Math.min(p.maxExtraWalkers, Math.floor((population(state) - startPopulation()) / p.extraWalkerEvery)));
    this.extras ??= [];
    while (this.extras.length > want) this.group.remove(this.extras.pop().group);
    while (this.extras.length < want) {
      const fig = createFigure();
      fig.bodyMat.color.set(EXTRA_COLORS[this.extras.length % EXTRA_COLORS.length]);
      fig.hit.visible = false;
      const homes = activeDistricts(state).map((d) => d.id);
      const home = homes[Math.floor(Math.random() * homes.length)];
      const start = this.randomRoadTile(home) || { x: 7, y: 7 };
      const f = {
        ...fig,
        citizen: { home },
        lane: (Math.random() - 0.5) * 0.05, // a little left or right on the pavement
        side: { x: Math.random() < 0.5 ? 1 : -1, z: Math.random() < 0.5 ? 1 : -1 }, // which pavement
        pos: new THREE.Vector3(),
        path: [],
        prevTile: null,
        mode: 'wander',
        pause: Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speedJitter: 0.8 + Math.random() * 0.4,
      };
      this.sidePoint(start.x, start.y, f, f.pos);
      f.group.position.copy(f.pos);
      this.group.add(f.group);
      this.extras.push(f);
    }
  }

  updateExtras(dt, state, speedMul = 1) {
    // Population changes slowly; recounting it (road network included) every frame is wasted work.
    this.extrasCheckIn = (this.extrasCheckIn ?? 0) - dt;
    if (this.extrasCheckIn <= 0 || !this.extras) {
      this.syncExtras(state);
      this.extrasCheckIn = 0.5;
    }
    const weather = state.snow ? CONFIG.citizens.snowSpeedFactor : seasonOf(state.month) === 'winter' ? 0.75 : 1;
    const speed = CONFIG.citizens.walkSpeed * weather * speedMul;
    for (const f of this.extras) {
      if (f.pause > 0) {
        f.pause -= dt;
      } else if (f.path.length) {
        const target = f.path[0];
        const dx = target.x - f.pos.x;
        const dz = target.z - f.pos.z;
        const dist = Math.hypot(dx, dz);
        const step = speed * f.speedJitter * dt;
        if (dist <= step) {
          f.pos.set(target.x, 0, target.z);
          f.path.shift();
        } else {
          f.pos.x += (dx / dist) * step;
          f.pos.z += (dz / dist) * step;
        }
        if (dist > 0.001) f.group.rotation.y = Math.atan2(dx, dz);
        f.inner.position.y = Math.abs(Math.sin(this.time * 10 * speed + f.phase)) * 0.025;
      } else {
        this.planWander(f, f.citizen);
      }
      f.group.position.copy(f.pos);
    }
  }

  figureById(id) {
    return this.figures[id];
  }

  /**
   * Waypoints for one step from tile `from` to the neighbouring tile `to`.
   * Everyone keeps to one side of the street on each axis (f.side = { x: ±1, z: ±1 }), so
   * walking straight on follows the pavement and turning happens at a pavement corner.
   * When the next tile has no pavement on the figure's side but does on the other side,
   * they first cross the road – straight across, like at a zebra crossing. At junctions
   * (no pavement on either side) they just walk on along the same line.
   */
  stepPoints(from, to, f) {
    const alongX = to.x !== from.x;
    const axis = alongX ? 'z' : 'x'; // the side that matters is across the walking direction
    const s = f.side[axis];
    const kerb = (sign) => {
      const nx = to.x + (alongX ? 0 : sign);
      const ny = to.y + (alongX ? sign : 0);
      return inBounds(nx, ny) && !this.walkable(nx, ny);
    };
    const points = [];
    if (!kerb(s) && kerb(-s)) {
      f.side[axis] = -s;
      points.push(this.sidePoint(from.x, from.y, f)); // cross over first
    }
    points.push(this.sidePoint(to.x, to.y, f));
    return points;
  }

  /** Is the figure's corner of tile `t` on a pavement (something other than road beside it)? */
  onPavement(t, f) {
    const sx = f.side.x;
    const sz = f.side.z;
    const off = (x, y) => inBounds(x, y) && !this.walkable(x, y);
    return off(t.x + sx, t.y) || off(t.x, t.y + sz) || off(t.x + sx, t.y + sz);
  }

  /** The figure's spot on the pavement of tile (x, y). */
  sidePoint(x, y, f, target = new THREE.Vector3()) {
    tileToWorld(x, y, target);
    const d = SIDEWALK + f.lane;
    target.x += f.side.x * d;
    target.z += f.side.z * d;
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
      if (t) f.path.push(this.sidePoint(t.x, t.y, f));
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
      // Stepping sideways into the other lane of the two-lane main road means crossing it in
      // the middle of the block: rare – people mostly cross at junctions.
      const sideways = !this.walkable(n.x + dx, n.y + dy) && this.walkable(n.x + dy, n.y + dx) && this.walkable(n.x - dy, n.y - dx);
      if (sideways) w *= 0.05;
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
    // Now and then people stop for a chat, so the streets look calm rather than busy –
    // but only on the pavement, never in the middle of the road (checked before any crossing).
    const canPause = this.onPavement(here, f);
    f.prevTile = here;
    f.path.push(...this.stepPoints(here, choice, f));
    if (Math.random() < 0.2 && canPause) f.pause = 1 + Math.random() * 3;
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
    if (route) for (let i = 1; i < route.length; i++) f.path.push(...this.stepPoints(route[i - 1], route[i], f));
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
  /** @param speedMul game speed (1×/2×/3×) – everyone walks faster when time runs faster */
  update(dt, hoveredId = null, selectedId = null, threat = null, speedMul = 1) {
    this.threat = threat;
    // Newcomers (hamlets) get their figures.
    for (let i = this.figures.length; i < this.game.state.citizens.length; i++) this.addFigure(this.game.state.citizens[i]);
    this.time += dt;
    const state = this.game.state;
    // Deep snow from the lever slows people down a lot, ordinary winter a little.
    const weather = state.snow ? CONFIG.citizens.snowSpeedFactor : seasonOf(state.month) === 'winter' ? 0.75 : 1;
    const speed = CONFIG.citizens.walkSpeed * weather * speedMul;

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
    this.updateExtras(dt, state, speedMul);
  }
}
