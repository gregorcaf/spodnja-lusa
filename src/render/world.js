// Static world: ground, district tints and borders, tile objects and decorative trees.

import * as THREE from 'three';
import { SIZE, HALF, idx } from '../game/map.js';
import { createModel, material, tree, createScaffolding, createRibbon } from './models.js';
import { tileToWorld } from './coords.js';

const DISTRICT_TINTS = ['#8cc063', '#84b85c', '#93c469', '#89b65f'];
const DISTRICT_SNOW = ['#eef3f6', '#e9eff3', '#f1f5f7', '#ebf0f4'];
const DISTRICT_AUTUMN = ['#a8b45a', '#a0ad55', '#adb862', '#a5b05b'];
const DISTRICT_SUMMER = ['#93c45c', '#8bbd55', '#9bc962', '#90bb58'];

export class World {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
    this.tileObjects = new Array(SIZE * SIZE).fill(null);

    this.root = new THREE.Group();
    scene.add(this.root);

    this.buildGround();
    this.buildBorders();
    this.buildTrees();
    this.tilesGroup = new THREE.Group();
    this.root.add(this.tilesGroup);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) this.updateTile(x, y);
  }

  buildGround() {
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), material('#6f9e4c', '#e3eaee', {}, { autumn: '#8f9a4a', summer: '#76a64a' }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.02;
    outer.receiveShadow = true;
    this.root.add(outer);

    // One plate per district, subtly tinted so the borders read without shouting.
    for (let d = 0; d < 4; d++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(HALF, 0.1, HALF),
        material(DISTRICT_TINTS[d], DISTRICT_SNOW[d], {}, { autumn: DISTRICT_AUTUMN[d], summer: DISTRICT_SUMMER[d] }),
      );
      const cx = (d % 2 === 0 ? -1 : 1) * (HALF / 2);
      const cz = (d < 2 ? -1 : 1) * (HALF / 2);
      plate.position.set(cx, -0.05, cz);
      plate.receiveShadow = true;
      this.root.add(plate);
    }

    // Faint tile grid to help placement.
    const pts = [];
    const h = SIZE / 2;
    for (let i = 0; i <= SIZE; i++) {
      const v = i - h;
      pts.push(v, 0.003, -h, v, 0.003, h, -h, 0.003, v, h, 0.003, v);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const grid = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.08 }),
    );
    this.root.add(grid);
  }

  buildBorders() {
    // Dashed lines along the district borders (they run down the middle of the main roads).
    const h = SIZE / 2;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -h),
      new THREE.Vector3(0, 0.05, h),
      new THREE.Vector3(-h, 0.05, 0),
      new THREE.Vector3(h, 0.05, 0),
    ]);
    const lines = new THREE.LineSegments(
      geo,
      new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 0.3, gapSize: 0.22, transparent: true, opacity: 0.75 }),
    );
    lines.computeLineDistances();
    this.root.add(lines);

    // Low outline around the whole municipality.
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-h, 0.01, -h),
        new THREE.Vector3(h, 0.01, -h),
        new THREE.Vector3(h, 0.01, h),
        new THREE.Vector3(-h, 0.01, h),
      ]),
      new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 }),
    );
    this.root.add(frame);
  }

  buildTrees() {
    const rng = mulberry32(7);
    const h = SIZE / 2;
    for (let i = 0; i < 90; i++) {
      const x = (rng() * 2 - 1) * 13;
      const z = (rng() * 2 - 1) * 13;
      if (Math.abs(x) < h + 0.4 && Math.abs(z) < h + 0.4) continue;
      const t = tree(0.8 + rng() * 0.8, i);
      t.position.set(x, 0, z);
      t.rotation.y = rng() * Math.PI;
      this.root.add(t);
    }
  }

  updateTile(x, y) {
    const i = idx(x, y);
    const old = this.tileObjects[i];
    if (old) this.tilesGroup.remove(old);
    const tile = this.state.grid[i];
    let obj = createModel(tile.type, tile.variant, tile.upgrades || []);
    if (obj && tile.build) {
      // Under construction: scaffolding around it. Finished but not opened: a ribbon in front.
      const wrap = new THREE.Group();
      wrap.add(obj);
      wrap.add(tile.build.phase === 'construction' ? createScaffolding(tile.type === 'house' ? 0.7 : 0.85) : createRibbon());
      obj = wrap;
    }
    if (obj) {
      tileToWorld(x, y, obj.position);
      this.tilesGroup.add(obj);
    }
    this.tileObjects[i] = obj;
  }
}

/** Small deterministic PRNG so decorative trees don't jump between reloads. */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
