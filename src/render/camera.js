// Isometric orthographic camera: wheel zoom, right-drag pan, animated 90° rotation.

import * as THREE from 'three';

const ELEVATION = Math.atan(1 / Math.SQRT2); // classic isometric angle (~35.26°)
const DISTANCE = 40;
const VIEW_HEIGHT = 16.5; // world units visible vertically at zoom 1
const PAN_LIMIT = 11;

export class CameraController {
  constructor(dom) {
    this.dom = dom;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.target = new THREE.Vector3(0, 0, 0);
    this.azimuth = Math.PI / 4;
    this.goalAzimuth = this.azimuth;
    this.camera.zoom = 1;
    this.panning = false;
    this.lastPointer = null;

    dom.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  resize(width, height) {
    const aspect = width / Math.max(1, height);
    const h = VIEW_HEIGHT / 2;
    this.camera.left = -h * aspect;
    this.camera.right = h * aspect;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
  }

  rotate(dir) {
    this.goalAzimuth += (dir * Math.PI) / 2;
  }

  onWheel(e) {
    e.preventDefault();
    const z = this.camera.zoom * Math.exp(-e.deltaY * 0.0015);
    this.camera.zoom = THREE.MathUtils.clamp(z, 0.55, 4);
    this.camera.updateProjectionMatrix();
  }

  onPointerDown(e) {
    if (e.button !== 2) return;
    this.panning = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.dom.style.cursor = 'grabbing';
  }

  onPointerMove(e) {
    if (!this.panning) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    const worldPerPixel = (this.camera.top - this.camera.bottom) / this.camera.zoom / this.dom.clientHeight;
    // Horizontal screen axis maps directly to ground; vertical is foreshortened by the elevation.
    const right = new THREE.Vector3(Math.cos(this.azimuth), 0, -Math.sin(this.azimuth));
    const forward = new THREE.Vector3(-Math.sin(this.azimuth), 0, -Math.cos(this.azimuth));
    this.target.addScaledVector(right, -dx * worldPerPixel);
    this.target.addScaledVector(forward, (dy * worldPerPixel) / Math.sin(ELEVATION));
    this.target.x = THREE.MathUtils.clamp(this.target.x, -PAN_LIMIT, PAN_LIMIT);
    this.target.z = THREE.MathUtils.clamp(this.target.z, -PAN_LIMIT, PAN_LIMIT);
  }

  onPointerUp(e) {
    if (e.button !== 2 || !this.panning) return;
    this.panning = false;
    this.dom.style.cursor = '';
  }

  update(dt) {
    // Smooth rotation toward the goal angle.
    const diff = this.goalAzimuth - this.azimuth;
    this.azimuth += Math.abs(diff) < 0.001 ? diff : diff * Math.min(1, dt * 8);

    const c = this.camera;
    const horiz = Math.cos(ELEVATION) * DISTANCE;
    c.position.set(
      this.target.x + Math.sin(this.azimuth) * horiz,
      this.target.y + Math.sin(ELEVATION) * DISTANCE,
      this.target.z + Math.cos(this.azimuth) * horiz,
    );
    c.lookAt(this.target);
    c.updateMatrixWorld();
  }
}
