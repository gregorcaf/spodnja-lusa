// The rare visitor (easter egg): walks north to south through the whole map along the
// main road's pavement, then disappears into the forest. Clickable while he's here.

import * as THREE from 'three';
import { createKrpan } from './models.js';
import { krpanProgress } from '../game/eastereggs.js';
import { SIZE } from '../game/map.js';
import { PAVEMENT_WIDTH } from './models.js';

const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
// West pavement of the north–south main road (tile column 15).
const PATH_X = 15 - (SIZE / 2 - 0.5) - (0.5 - PAVEMENT_WIDTH / 2);
const FROM_Z = -SIZE / 2 - 3;
const TO_Z = SIZE / 2 + 3;

export class KrpanLayer {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.actor = createKrpan();
    this.actor.rotation.y = -Math.PI / 2; // walking towards +z (south)
    this.hit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), HIT_MAT);
    this.hit.position.y = 0.4;
    this.group.add(this.actor, this.hit);
    this.group.visible = false;
    this.time = 0;
  }

  get hitboxes() {
    return this.group.visible ? [this.hit] : [];
  }

  /** Ground position while he's on the map, else null. */
  get position() {
    return this.group.visible ? this.actor.position : null;
  }

  update(dt, state) {
    this.group.visible = !!state.krpan;
    if (!state.krpan) return;
    this.time += dt;
    const z = FROM_Z + (TO_Z - FROM_Z) * krpanProgress(state);
    this.actor.position.set(PATH_X, Math.abs(Math.sin(this.time * 6)) * 0.02, z);
    this.hit.position.set(PATH_X, 0.4, z);
  }
}
