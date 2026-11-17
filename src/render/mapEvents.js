// Live map events in 3D: animates the actor of the current event (state.mapEvent)
// along its path and provides a clickable hitbox.

import * as THREE from 'three';
import { createBear, createTractor, createWeddingGroup, createJournalist } from './models.js';
import { tileToWorld } from './coords.js';

const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

/** Point at fraction t (0..1) along a polyline of tile coordinates, in world space. */
function along(path, t, target = new THREE.Vector3()) {
  if (path.length === 1) return tileToWorld(path[0].x, path[0].y, target);
  const pts = path.map((p) => tileToWorld(p.x, p.y));
  const lengths = pts.slice(1).map((p, i) => p.distanceTo(pts[i]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      return target.copy(pts[i]).lerp(pts[i + 1], lengths[i] ? Math.min(1, d / lengths[i]) : 0);
    }
    d -= lengths[i];
  }
  return target.copy(pts[pts.length - 1]);
}

export class MapEventLayer {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.uid = null;
    this.actors = []; // meshes/groups that move
    this.hit = null;
    this.anchor = new THREE.Vector3(); // where the marker hangs
    this.time = 0;
  }

  get hitboxes() {
    return this.hit ? [this.hit] : [];
  }

  /** Current position of the bear (citizens run away from it), or null. */
  get threat() {
    return this.type === 'bear' && this.actors.length ? this.actors[0].position : null;
  }

  clear() {
    for (const a of this.actors) this.group.remove(a);
    if (this.hit) this.group.remove(this.hit);
    this.actors = [];
    this.hit = null;
    this.uid = null;
    this.type = null;
  }

  build(ev) {
    this.clear();
    this.uid = ev.uid;
    this.type = ev.type;
    let hitSize = [0.9, 0.7, 0.9];
    switch (ev.type) {
      case 'bear':
        this.actors = [createBear()];
        this.actors[0].scale.setScalar(1.4); // big enough to be scary (and easy to click)
        break;
      case 'tractor':
        this.actors = [createTractor()];
        this.actors[0].scale.setScalar(1.25);
        break;
      case 'wedding':
        this.actors = createWeddingGroup();
        hitSize = [1.2, 0.7, 1.2];
        break;
      case 'journalist':
        this.actors = [createJournalist()];
        this.actors[0].scale.setScalar(1.2);
        break;
      case 'fire':
        // The fire itself is drawn by Effects; here only the clickable house.
        hitSize = [1, 1.2, 1];
        break;
      default:
        break;
    }
    for (const a of this.actors) this.group.add(a);
    this.hit = new THREE.Mesh(new THREE.BoxGeometry(...hitSize), HIT_MAT);
    this.hit.userData.mapEvent = true;
    this.group.add(this.hit);
  }

  update(dt, state) {
    this.time += dt;
    const ev = state.mapEvent;
    if (!ev) {
      if (this.uid) this.clear();
      return;
    }
    if (ev.uid !== this.uid) this.build(ev);

    const pos = new THREE.Vector3();
    switch (ev.type) {
      case 'bear': {
        along(ev.path, ev.progress, pos);
        const ahead = along(ev.path, Math.min(1, ev.progress + 0.02));
        this.face(this.actors[0], pos, ahead);
        // Lumbering walk.
        this.actors[0].position.set(pos.x, Math.abs(Math.sin(this.time * 6)) * 0.03, pos.z);
        break;
      }
      case 'tractor': {
        along(ev.path, 0, pos);
        const t = this.actors[0];
        t.position.set(pos.x, Math.sin(this.time * 30) * 0.004, pos.z); // engine idling
        t.rotation.y = ev.tile.x === 7 || ev.tile.x === 8 ? Math.PI / 2 : 0;
        t.getObjectByName('beacon').visible = Math.sin(this.time * 8) > 0;
        break;
      }
      case 'wedding': {
        // A column walking along the road, each member a little behind the one in front.
        this.actors.forEach((m, i) => {
          const t = ev.progress - i * 0.035;
          const p = along(ev.path, t);
          const ahead = along(ev.path, Math.min(1, t + 0.02));
          const side = i === 1 ? -0.1 : i === 2 ? 0.1 : (i % 2 ? 0.12 : -0.12);
          p.x += side * 0.5;
          this.face(m, p, ahead);
          m.position.set(p.x, Math.abs(Math.sin(this.time * 8 + i)) * 0.04, p.z);
          m.visible = t >= 0;
          if (i === 0) pos.copy(p);
        });
        break;
      }
      case 'journalist': {
        // Walks the path and back, stopping now and then to take pictures.
        const t = ev.progress * 2 <= 1 ? ev.progress * 2 : 2 - ev.progress * 2;
        along(ev.path, t, pos);
        const ahead = along(ev.path, Math.min(1, t + (ev.progress * 2 <= 1 ? 0.02 : -0.02)));
        this.face(this.actors[0], pos, ahead);
        this.actors[0].position.set(pos.x, Math.abs(Math.sin(this.time * 9)) * 0.025, pos.z);
        break;
      }
      case 'fire':
        tileToWorld(ev.tile.x, ev.tile.y, pos);
        break;
      default:
        break;
    }
    this.hit.position.set(pos.x, this.hit.geometry.parameters.height / 2, pos.z);
    this.anchor.set(pos.x, ev.type === 'fire' ? 1.3 : 0.75, pos.z);
  }

  face(obj, from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (Math.abs(dx) + Math.abs(dz) > 1e-4) obj.rotation.y = Math.atan2(-dz, dx);
  }
}
