// Construction preview: translucent ghost model (green = OK, red = not possible) plus tile outline.

import * as THREE from 'three';
import { createModel } from './models.js';
import { tileToWorld } from './coords.js';

const GHOST = {
  ok: new THREE.MeshBasicMaterial({ color: '#3fd36b', transparent: true, opacity: 0.5, depthWrite: false }),
  bad: new THREE.MeshBasicMaterial({ color: '#ff3b30', transparent: true, opacity: 0.5, depthWrite: false }),
};
const OUTLINE = {
  ok: new THREE.LineBasicMaterial({ color: '#3fd36b' }),
  bad: new THREE.LineBasicMaterial({ color: '#ff3b30' }),
  neutral: new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }),
};

export class Preview {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.ghosts = new Map();

    const h = 0.5;
    this.outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-h, 0.07, -h),
        new THREE.Vector3(h, 0.07, -h),
        new THREE.Vector3(h, 0.07, h),
        new THREE.Vector3(-h, 0.07, h),
      ]),
      OUTLINE.neutral,
    );
    this.group.add(this.outline);
    this.current = null;
    this.hide();
  }

  ghostFor(tool) {
    if (!this.ghosts.has(tool)) {
      // Demolition shows a translucent "bulldozer block" over the tile.
      const model =
        tool === 'demolish'
          ? new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.5, 0.96).translate(0, 0.25, 0))
          : createModel(tool, 4);
      const meshes = [];
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = false;
          o.receiveShadow = false;
          o.renderOrder = 10;
          meshes.push(o);
        }
      });
      model.userData.meshes = meshes;
      model.visible = false;
      this.group.add(model);
      this.ghosts.set(tool, model);
    }
    return this.ghosts.get(tool);
  }

  /** tool: build tool or null (just an outline). */
  show(tool, x, y, ok) {
    const pos = tileToWorld(x, y);
    this.outline.visible = true;
    this.outline.position.copy(pos);
    this.outline.material = tool ? (ok ? OUTLINE.ok : OUTLINE.bad) : OUTLINE.neutral;

    for (const [t, g] of this.ghosts) if (t !== tool) g.visible = false;
    if (!tool) return;
    const ghost = this.ghostFor(tool);
    ghost.visible = true;
    ghost.position.copy(pos);
    const mat = ok ? GHOST.ok : GHOST.bad;
    for (const m of ghost.userData.meshes) m.material = mat;
  }

  hide() {
    this.outline.visible = false;
    for (const g of this.ghosts.values()) g.visible = false;
  }
}
