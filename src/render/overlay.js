// Envy map: tints each district by its citizens' average envy (green → red).

import * as THREE from 'three';
import { HALF } from '../game/map.js';
import { districtStats } from '../game/stats.js';

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
    this.planes = [];
    for (let d = 0; d < 4; d++) {
      const mat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.42, depthWrite: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(HALF - 0.08, HALF - 0.08), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set((d % 2 === 0 ? -1 : 1) * (HALF / 2), 0.09, (d < 2 ? -1 : 1) * (HALF / 2));
      plane.renderOrder = 5;
      this.group.add(plane);
      this.planes.push(plane);
    }
  }

  get visible() {
    return this.group.visible;
  }

  set visible(v) {
    this.group.visible = v;
  }

  update(state) {
    districtStats(state).forEach((s, d) => envyColor(s.envy, this.planes[d].material.color));
  }
}
