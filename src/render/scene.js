// MapView: the Three.js side of the game. Reads game state, never changes it.
// Input is reported through `onHover` / `onClick` callbacks; the UI decides what to do.

import * as THREE from 'three';
import { CameraController } from './camera.js';
import { World } from './world.js';
import { CitizenLayer } from './citizens.js';
import { Preview } from './preview.js';
import { EnvyOverlay } from './overlay.js';
import { Effects } from './effects.js';
import { Labels } from './labels.js';
import { worldToTile } from './coords.js';
import { inBounds } from '../game/map.js';
import { districtStats } from '../game/stats.js';

export class MapView {
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.onHover = () => {};
    this.onClick = () => {};

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.controls = new CameraController(this.renderer.domElement);
    this.camera = this.controls.camera;
    this.addLights();

    const state = game.state;
    this.world = new World(this.scene, state);
    this.citizens = new CitizenLayer(this.scene, game);
    this.preview = new Preview(this.scene);
    this.overlay = new EnvyOverlay(this.scene);
    this.effects = new Effects(this.scene);

    const labelLayer = document.createElement('div');
    labelLayer.className = 'label-layer';
    container.appendChild(labelLayer);
    this.labels = new Labels(labelLayer, this.camera);

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.pointer = null; // { x, y, clientX, clientY } relative to the canvas
    this.hover = { tile: null, citizenId: null };
    this.selectedId = null; // citizen whose popup is open
    this.downAt = null;
    this.time = 0;

    this.bindInput();
    this.bindGame();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight('#e8f4ff', '#5d7a3e', 1.6));
    const sun = new THREE.DirectionalLight('#fff1d6', 2.4);
    sun.position.set(9, 16, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = sun.shadow.camera;
    s.left = -13;
    s.right = 13;
    s.top = 13;
    s.bottom = -13;
    s.near = 1;
    s.far = 50;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
  }

  bindInput() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', (e) => {
      const r = dom.getBoundingClientRect();
      this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top, clientX: e.clientX, clientY: e.clientY };
      this.pointerMoved = true;
    });
    dom.addEventListener('pointerleave', () => {
      this.pointer = null;
      this.setHover(null, null);
    });
    dom.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.downAt = { x: e.clientX, y: e.clientY };
    });
    dom.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !this.downAt) return;
      const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      this.downAt = null;
      if (moved > 6) return;
      this.pick();
      this.onClick({ tile: this.hover.tile, citizenId: this.hover.citizenId, clientX: e.clientX, clientY: e.clientY });
    });
  }

  bindGame() {
    const g = this.game;
    g.on('tile', ({ x, y }) => this.world.updateTile(x, y));
    g.on('snow', (on) => this.effects.setSnow(on));
    // Citizens follow the game state on their own (party, protest); only effects need events.
    g.on('party-start', (site) => this.effects.startParty(site));
    g.on('party-end', () => this.effects.endParty());
    g.on('state', () => this.refreshOverlay());
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.controls.resize(w, h);
  }

  /** Screen (client) position of a citizen's head, for UI that follows them. */
  citizenScreenPos(id) {
    const f = this.citizens.figureById(id);
    const p = this.labels.project({ x: f.pos.x, y: 0.32, z: f.pos.z });
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y, inside: p.x >= 0 && p.y >= 0 && p.x <= r.width && p.y <= r.height };
  }

  rotate(dir) {
    this.controls.rotate(dir);
  }

  setOverlay(on) {
    this.overlay.visible = on;
    this.refreshOverlay();
  }

  refreshOverlay() {
    if (!this.overlay.visible) {
      this.labels.setDistrictExtras(null);
      return;
    }
    this.overlay.update(this.game.state);
    const stats = districtStats(this.game.state);
    this.labels.setDistrictExtras(stats.map((s) => `fovšija ${Math.round(s.envy)}`));
  }

  /** Raycasts the pointer against citizens first, then the ground. */
  pick() {
    if (!this.pointer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const ndc = new THREE.Vector2((this.pointer.x / w) * 2 - 1, -(this.pointer.y / h) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);

    const hits = this.raycaster.intersectObjects(this.citizens.hitboxes, false);
    const citizenId = hits.length ? hits[0].object.userData.citizenId : null;

    const p = new THREE.Vector3();
    let tile = null;
    if (this.raycaster.ray.intersectPlane(this.groundPlane, p)) {
      const t = worldToTile(p.x, p.z);
      if (inBounds(t.x, t.y)) tile = t;
    }
    this.setHover(tile, citizenId);
  }

  setHover(tile, citizenId) {
    const prev = this.hover;
    const sameTile = (prev.tile && tile && prev.tile.x === tile.x && prev.tile.y === tile.y) || (!prev.tile && !tile);
    const changed = !sameTile || prev.citizenId !== citizenId;
    this.hover = { tile, citizenId };
    if (changed || this.pointerMoved) {
      this.pointerMoved = false;
      this.onHover({
        tile,
        citizenId,
        clientX: this.pointer?.clientX ?? 0,
        clientY: this.pointer?.clientY ?? 0,
      });
    }
  }

  update(dt) {
    // When the game is paused the world freezes (citizens, party, snow, smoke, bubbles);
    // only the camera keeps working.
    const worldDt = this.game.paused ? 0 : dt;
    this.time += worldDt;
    this.controls.update(dt);
    // Citizens move under a still mouse, so re-pick every frame.
    if (this.pointer && !this.controls.panning) this.pick();
    this.citizens.update(worldDt, this.hover.citizenId, this.selectedId);
    this.effects.update(worldDt, this.time, this.game.state.party ? this.citizens.dancers() : [], this.game.state);
    this.labels.update(worldDt, this.game.state, this.citizens);
    this.renderer.render(this.scene, this.camera);
  }
}
