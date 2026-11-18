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
import { MapEventLayer } from './mapEvents.js';
import { MayorActor } from './mayor.js';
import { VehicleLayer } from './vehicles.js';
import { KrpanLayer } from './krpan.js';
import { tileToWorld } from './coords.js';
import { worldToTile } from './coords.js';
import { inBounds } from '../game/map.js';
import { districtStats } from '../game/stats.js';
import { seasonOf } from '../game/seasons.js';
import { hamletPrice } from '../game/hamlets.js';
import { disconnectedBuildings } from '../game/roads.js';
import { formatEuro } from '../game/util.js';

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
    this.mapEvents = new MapEventLayer(this.scene);
    this.mayor = new MayorActor(this.scene, this.citizens);
    this.vehicles = new VehicleLayer(this.scene, game, this.effects);
    this.krpan = new KrpanLayer(this.scene);
    // Season and weather (a loaded game may also already be snowing or partying).
    this.applyWeather();
    if (state.party) this.effects.startParty(state.party);

    const labelLayer = document.createElement('div');
    labelLayer.className = 'label-layer';
    container.appendChild(labelLayer);
    this.labels = new Labels(labelLayer, this.camera);
    this.labels.syncDistricts(state, formatEuro(hamletPrice(state)));
    this.noRoad = disconnectedBuildings(state);

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
      this.onClick({
        tile: this.hover.tile,
        citizenId: this.hover.citizenId,
        mapEvent: this.hover.mapEvent,
        krpan: this.hover.krpan,
        point: this.hoverPoint,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    });
  }

  bindGame() {
    const g = this.game;
    g.on('tile', ({ x, y }) => {
      this.world.updateAround(x, y);
      this.noRoad = disconnectedBuildings(this.game.state); // roads may have appeared or vanished
    });
    g.on('snow', () => this.applyWeather());
    g.on('month', () => this.applyWeather());
    // Citizens follow the game state on their own (party, protest); only effects need events.
    g.on('party-start', (site) => this.effects.startParty(site));
    g.on('party-end', () => this.effects.endParty());
    g.on('state', () => {
      this.refreshOverlay();
      this.labels.syncDistricts(this.game.state, formatEuro(hamletPrice(this.game.state)));
    });
    // A bought plot: the forest goes, a new district with its own colours and label appears.
    g.on('hamlet', () => {
      this.world.refreshPlots();
      this.applyWeather();
    });
  }

  applyWeather() {
    const s = this.game.state;
    this.effects.setWeather(seasonOf(s.month), s.snow);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.controls.resize(w, h);
  }

  /** World positions the mayor can walk to. */
  tileWorld(x, y) {
    return tileToWorld(x, y);
  }

  /** Where the rare visitor is right now (null when he isn't around). */
  krpanWorld() {
    const p = this.krpan.position;
    return p ? new THREE.Vector3(p.x, 0, p.z) : null;
  }

  citizenWorld(id) {
    return this.citizens.figureById(id).pos;
  }

  /** Ground position of the current live event, or null when there is none. */
  eventWorld() {
    if (!this.game.state.mapEvent || !this.mapEvents.hit) return null;
    const p = this.mapEvents.hit.position;
    return new THREE.Vector3(p.x, 0, p.z);
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
    this.labels.setDistrictExtras(new Map(stats.map((s) => [s.district.id, `fovšija ${Math.round(s.envy)}`])));
  }

  /** Raycasts the pointer against citizens first, then the ground. */
  pick() {
    if (!this.pointer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const ndc = new THREE.Vector2((this.pointer.x / w) * 2 - 1, -(this.pointer.y / h) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);

    // Live events win over citizens: they're urgent and short. So does the rare visitor.
    const krpanHit = this.raycaster.intersectObjects(this.krpan.hitboxes, false).length > 0;
    const eventHit = krpanHit || this.raycaster.intersectObjects(this.mapEvents.hitboxes, false).length > 0;
    const mayorHit = !eventHit && this.raycaster.intersectObjects(this.mayor.hitboxes, false).length > 0;
    const hits = eventHit || mayorHit ? [] : this.raycaster.intersectObjects(this.citizens.hitboxes, false);
    const citizenId = hits.length ? hits[0].object.userData.citizenId : null;

    const p = new THREE.Vector3();
    let tile = null;
    this.hoverPoint = null;
    if (this.raycaster.ray.intersectPlane(this.groundPlane, p)) {
      this.hoverPoint = p.clone();
      const t = worldToTile(p.x, p.z);
      if (inBounds(t.x, t.y)) tile = t;
    }
    this.setHover(tile, citizenId, eventHit && !krpanHit, mayorHit, krpanHit);
  }

  setHover(tile, citizenId, mapEvent = false, mayor = false, krpan = false) {
    const prev = this.hover;
    const sameTile = (prev.tile && tile && prev.tile.x === tile.x && prev.tile.y === tile.y) || (!prev.tile && !tile);
    const changed = !sameTile || prev.citizenId !== citizenId || prev.mapEvent !== mapEvent || prev.mayor !== mayor || prev.krpan !== krpan;
    this.hover = { tile, citizenId, mapEvent, mayor, krpan };
    if (changed || this.pointerMoved) {
      this.pointerMoved = false;
      this.onHover({
        tile,
        citizenId,
        mapEvent,
        mayor,
        krpan,
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
    const state = this.game.state;
    this.mapEvents.update(worldDt, state);
    this.citizens.update(worldDt, this.hover.citizenId, this.selectedId, this.mapEvents.threat, Math.max(1, state.speed));
    // The mayor hurries along with the game speed, so events stay reachable at 2× and 3×.
    this.mayor.update(worldDt, Math.max(1, state.speed));
    this.vehicles.update(worldDt, Math.max(1, state.speed));
    this.krpan.update(worldDt, state);
    this.effects.update(worldDt, this.time, this.game.state.party ? this.citizens.dancers() : [], this.game.state);
    this.labels.update(worldDt, this.game.state, this.citizens);
    this.labels.updateEventMarker(state.mapEvent ? this.game.describeMapEvent() : null, this.mapEvents.anchor);
    this.labels.updateRibbonMarkers(this.game.pendingRibbons());
    this.labels.updateNoRoadMarkers(this.noRoad);
    this.labels.updateEmotes(worldDt);
    this.renderer.render(this.scene, this.camera);
  }
}
