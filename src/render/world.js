// Static world: ground, district tints and borders, tile objects, decorative trees,
// and the plots around the municipality (forest + a "for sale" sign until bought).

import * as THREE from 'three';
import { SIZE, CORE_SIZE, PLOT_SIZE, PLOTS, idx } from '../game/map.js';
import { createModel, material, tree, createScaffolding, createRibbon, createSaleSign, createPavement } from './models.js';
import { isWalkable, inBounds, isOwned } from '../game/map.js';
import { meadowDecor, hillChapel, pond, vineyardHill, farmMeadow, backdrop } from './scenery.js';
import { mergeByMaterial } from './merge.js';
import { tileToWorld } from './coords.js';

const DISTRICT_TINTS = ['#8cc063', '#84b85c', '#93c469', '#89b65f'];
const DISTRICT_SNOW = ['#eef3f6', '#e9eff3', '#f1f5f7', '#ebf0f4'];
const DISTRICT_AUTUMN = ['#a8b45a', '#a0ad55', '#adb862', '#a5b05b'];
const DISTRICT_SUMMER = ['#93c45c', '#8bbd55', '#9bc962', '#90bb58'];
const HAMLET_TINT = { color: '#91c468', snow: '#eef2f5', autumn: '#aab65c', summer: '#97c75e' };

const LINE = new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.08 });
const FRAME = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 });

/** World x/z of a tile corner (tile coordinates may be fractional). */
const wx = (x) => x - SIZE / 2;

export class World {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
    this.tileObjects = new Array(SIZE * SIZE).fill(null);
    this.rng = mulberry32(7);

    this.root = new THREE.Group();
    scene.add(this.root);

    this.buildGround();
    this.buildBorders();
    // Static scenery: built piece by piece, then baked into a few meshes (see merge.js).
    this.scenery = new THREE.Group();
    this.buildLandmarks();
    this.buildOuterTrees();
    this.scenery.add(backdrop(this.rng));
    this.root.add(mergeByMaterial(this.scenery));
    this.scenery = null;
    this.plotGroups = new Map(); // plot id -> { forSale, owned }
    this.refreshPlots();
    this.tilesGroup = new THREE.Group();
    this.root.add(this.tilesGroup);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) this.updateTile(x, y);
  }

  buildGround() {
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), material('#6f9e4c', '#e3eaee', {}, { autumn: '#8f9a4a', summer: '#76a64a' }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.02;
    outer.receiveShadow = true;
    this.root.add(outer);

    // One plate per original quarter, subtly tinted so the borders read without shouting.
    const q = CORE_SIZE / 2;
    for (let d = 0; d < 4; d++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(q, 0.1, q),
        material(DISTRICT_TINTS[d], DISTRICT_SNOW[d], {}, { autumn: DISTRICT_AUTUMN[d], summer: DISTRICT_SUMMER[d] }),
      );
      plate.position.set((d % 2 === 0 ? -1 : 1) * (q / 2), -0.05, (d < 2 ? -1 : 1) * (q / 2));
      plate.receiveShadow = true;
      this.root.add(plate);
    }
    this.root.add(gridLines(-CORE_SIZE / 2, -CORE_SIZE / 2, CORE_SIZE));
  }

  buildBorders() {
    // Dashed lines along the borders of the four quarters (down the middle of the main roads).
    const h = CORE_SIZE / 2;
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
    this.root.add(frame(-h, -h, CORE_SIZE));
  }

  /** One landmark in each forest corner (they can't be built on): decoration only. */
  buildLandmarks() {
    const c = (CORE_SIZE + PLOT_SIZE) / 2; // corner centres sit at ±12 in world units
    this.landmarks = [
      { obj: hillChapel(), x: -c, z: -c, clear: 3 },
      { obj: pond(), x: c, z: -c, clear: 2.4 },
      { obj: vineyardHill(), x: -c, z: c, clear: 2.8 },
      { obj: farmMeadow(), x: c, z: c, clear: 2.2 },
    ];
    for (const l of this.landmarks) {
      l.obj.position.set(l.x, 0, l.z);
      this.scenery.add(l.obj);
    }
  }

  /** Forest around the whole map and in the four outer corners (around their landmarks). */
  buildOuterTrees() {
    const edge = SIZE / 2;
    for (let i = 0; i < 260; i++) {
      const x = (this.rng() * 2 - 1) * 24;
      const z = (this.rng() * 2 - 1) * 24;
      const inMap = Math.abs(x) < edge + 0.4 && Math.abs(z) < edge + 0.4;
      const inCorner = Math.abs(x) > CORE_SIZE / 2 + 0.5 && Math.abs(z) > CORE_SIZE / 2 + 0.5 && inMap;
      if (inMap && !inCorner) continue;
      if (this.landmarks.some((l) => Math.hypot(x - l.x, z - l.z) < l.clear)) continue;
      this.scenery.add(this.placeTree(x, z, i));
    }
  }

  placeTree(x, z, i) {
    const t = tree(0.8 + this.rng() * 0.8, i);
    t.position.set(x, 0, z);
    t.rotation.y = this.rng() * Math.PI;
    return t;
  }

  /** Plots for sale: forest and a sign. Bought plots: a tinted meadow with a grid. */
  refreshPlots() {
    const owned = new Set(this.state.hamlets || []);
    for (const plot of PLOTS) {
      let g = this.plotGroups.get(plot.id);
      if (!g) {
        g = { forSale: this.buildForSale(plot), owned: null };
        this.root.add(g.forSale);
        this.plotGroups.set(plot.id, g);
      }
      const isOwned = owned.has(plot.id);
      g.forSale.visible = !isOwned;
      if (isOwned && !g.owned) {
        g.owned = this.buildOwnedPlot(plot);
        this.root.add(g.owned);
        // The new hamlet's meadows get their decoration.
        if (this.tilesGroup) {
          for (let y = plot.y; y < plot.y + PLOT_SIZE; y++) for (let x = plot.x; x < plot.x + PLOT_SIZE; x++) this.updateTile(x, y);
        }
      }
    }
  }

  buildForSale(plot) {
    const g = new THREE.Group();
    // Trees everywhere except along the future roads, so the layout is already hinted at.
    const roads = new Set(plot.roads.map(([x, y]) => `${x},${y}`));
    for (let y = plot.y; y < plot.y + PLOT_SIZE; y++) {
      for (let x = plot.x; x < plot.x + PLOT_SIZE; x++) {
        if (roads.has(`${x},${y}`) || this.rng() > 0.45) continue;
        const p = tileToWorld(x, y);
        g.add(this.placeTree(p.x + (this.rng() - 0.5) * 0.6, p.z + (this.rng() - 0.5) * 0.6, x * 31 + y));
      }
    }
    const sign = createSaleSign();
    const c = tileToWorld(plot.x + 3.5, plot.y + 3.5);
    sign.position.set(c.x, 0, c.z);
    g.add(sign);
    return mergeByMaterial(g);
  }

  buildOwnedPlot(plot) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(PLOT_SIZE, 0.1, PLOT_SIZE),
      material(HAMLET_TINT.color, HAMLET_TINT.snow, {}, { autumn: HAMLET_TINT.autumn, summer: HAMLET_TINT.summer }),
    );
    plate.position.set(wx(plot.x) + PLOT_SIZE / 2, -0.05, wx(plot.y) + PLOT_SIZE / 2);
    plate.receiveShadow = true;
    g.add(plate, gridLines(wx(plot.x), wx(plot.y), PLOT_SIZE), frame(wx(plot.x), wx(plot.y), PLOT_SIZE));
    return g;
  }

  updateTile(x, y) {
    const i = idx(x, y);
    const old = this.tileObjects[i];
    if (old) this.tilesGroup.remove(old);
    const tile = this.state.grid[i];
    let obj = createModel(tile.type, tile.variant, tile.upgrades || []);
    // A road and its pavements are baked into a couple of meshes (fewer draw calls).
    if (obj && isWalkable(tile.type)) {
      obj.add(this.pavementFor(x, y));
      if (tile.type === 'road') obj = mergeByMaterial(obj);
    }
    // Empty meadows of the municipality: fruit trees, fields, haystacks … (gone once built on).
    if (!obj && tile.type === 'grass' && isOwned(this.state, x, y)) {
      const decor = meadowDecor(x, y, this.nearRoad(x, y));
      if (decor) obj = mergeByMaterial(decor);
    }
    if (obj && tile.build) {
      // Under construction: scaffolding around it. Finished but not opened: a ribbon in front.
      const wrap = new THREE.Group();
      wrap.add(obj);
      wrap.add(tile.build.phase === 'construction' ? createScaffolding(tile.type === 'house' ? 0.7 : tile.type === 'tower' ? 1.6 : 0.85) : createRibbon());
      obj = wrap;
    }
    if (obj) {
      tileToWorld(x, y, obj.position);
      this.tilesGroup.add(obj);
    }
    this.tileObjects[i] = obj;
  }
}

/** Pavements depend on the neighbours, so a changed tile also redraws the roads around it. */
World.prototype.updateAround = function updateAround(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      // Roads redraw their pavements; meadows next to a new road keep only low decoration.
      const t = inBounds(nx, ny) && this.state.grid[idx(nx, ny)].type;
      if (t && ((dx === 0 && dy === 0) || isWalkable(t) || t === 'grass')) this.updateTile(nx, ny);
    }
  }
};

World.prototype.nearRoad = function nearRoad(x, y) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inBounds(x + dx, y + dy) && isWalkable(this.state.grid[idx(x + dx, y + dy)].type));
};

/** Strips on every side that doesn't continue as road, plus the inner corners of junctions. */
World.prototype.pavementFor = function pavementFor(x, y) {
  // Beyond the map edge the road just continues (no kerb across it).
  const road = (dx, dy) => !inBounds(x + dx, y + dy) || isWalkable(this.state.grid[idx(x + dx, y + dy)].type);
  const edges = { n: !road(0, -1), s: !road(0, 1), w: !road(-1, 0), e: !road(1, 0) };
  const corners = [];
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if (road(dx, 0) && road(0, dy) && !road(dx, dy)) corners.push({ x: dx, z: dy });
  }
  return createPavement(edges, corners);
};

/** Faint tile grid over a square area (world coordinates of its corner). */
function gridLines(x0, z0, size) {
  const pts = [];
  for (let i = 0; i <= size; i++) {
    pts.push(x0 + i, 0.003, z0, x0 + i, 0.003, z0 + size, x0, 0.003, z0 + i, x0 + size, 0.003, z0 + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, LINE);
}

function frame(x0, z0, size) {
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x0, 0.01, z0),
      new THREE.Vector3(x0 + size, 0.01, z0),
      new THREE.Vector3(x0 + size, 0.01, z0 + size),
      new THREE.Vector3(x0, 0.01, z0 + size),
    ]),
    FRAME,
  );
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
