// Envy map: tints each district by its citizens' average envy (green → red).

import * as THREE from 'three';
import { CORE_SIZE, PLOT_SIZE, districtCenter } from '../game/map.js';
import { districtStats } from '../game/stats.js';
import { tileToWorld } from './coords.js';

const GREEN = new THREE.Color('#2ecc40');
const YELLOW = new THREE.Color('#ffd23f');
const RED = new THREE.Color('#e5222e');

/** 0 envy → green, ~35 → yellow, 60+ → red. */
export function envyColor(envy, target = new THREE.Color()) {
  const t = THREE.MathUtils.clamp((envy - 10) / 50, 0, 1);
  return t < 0.5 ? target.copy(GREEN).lerp(YELLOW, t * 2) : target.copy(YELLOW).lerp(RED, (t - 0.5) * 2);
}

export class EnvyOverlay {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.planes = new Map(); // district id -> plane (created when the district exists)
  }

  get visible() {
    return this.group.visible;
  }

  set visible(v) {
    this.group.visible = v;
  }

  plane(id) {
    if (!this.planes.has(id)) {
      // Quarters are half the core wide, hamlets one plot.
      const size = (id < 4 ? CORE_SIZE / 2 : PLOT_SIZE) - 0.08;
      const mat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.42, depthWrite: false });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
      p.rotation.x = -Math.PI / 2;
      const c = districtCenter(id);
      tileToWorld(c.x, c.y, p.position).y = 0.09;
      p.renderOrder = 5;
      this.group.add(p);
      this.planes.set(id, p);
    }
    return this.planes.get(id);
  }

  update(state) {
    for (const s of districtStats(state)) envyColor(s.envy, this.plane(s.district.id).material.color);
  }
}
