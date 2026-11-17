// The mayor on the map: walks along roads to wherever the player clicks, and can follow a
// moving target (a citizen, the bear) until close enough to act (shake hands, cut a ribbon, ...).

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { createMayorFigure } from './models.js';
import { tileToWorld, worldToTile } from './coords.js';

const REPLAN_EVERY = 0.5; // seconds, when following something that moves

export class MayorActor {
  /** @param citizens the CitizenLayer, reused for its road pathfinding helpers */
  constructor(scene, citizens) {
    this.citizens = citizens;
    const fig = createMayorFigure();
    this.group = fig.group;
    this.inner = fig.inner;
    this.ring = fig.ring;
    scene.add(this.group);

    // Start next to the church.
    const start = citizens.nearestWalkable(-1.5, -1.5) || { x: 7, y: 7 };
    this.pos = tileToWorld(start.x, start.y).add(new THREE.Vector3(0.15, 0, 0.15));
    this.group.position.copy(this.pos);
    this.path = [];
    this.task = null; // { getTarget, onArrive, onLost, replanIn }
    this.time = 0;
    this.celebrate = 0; // seconds of a little hop after doing something

    this.hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.55, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    this.hit.userData.mayor = true;
    scene.add(this.hit);

    // Pulsing flag on the ground where he's heading.
    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 20),
      new THREE.MeshBasicMaterial({ color: '#f2c230', transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);
  }

  get hitboxes() {
    return [this.hit];
  }

  get busy() {
    return !!this.task || this.path.length > 0;
  }

  /** Walks to a fixed point (world coordinates). */
  goTo(point) {
    this.task = null;
    this.plan(point);
    this.showMarker(point);
  }

  /**
   * Walks towards something (which may move) and calls onArrive once within reach.
   * getTarget returns a world position, or null when the target is gone (then onLost is called).
   */
  approach(getTarget, onArrive, onLost = null) {
    this.task = { getTarget, onArrive, onLost, replanIn: 0 };
  }

  plan(point) {
    const c = this.citizens;
    const here = worldToTile(this.pos.x, this.pos.z);
    const start = c.walkable(here.x, here.y) ? here : c.nearestWalkable(this.pos.x, this.pos.z);
    const goal = c.nearestWalkable(point.x, point.z);
    const route = start && goal ? c.findPath(start, goal) : null;
    this.path = [];
    if (route) for (const t of route.slice(1)) this.path.push(tileToWorld(t.x, t.y));
    this.path.push(new THREE.Vector3(point.x, 0, point.z));
  }

  showMarker(point) {
    this.marker.visible = true;
    this.marker.position.set(point.x, 0.07, point.z);
  }

  /** A short happy hop (after a handshake or cutting a ribbon). */
  cheer() {
    this.celebrate = 1.2;
  }

  /** @param speedMul game speed (1×/2×/3×) – the mayor hurries along with time */
  update(dt, speedMul = 1) {
    this.time += dt;
    const reach = CONFIG.mayor.reach;

    if (this.task) {
      const target = this.task.getTarget();
      if (!target) {
        const lost = this.task.onLost;
        this.task = null;
        this.path = [];
        this.marker.visible = false;
        lost?.();
      } else if (Math.hypot(target.x - this.pos.x, target.z - this.pos.z) < reach) {
        const arrive = this.task.onArrive;
        this.task = null;
        this.path = [];
        this.marker.visible = false;
        this.face(target);
        arrive();
      } else {
        this.task.replanIn -= dt;
        if (this.task.replanIn <= 0) {
          this.plan(target);
          this.task.replanIn = REPLAN_EVERY;
        }
        this.showMarker(target);
      }
    }

    if (this.path.length) {
      const next = this.path[0];
      const dx = next.x - this.pos.x;
      const dz = next.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      const step = CONFIG.mayor.walkSpeed * speedMul * dt;
      if (dist <= step) {
        this.pos.set(next.x, 0, next.z);
        this.path.shift();
        if (!this.path.length && !this.task) this.marker.visible = false;
      } else {
        this.pos.x += (dx / dist) * step;
        this.pos.z += (dz / dist) * step;
      }
      if (dist > 0.001) this.group.rotation.y = Math.atan2(dx, dz);
      this.inner.position.y = Math.abs(Math.sin(this.time * 14)) * 0.03;
    } else if (this.celebrate > 0) {
      this.celebrate -= dt;
      this.inner.position.y = Math.abs(Math.sin(this.time * 10)) * 0.08;
    } else {
      this.inner.position.y = 0;
    }

    this.group.position.copy(this.pos);
    this.hit.position.set(this.pos.x, 0.27, this.pos.z);
    this.ring.rotation.z += dt * 1.5;
    if (this.marker.visible) this.marker.scale.setScalar(1 + Math.sin(this.time * 6) * 0.15);
  }

  face(target) {
    this.group.rotation.y = Math.atan2(target.x - this.pos.x, target.z - this.pos.z);
  }
}
