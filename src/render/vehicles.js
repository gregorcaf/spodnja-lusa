// Traffic: cars and tractors driving on the roads, purely for show.
// Right-hand traffic: on the two-lane main roads each direction gets its own lane, on side
// streets vehicles keep a little to the right. Slow tractors hold up the cars behind them.
// During riots one car goes up in flames and the others turn back in front of it.

import * as THREE from 'three';
import { SIZE, idx, inBounds, isWalkable } from '../game/map.js';
import { population, startPopulation } from '../game/population.js';
import { seasonOf } from '../game/seasons.js';
import { createCar, createTractor, charVehicle } from './models.js';
import { tileToWorld } from './coords.js';

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const CAR_SPEED = 1.9; // tiles per second at 1×
const TRACTOR_SPEED = 0.65;
const GAP = 0.55; // closest a vehicle drives up behind another one
const LOOK_AHEAD = 0.95;
const STUCK_TURN_BACK = 3; // seconds stuck before turning around
// While people protest on the main crossroads, traffic keeps away from it.
const PROTEST_ZONE = { min: 13, max: 18 };

export class VehicleLayer {
  constructor(scene, game, effects) {
    this.game = game;
    this.effects = effects;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.vehicles = [];
    this.checkIn = 0;
    this.serial = 0;
  }

  road(x, y) {
    return inBounds(x, y) && isWalkable(this.game.state.grid[idx(x, y)].type);
  }

  /** Roads vehicles may enter right now. */
  drivable(x, y, state) {
    if (!this.road(x, y)) return false;
    if (state.unrest !== 'calm' && x >= PROTEST_ZONE.min && x <= PROTEST_ZONE.max && y >= PROTEST_ZONE.min && y <= PROTEST_ZONE.max) return false;
    return true;
  }

  /** How many vehicles fit the municipality: a few, plus more as it grows. */
  wanted(state) {
    const extra = Math.floor(Math.max(0, population(state) - startPopulation()) / 40);
    return Math.min(12, 4 + extra);
  }

  sync(state) {
    const want = this.wanted(state);
    // Drop vehicles whose road vanished, then match the wanted number.
    this.vehicles = this.vehicles.filter((v) => {
      const ok = this.road(v.tile.x, v.tile.y);
      if (!ok) this.remove(v);
      return ok;
    });
    while (this.vehicles.filter((v) => !v.burning).length > want) this.remove(this.vehicles.find((v) => !v.burning));
    let guard = 0;
    while (this.vehicles.filter((v) => !v.burning).length < want && guard++ < 20) {
      if (!this.spawn(state)) break;
    }
  }

  spawn(state) {
    const tiles = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (this.drivable(x, y, state)) tiles.push({ x, y });
    if (!tiles.length) return false;
    const start = tiles[Math.floor(Math.random() * tiles.length)];
    // About one in four is a tractor (this is a village after all).
    const tractor = this.serial % 4 === 3;
    const obj = tractor ? createTractor() : createCar(this.serial);
    if (tractor) obj.scale.setScalar(0.85);
    const v = {
      id: this.serial++,
      obj,
      tractor,
      speed: tractor ? TRACTOR_SPEED : CAR_SPEED * (0.85 + Math.random() * 0.3),
      tile: start,
      prev: null,
      dir: null,
      target: null,
      pos: tileToWorld(start.x, start.y),
      current: 0, // actual speed this frame (for followers)
      stuck: 0,
      burning: false,
    };
    obj.position.copy(v.pos);
    this.group.add(obj);
    this.vehicles.push(v);
    return true;
  }

  remove(v) {
    this.group.remove(v.obj);
    if (v.burning) this.effects.removeWorldFire(`car-${v.id}`);
    this.vehicles = this.vehicles.filter((o) => o !== v);
  }

  /** Lane position on tile `to` when driving in direction (dx, dy). */
  lanePoint(to, dx, dy) {
    const rx = -dy;
    const ry = dx;
    const rightRoad = this.road(to.x + rx, to.y + ry);
    const leftRoad = this.road(to.x - rx, to.y - ry);
    // Two-lane main road: the centre line is the edge shared with the neighbouring road tile.
    const centre = rightRoad && !leftRoad ? 0.5 : leftRoad && !rightRoad ? -0.5 : 0;
    let lane = centre + (centre ? 0.25 : 0.17);
    // Around the roundabout island, not through it.
    if (this.game.state.grid[idx(to.x, to.y)].type === 'roundabout') lane = Math.sign(lane) * Math.max(Math.abs(lane), 0.34);
    const p = tileToWorld(to.x, to.y);
    p.x += rx * lane;
    p.z += ry * lane;
    return p;
  }

  /** Picks the next tile: mostly straight on, sometimes a turn, a U-turn only at dead ends. */
  plan(v, state) {
    const options = [];
    for (const [dx, dy] of DIRS) {
      const n = { x: v.tile.x + dx, y: v.tile.y + dy };
      if (!this.drivable(n.x, n.y, state)) continue;
      const back = v.prev && n.x === v.prev.x && n.y === v.prev.y;
      const straight = v.dir && dx === v.dir[0] && dy === v.dir[1];
      options.push({ n, dx, dy, w: back ? 0.01 : straight ? 4 : 1 });
    }
    if (!options.length) return false;
    let r = Math.random() * options.reduce((s, o) => s + o.w, 0);
    let pick = options[0];
    for (const o of options) {
      r -= o.w;
      if (r <= 0) {
        pick = o;
        break;
      }
    }
    v.prev = v.tile;
    v.tile = pick.n;
    v.dir = [pick.dx, pick.dy];
    v.target = this.lanePoint(pick.n, pick.dx, pick.dy);
    return true;
  }

  /** Speed limit from the vehicle in front (0 = stop). */
  followLimit(v, desired) {
    const fx = Math.sin(v.obj.rotation.y + Math.PI / 2);
    const fz = Math.cos(v.obj.rotation.y + Math.PI / 2);
    let limit = desired;
    for (const o of this.vehicles) {
      if (o === v) continue;
      const dx = o.pos.x - v.pos.x;
      const dz = o.pos.z - v.pos.z;
      const along = dx * fx + dz * fz;
      const lateral = Math.abs(dx * fz - dz * fx);
      if (along <= 0 || along > LOOK_AHEAD || lateral > 0.17) continue;
      if (along < GAP) return 0;
      limit = Math.min(limit, o.current);
    }
    return limit;
  }

  /** Riots: one car burns where it stands; it is cleared away once things calm down. */
  syncRiot(state) {
    const rioting = state.unrest === 'riot';
    const burning = this.vehicles.find((v) => v.burning);
    if (!rioting && burning) this.remove(burning);
    if (rioting && !burning) {
      const cars = this.vehicles.filter((v) => !v.tractor);
      if (!cars.length) return;
      const v = cars[Math.floor(Math.random() * cars.length)];
      v.burning = true;
      v.current = 0;
      charVehicle(v.obj);
      this.effects.addWorldFire(`car-${v.id}`, v.pos);
    }
  }

  /** @param speedMul game speed (1×/2×/3×) */
  update(dt, speedMul = 1) {
    if (dt <= 0) return;
    const state = this.game.state;
    this.checkIn -= dt;
    if (this.checkIn <= 0) {
      this.sync(state);
      this.syncRiot(state);
      this.checkIn = 0.5;
    }
    const weather = state.snow ? 0.55 : seasonOf(state.month) === 'winter' ? 0.8 : 1;
    for (const v of this.vehicles) {
      if (v.burning) continue;
      if (!v.target && !this.plan(v, state)) continue;
      const dx = v.target.x - v.pos.x;
      const dz = v.target.z - v.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.001) v.obj.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
      const speed = this.followLimit(v, v.speed * weather * speedMul);
      v.current = speed;
      if (speed === 0) {
        // Stuck behind something that isn't moving (a burning car, a jam): turn around.
        v.stuck += dt;
        if (v.stuck > STUCK_TURN_BACK && v.prev) {
          v.stuck = 0;
          const back = v.prev;
          v.prev = v.tile;
          v.tile = back;
          v.dir = [back.x - v.prev.x, back.y - v.prev.y];
          v.target = this.lanePoint(back, v.dir[0], v.dir[1]);
        }
        continue;
      }
      v.stuck = 0;
      const step = speed * dt;
      if (dist <= step) {
        v.pos.copy(v.target);
        v.target = null;
      } else {
        v.pos.x += (dx / dist) * step;
        v.pos.z += (dz / dist) * step;
      }
      v.obj.position.copy(v.pos);
      // The tractor's beacon blinks.
      if (v.tractor) {
        const beacon = v.obj.getObjectByName('beacon');
        if (beacon) beacon.visible = Math.sin(performance.now() / 160 + v.id) > 0;
      }
    }
  }
}
