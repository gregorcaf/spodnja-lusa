// Low-poly models built from primitive geometries only (boxes, cylinders, cones, extrusions).
// Every model is centred on its tile at ground level (y = 0) and fits in a 1×1 footprint.

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Materials (shared). "Snowable" materials get a white tint while it snows.

const snowables = [];

/**
 * @param seasonal optional colours per season, e.g. { autumn: '#c2692a' } – used when it isn't snowing
 */
export function material(color, snowColor = null, extra = {}, seasonal = null) {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
  if (snowColor || seasonal) {
    const seasons = {};
    for (const [k, v] of Object.entries(seasonal || {})) seasons[k] = new THREE.Color(v);
    snowables.push({ m, normal: new THREE.Color(color), snow: snowColor ? new THREE.Color(snowColor) : null, seasons });
  }
  return m;
}

/** Colours the landscape for a season; `snowy` (winter or the snow lever) covers it in white. */
export function setLandscape(season, snowy) {
  for (const s of snowables) {
    if (snowy && s.snow) s.m.color.copy(s.snow);
    else s.m.color.copy(s.seasons[season] || s.normal);
  }
}

const SNOW = '#f2f5f8';

const M = {
  road: material('#5d6168', '#a9b2bc'),
  roadEdge: material('#7b8088', '#dfe4ea'),
  curb: material('#d6d3cc'),
  island: material('#5fa548', SNOW, {}, { autumn: '#8d9a45' }),
  statue: material('#d6a93c', null, { emissive: '#3a2a05' }),
  pedestal: material('#9b9a96'),
  door: material('#5a3d2a'),
  window: material('#9cc3d9', null, { emissive: '#1b2b36' }),
  chimney: material('#8a5a44'),
  churchWall: material('#f6f2ea'),
  churchRoof: material('#c26a2e', SNOW),
  spire: material('#5b6870', SNOW),
  gold: material('#e3b84a', null, { emissive: '#3a2a05' }),
  fireWall: material('#c8382e'),
  fireRoof: material('#45474b', SNOW),
  garage: material('#e8e2d6'),
  hallWall: material('#d9cfa6'),
  hallRoof: material('#7c8c9b', SNOW),
  trunk: material('#6b4a2b'),
  foliage: material('#3f7d3a', '#e8eef1', {}, { autumn: '#c2692a', spring: '#4f9442' }),
  foliage2: material('#4e8c3c', '#eef3f5', {}, { autumn: '#d39a2e', spring: '#62a64a' }),
  skin: material('#f0c8a2'),
  innWall: material('#e9d3a6'),
  innRoof: material('#7a3b22', SNOW),
  innSign: material('#d8a634', null, { emissive: '#3a2a05' }),
  barrel: material('#8a5a33'),
  factoryWall: material('#9aa4ad'),
  factoryRoof: material('#5b636b', SNOW),
  chimneyRed: material('#b23a2e'),
  chimneyWhite: material('#eeeeee'),
};

const WALLS = ['#f3e3c3', '#e8d5b0', '#f2efe6', '#e6c9a8', '#d9e4dd', '#f2d0c4'].map((c) => material(c));
const ROOFS = ['#b5523b', '#8f3b2b', '#a0603a', '#6e4b3b'].map((c) => material(c, SNOW));

// ---------------------------------------------------------------------------
// Geometry helpers

const unitBox = new THREE.BoxGeometry(1, 1, 1);

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(unitBox, mat);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y + h / 2, z);
  return shadow(mesh);
}

/** Moves an object in world-aligned x/z (unlike translateX, ignores its own rotation). */
export function at(obj, x, z) {
  obj.position.x += x;
  obj.position.z += z;
  return obj;
}

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const gableCache = new Map();
/** Triangular prism roof: width w (x), height h, length len (z). */
function gableGeometry(w, h, len) {
  const key = `${w}|${h}|${len}`;
  if (!gableCache.has(key)) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    gableCache.set(key, g);
  }
  return gableCache.get(key);
}

export function gable(w, h, len, mat, y) {
  const mesh = new THREE.Mesh(gableGeometry(w, h, len), mat);
  mesh.position.y = y;
  return shadow(mesh);
}

export function cylinder(rTop, rBottom, h, mat, segments = 12, y = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
  mesh.position.y = y + h / 2;
  return shadow(mesh);
}

export function cone(r, h, mat, segments = 4, y = 0) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), mat);
  mesh.position.y = y + h / 2;
  if (segments === 4) mesh.rotation.y = Math.PI / 4;
  return shadow(mesh);
}

// ---------------------------------------------------------------------------
// Models

function road() {
  const g = new THREE.Group();
  const base = box(1, 0.04, 1, M.road);
  base.castShadow = false;
  g.add(base);
  return g;
}

const PAVEMENT = material('#c9c4b8', '#eef1f4');
export const PAVEMENT_WIDTH = 0.22;

/**
 * Pavement strips along the edges of a road tile that border something other than road.
 * edges: { n, s, w, e } booleans; corners: inner corners [{ x: ±1, z: ±1 }] where two roads meet.
 */
export function createPavement(edges, corners) {
  const g = new THREE.Group();
  const w = PAVEMENT_WIDTH;
  const h = 0.06;
  const off = 0.5 - w / 2;
  const strip = (sx, sz, x, z) => {
    const m = box(sx, h, sz, PAVEMENT, x, 0, z);
    m.castShadow = false;
    g.add(m);
  };
  if (edges.n) strip(1, w, 0, -off);
  if (edges.s) strip(1, w, 0, off);
  if (edges.w) strip(w, 1, -off, 0);
  if (edges.e) strip(w, 1, off, 0);
  for (const c of corners) strip(w, w, c.x * off, c.z * off);
  return g;
}

function house(variant) {
  const g = new THREE.Group();
  const wall = WALLS[variant % WALLS.length];
  const roof = ROOFS[Math.floor(variant / 7) % ROOFS.length];
  const w = 0.5 + (variant % 3) * 0.04;
  const h = 0.34 + (variant % 2) * 0.08;
  const d = 0.56;
  g.add(box(w, h, d, wall));
  g.add(gable(w + 0.12, 0.28, d + 0.1, roof, h));
  g.add(box(0.1, 0.18, 0.02, M.door, 0, 0, d / 2 + 0.005));
  g.add(box(0.1, 0.09, 0.02, M.window, -w / 4 - 0.02, h * 0.45, d / 2 + 0.005));
  g.add(box(0.1, 0.09, 0.02, M.window, w / 4 + 0.02, h * 0.45, d / 2 + 0.005));
  g.add(box(0.07, 0.2, 0.07, M.chimney, w * 0.25, h + 0.05, -0.1));
  g.rotation.y = (Math.floor(variant / 3) % 4) * (Math.PI / 2);
  return g;
}

function church() {
  const g = new THREE.Group();
  g.add(box(0.46, 0.42, 0.62, M.churchWall, 0, 0, 0.12));
  g.add(at(gable(0.56, 0.3, 0.68, M.churchRoof, 0.42), 0, 0.12));
  g.add(box(0.26, 0.95, 0.26, M.churchWall, 0, 0, -0.3));
  g.add(at(cone(0.22, 0.5, M.spire, 4, 0.95), 0, -0.3));
  g.add(box(0.02, 0.16, 0.02, M.gold, 0, 1.45, -0.3));
  g.add(box(0.1, 0.02, 0.02, M.gold, 0, 1.55, -0.3));
  g.add(box(0.1, 0.16, 0.02, M.door, 0, 0, 0.435));
  g.add(box(0.06, 0.1, 0.02, M.window, 0, 0.6, -0.165));
  return g;
}

function roundabout() {
  const g = road();
  // A compact island, so cars fit between it and the pavement.
  g.add(cylinder(0.26, 0.26, 0.06, M.curb, 20));
  g.add(cylinder(0.23, 0.23, 0.09, M.island, 20));
  g.add(box(0.12, 0.12, 0.12, M.pedestal, 0, 0.09, 0));
  // The statue: a proud, slightly mayor-like figure with a raised arm.
  const statue = new THREE.Group();
  statue.add(cylinder(0.035, 0.05, 0.18, M.statue, 8, 0.21));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), M.statue);
  head.position.y = 0.43;
  statue.add(shadow(head));
  const arm = box(0.02, 0.12, 0.02, M.statue, 0.05, 0.33, 0);
  arm.rotation.z = -0.5;
  statue.add(arm);
  statue.name = 'statue';
  g.add(statue);
  return g;
}

function firehouse() {
  const g = new THREE.Group();
  g.add(box(0.78, 0.4, 0.6, M.fireWall));
  g.add(box(0.84, 0.05, 0.66, M.fireRoof, 0, 0.4, 0));
  g.add(box(0.22, 0.26, 0.02, M.garage, -0.18, 0, 0.305));
  g.add(box(0.22, 0.26, 0.02, M.garage, 0.18, 0, 0.305));
  g.add(box(0.78, 0.04, 0.02, M.garage, 0, 0.32, 0.305));
  g.add(box(0.18, 0.8, 0.18, M.fireWall, 0.28, 0, -0.2));
  g.add(at(cone(0.16, 0.18, M.fireRoof, 4, 0.8), 0.28, -0.2));
  return g;
}

function hall() {
  const g = new THREE.Group();
  g.add(box(0.92, 0.38, 0.84, M.hallWall));
  const roofGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.88, 14, 1, false, 0, Math.PI);
  roofGeo.rotateX(Math.PI / 2).rotateZ(Math.PI / 2);
  const roofMesh = shadow(new THREE.Mesh(roofGeo, M.hallRoof));
  roofMesh.scale.y = 0.55;
  roofMesh.position.y = 0.38;
  g.add(roofMesh);
  for (let i = -1; i <= 1; i++) g.add(box(0.2, 0.12, 0.02, M.window, i * 0.28, 0.2, 0.425));
  g.add(box(0.16, 0.2, 0.02, M.door, 0, 0, 0.43));
  return g;
}

export function tree(scale = 1, variant = 0) {
  const g = new THREE.Group();
  g.add(cylinder(0.04, 0.05, 0.18, M.trunk, 6));
  const foliage = variant % 2 ? M.foliage : M.foliage2;
  g.add(cone(0.22, 0.42, foliage, 7, 0.14));
  g.add(cone(0.16, 0.3, foliage, 7, 0.36));
  g.scale.setScalar(scale);
  return g;
}

function inn(variant) {
  const g = new THREE.Group();
  g.add(box(0.7, 0.36, 0.5, M.innWall, 0, 0, -0.08));
  g.add(gable(0.8, 0.26, 0.6, M.innRoof, 0.36).translateZ(-0.08));
  g.add(box(0.12, 0.2, 0.02, M.door, 0, 0, 0.175));
  g.add(box(0.11, 0.09, 0.02, M.window, -0.22, 0.17, 0.175));
  g.add(box(0.11, 0.09, 0.02, M.window, 0.22, 0.17, 0.175));
  // Hanging sign with a beer mug colour, a bench and a barrel out front.
  g.add(box(0.015, 0.42, 0.015, M.trunk, 0.36, 0, 0.3));
  g.add(box(0.16, 0.1, 0.02, M.innSign, 0.3, 0.28, 0.3));
  g.add(box(0.3, 0.03, 0.08, M.trunk, -0.15, 0.08, 0.32));
  g.add(box(0.03, 0.08, 0.06, M.trunk, -0.28, 0, 0.32));
  g.add(box(0.03, 0.08, 0.06, M.trunk, -0.02, 0, 0.32));
  g.add(cylinder(0.06, 0.06, 0.13, M.barrel, 10).translateX(0.12).translateZ(0.34));
  g.rotation.y = (variant % 4) * (Math.PI / 2);
  return g;
}

/** Chimney top in model space; effects.js emits smoke here. */
export const FACTORY_CHIMNEY = new THREE.Vector3(0.3, 1.05, -0.24);

function factory() {
  const g = new THREE.Group();
  g.add(box(0.86, 0.36, 0.66, M.factoryWall, -0.04, 0, 0.04));
  // Saw-tooth roof: three slanted sheds.
  for (let i = 0; i < 3; i++) {
    const shed = gable(0.29, 0.16, 0.66, M.factoryRoof, 0.36);
    shed.position.x = -0.33 + i * 0.29;
    shed.position.z = 0.04;
    g.add(shed);
  }
  g.add(box(0.2, 0.22, 0.02, M.garage, 0.2, 0, 0.375));
  for (let i = 0; i < 3; i++) g.add(box(0.12, 0.08, 0.02, M.window, -0.32 + i * 0.17, 0.2, 0.375));
  // Tall striped chimney.
  g.add(cylinder(0.055, 0.075, 1.05, M.chimneyRed, 10).translateX(0.3).translateZ(-0.24));
  g.add(cylinder(0.058, 0.058, 0.08, M.chimneyWhite, 10, 0.75).translateX(0.3).translateZ(-0.24));
  g.add(cylinder(0.058, 0.058, 0.08, M.chimneyWhite, 10, 0.95).translateX(0.3).translateZ(-0.24));
  return g;
}

const FLATS_WALL = material('#d9d3c4');
const FLATS_ROOF = material('#6d7178', SNOW);
const BALCONY = material('#b8b2a2');

/** Block of flats: five storeys, a grid of windows, balconies and an entrance. */
function flats(variant) {
  const g = new THREE.Group();
  const w = 0.82;
  const d = 0.6;
  const h = 1.15;
  g.add(box(w, h, d, FLATS_WALL));
  g.add(box(w + 0.04, 0.05, d + 0.04, FLATS_ROOF, 0, h, 0));
  for (let floor = 0; floor < 5; floor++) {
    const y = 0.12 + floor * 0.2;
    for (let col = 0; col < 4; col++) {
      const x = -0.3 + col * 0.2;
      g.add(box(0.1, 0.09, 0.02, M.window, x, y, d / 2 + 0.005));
      if (floor > 0 && col % 2 === 0) g.add(box(0.16, 0.025, 0.07, BALCONY, x + 0.1, y - 0.03, d / 2 + 0.035));
    }
  }
  g.add(box(0.14, 0.12, 0.02, M.door, 0, 0, d / 2 + 0.006));
  g.rotation.y = (variant % 2) * Math.PI; // facing the street one way or the other
  return g;
}

// --- Public buildings --------------------------------------------------------

const PUB = {
  clinicWall: material('#f4f6f5'),
  clinicRoof: material('#9aa7a3', SNOW),
  cross: material('#d6322b', null, { emissive: '#3a0705' }),
  policeWall: material('#dfe5ec'),
  policeBlue: material('#2c5aa0'),
  policeRoof: material('#4b5560', SNOW),
  siren: new THREE.MeshBasicMaterial({ color: '#3d8bff' }),
  shopWall: material('#f1e4c8'),
  awningRed: material('#d4453a'),
  awningWhite: material('#fbf7ee'),
  crate: material('#b9874f'),
  apple: material('#cf3b2f'),
  vine: material('#4f8f3a', '#e7edf0', {}, { autumn: '#c0782f', spring: '#79b94e' }),
  grape: material('#6b2f6b'),
  post: material('#8b6a45'),
  soil: material('#8a6b4a', '#e8edf0', {}, { summer: '#8f6e48' }),
  stone: material('#b9b6ae', '#eef1f3'),
  grave: material('#8f8d88'),
  cypress: material('#2f5a35', '#e6ecef'),
  candle: material('#e0412f', null, { emissive: '#6a1208' }),
  gravel: material('#cfc8b8', '#eef1f3'),
};

/** Zdravstveni dom: a white two-storey block with a red cross and a canopy over the entrance. */
function clinic() {
  const g = new THREE.Group();
  g.add(box(0.84, 0.56, 0.6, PUB.clinicWall, 0, 0, -0.04));
  g.add(box(0.88, 0.05, 0.64, PUB.clinicRoof, 0, 0.56, -0.04));
  for (const y of [0.12, 0.36]) {
    for (let i = 0; i < 4; i++) g.add(box(0.12, 0.1, 0.02, M.window, -0.3 + i * 0.2, y, 0.265));
  }
  g.add(box(0.06, 0.2, 0.025, PUB.cross, 0.29, 0.46, 0.27));
  g.add(box(0.2, 0.06, 0.025, PUB.cross, 0.29, 0.53, 0.27));
  // Canopy and door (over the lower middle windows).
  g.add(box(0.3, 0.03, 0.18, PUB.clinicRoof, 0, 0.26, 0.34));
  g.add(box(0.025, 0.26, 0.025, M.pedestal, -0.13, 0, 0.42));
  g.add(box(0.025, 0.26, 0.025, M.pedestal, 0.13, 0, 0.42));
  g.add(box(0.16, 0.22, 0.02, M.window, 0, 0, 0.265));
  return g;
}

/** Policijska postaja: grey-blue house with a blue band, a sign and a siren on the roof. */
function police() {
  const g = new THREE.Group();
  g.add(box(0.74, 0.42, 0.56, PUB.policeWall, 0, 0, -0.04));
  g.add(box(0.74, 0.06, 0.565, PUB.policeBlue, 0, 0.3, -0.04));
  g.add(box(0.78, 0.05, 0.6, PUB.policeRoof, 0, 0.42, -0.04));
  g.add(box(0.12, 0.2, 0.02, M.door, -0.18, 0, 0.245));
  g.add(box(0.14, 0.1, 0.02, M.window, 0.12, 0.13, 0.245));
  g.add(box(0.3, 0.08, 0.03, PUB.policeBlue, 0.1, 0.32, 0.255));
  const siren = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), PUB.siren);
  siren.position.set(0.22, 0.5, -0.1);
  siren.name = 'siren';
  g.add(siren);
  return g;
}

/** Trgovina: a small shop with a striped awning and crates of apples out front. */
function shop(variant) {
  const g = new THREE.Group();
  g.add(box(0.7, 0.34, 0.5, PUB.shopWall, 0, 0, -0.08));
  g.add(gable(0.78, 0.2, 0.58, M.innRoof, 0.34).translateZ(-0.08));
  g.add(box(0.36, 0.17, 0.02, M.window, -0.1, 0.08, 0.175));
  g.add(box(0.12, 0.22, 0.02, M.door, 0.22, 0, 0.175));
  // Striped awning: alternating slats, tilted down towards the street.
  for (let i = 0; i < 6; i++) {
    const slat = box(0.11, 0.02, 0.18, i % 2 ? PUB.awningWhite : PUB.awningRed, -0.29 + i * 0.116, 0.27, 0.25);
    slat.rotation.x = 0.35;
    g.add(slat);
  }
  for (const x of [-0.24, 0.0]) {
    g.add(box(0.14, 0.07, 0.1, PUB.crate, x, 0, 0.33));
    g.add(box(0.12, 0.025, 0.08, PUB.apple, x, 0.07, 0.33));
  }
  g.rotation.y = (variant % 4) * (Math.PI / 2);
  return g;
}

/** Vinograd: rows of vines on posts over bare soil; leaves change colour in autumn. */
function vineyard() {
  const g = new THREE.Group();
  const soil = box(0.96, 0.02, 0.96, PUB.soil);
  soil.castShadow = false;
  g.add(soil);
  for (let r = 0; r < 4; r++) {
    const z = -0.33 + r * 0.22;
    g.add(box(0.8, 0.14, 0.07, PUB.vine, 0, 0.08, z));
    for (const x of [-0.42, 0, 0.42]) g.add(box(0.025, 0.24, 0.025, PUB.post, x, 0, z));
    for (let k = 0; k < 4; k++) g.add(box(0.035, 0.05, 0.035, PUB.grape, -0.3 + k * 0.2, 0.06, z + 0.045));
  }
  return g;
}

/** Pokopališče: a low stone wall, rows of graves with red candles and two cypresses. */
function cemetery() {
  const g = new THREE.Group();
  const ground = box(0.94, 0.015, 0.94, PUB.gravel);
  ground.castShadow = false;
  g.add(ground);
  // Wall with a gap for the gate at the front.
  g.add(box(0.94, 0.1, 0.04, PUB.stone, 0, 0, -0.45));
  g.add(box(0.04, 0.1, 0.94, PUB.stone, -0.45, 0, 0));
  g.add(box(0.04, 0.1, 0.94, PUB.stone, 0.45, 0, 0));
  g.add(box(0.33, 0.1, 0.04, PUB.stone, -0.3, 0, 0.45));
  g.add(box(0.33, 0.1, 0.04, PUB.stone, 0.3, 0, 0.45));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -0.24 + col * 0.24;
      const z = -0.28 + row * 0.24;
      g.add(box(0.1, 0.13, 0.03, PUB.grave, x, 0, z));
      g.add(box(0.1, 0.02, 0.12, PUB.grave, x, 0, z + 0.07));
      g.add(box(0.025, 0.035, 0.025, PUB.candle, x + 0.03, 0.02, z + 0.1));
    }
  }
  for (const x of [-0.36, 0.36]) g.add(at(cone(0.07, 0.42, PUB.cypress, 7, 0.02), x, 0.36));
  return g;
}

const BUILDERS = { road, house, church, roundabout, firehouse, hall, inn, factory, flats, clinic, police, shop, vineyard, cemetery };

/** Returns a new Object3D for the given tile type, or null for grass. */
/** Returns a new Object3D for the given tile type (with its upgrades), or null for grass. */
export function createModel(type, variant = 0, upgrades = []) {
  const fn = BUILDERS[type];
  if (!fn) return null;
  const model = fn(variant);
  if (upgrades.length) decorate(model, type, upgrades);
  return model;
}

// ---------------------------------------------------------------------------
// Upgrades: small visible changes on the building (see game/content/upgrades.js)

const UP = {
  facade: material('#fff6e0'),
  flowerRed: material('#e0414a'),
  flowerPink: material('#ef8fbf'),
  water: new THREE.MeshLambertMaterial({ color: '#7cc7ef', transparent: true, opacity: 0.85 }),
  fireRed: material('#d12f25'),
  tent: material('#f4f1ea'),
  banner: material('#2f8f5b'),
  metal: material('#a7adb3'),
  speaker: material('#1f1f1f'),
  beam: new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.35, depthWrite: false }),
};

function decorate(g, type, upgrades) {
  const has = (id) => upgrades.includes(id);
  switch (type) {
    case 'house':
      if (has('facade')) g.traverse((o) => o.isMesh && WALLS.includes(o.material) && (o.material = UP.facade));
      if (has('flowers')) {
        g.add(box(0.12, 0.04, 0.05, UP.flowerRed, -0.15, 0.1, 0.3));
        g.add(box(0.12, 0.04, 0.05, UP.flowerPink, 0.15, 0.1, 0.3));
      }
      break;
    case 'roundabout':
      if (has('statue')) g.getObjectByName('statue').scale.setScalar(1.8);
      if (has('fountain')) {
        g.add(cylinder(0.22, 0.22, 0.1, UP.water, 20, 0.02));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const jet = cylinder(0.01, 0.015, 0.16, UP.water, 5, 0.1);
          jet.position.x = Math.cos(a) * 0.16;
          jet.position.z = Math.sin(a) * 0.16;
          g.add(jet);
        }
      }
      break;
    case 'firehouse':
      if (has('tanker')) {
        g.add(box(0.3, 0.14, 0.14, UP.fireRed, -0.2, 0, 0.42));
        g.add(box(0.2, 0.06, 0.1, UP.metal, -0.24, 0.14, 0.42));
      }
      if (has('tent')) g.add(at(cone(0.3, 0.3, UP.tent, 4, 0), -0.35, -0.35));
      break;
    case 'hall':
      if (has('gym')) {
        g.add(box(0.02, 0.4, 0.02, UP.metal, 0.38, 0, 0.47));
        g.add(box(0.16, 0.1, 0.01, UP.banner, 0.3, 0.3, 0.47));
      }
      if (has('aircon')) g.add(box(0.14, 0.08, 0.1, UP.metal, -0.25, 0.55, 0.1));
      break;
    case 'inn':
      if (has('linden')) g.add(at(tree(1.5, 0), -0.32, -0.34));
      if (has('band')) {
        g.add(box(0.07, 0.12, 0.07, UP.speaker, 0.3, 0, 0.42));
        g.add(box(0.07, 0.12, 0.07, UP.speaker, -0.3, 0, 0.42));
      }
      break;
    case 'factory':
      if (has('filter')) g.add(at(cylinder(0.08, 0.08, 0.1, UP.metal, 10, 1.03), 0.3, -0.24));
      if (has('line')) g.add(box(0.3, 0.26, 0.32, M.factoryWall, -0.3, 0, -0.36));
      break;
    case 'flats':
      if (has('elevator')) g.add(box(0.14, 1.3, 0.14, UP.metal, -0.36, 0, -0.2));
      if (has('playground')) {
        g.add(box(0.03, 0.18, 0.03, UP.fireRed, 0.25, 0, 0.45));
        g.add(box(0.03, 0.18, 0.03, UP.fireRed, 0.45, 0, 0.45));
        g.add(box(0.24, 0.02, 0.02, UP.fireRed, 0.35, 0.18, 0.45));
        g.add(box(0.1, 0.06, 0.18, UP.flowerPink, -0.3, 0, 0.42));
      }
      break;
    case 'clinic':
      if (has('ambulance')) {
        g.add(box(0.3, 0.15, 0.15, PUB.clinicWall, -0.28, 0, 0.42));
        g.add(box(0.3, 0.03, 0.155, PUB.cross, -0.28, 0.07, 0.42));
      }
      if (has('pharmacy')) {
        g.add(box(0.025, 0.3, 0.025, M.pedestal, 0.42, 0, 0.42));
        g.add(box(0.12, 0.04, 0.02, UP.banner, 0.42, 0.3, 0.42));
        g.add(box(0.04, 0.12, 0.02, UP.banner, 0.42, 0.26, 0.42));
      }
      break;
    case 'police':
      if (has('radar')) {
        g.add(box(0.025, 0.32, 0.025, UP.metal, 0.42, 0, 0.42));
        g.add(box(0.1, 0.08, 0.07, UP.speaker, 0.42, 0.3, 0.42));
      }
      if (has('patrol')) {
        g.add(box(0.28, 0.08, 0.15, PUB.policeWall, -0.26, 0.03, 0.42));
        g.add(box(0.16, 0.07, 0.14, PUB.policeBlue, -0.28, 0.11, 0.42));
      }
      break;
    case 'shop':
      if (has('bakery')) g.add(box(0.07, 0.16, 0.07, M.chimney, 0.2, 0.45, -0.2));
      if (has('parking')) {
        const lot = box(0.5, 0.012, 0.22, M.road, 0, 0, 0.36);
        lot.castShadow = false;
        g.add(lot);
      }
      break;
    case 'vineyard':
      if (has('cellar')) {
        g.add(box(0.26, 0.18, 0.2, WALLS[0], 0.32, 0, 0.34));
        g.add(at(gable(0.3, 0.12, 0.24, ROOFS[0], 0.18), 0.32, 0.34));
      }
      if (has('klopotec')) {
        // Klopotec, the Slovenian wind rattle: a tall pole with a wooden propeller.
        g.add(box(0.025, 0.6, 0.025, PUB.post, -0.38, 0, 0.4));
        const blades = box(0.3, 0.025, 0.03, PUB.post, -0.38, 0.6, 0.42);
        blades.rotation.z = 0.5;
        blades.name = 'klopotec';
        g.add(blades);
      }
      break;
    case 'cemetery':
      if (has('chapel')) {
        g.add(box(0.22, 0.2, 0.18, M.churchWall, 0.3, 0, -0.3));
        g.add(at(gable(0.26, 0.14, 0.22, M.churchRoof, 0.2), 0.3, -0.3));
      }
      if (has('candles')) {
        for (let i = 0; i < 8; i++) g.add(box(0.025, 0.035, 0.025, PUB.candle, -0.35 + i * 0.1, 0.02, 0.32));
      }
      break;
    case 'church':
      if (has('tower')) g.traverse((o) => o.isMesh && o.material === M.spire && (o.material = M.gold));
      if (has('lights')) {
        for (const x of [-0.3, 0.3]) {
          const b = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 10, 1, true), UP.beam);
          b.position.set(x, 0.55, 0.45);
          b.rotation.z = x > 0 ? 0.25 : -0.25;
          g.add(b);
        }
      }
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Construction site and opening ceremony

const SCAFFOLD = material('#c8a165');
const NET = new THREE.MeshLambertMaterial({ color: '#f08a24', transparent: true, opacity: 0.35, depthWrite: false });
const RIBBON = material('#d8262e', null, { emissive: '#3a0505' });

/** Wooden scaffolding with an orange safety net around the tile. */
export function createScaffolding(height = 0.7) {
  const g = new THREE.Group();
  const s = 0.45;
  for (const [x, z] of [[-s, -s], [s, -s], [-s, s], [s, s], [0, s], [0, -s]]) g.add(box(0.025, height, 0.025, SCAFFOLD, x, 0, z));
  for (const y of [height * 0.35, height * 0.7, height - 0.02]) {
    g.add(box(0.92, 0.02, 0.025, SCAFFOLD, 0, y, s));
    g.add(box(0.92, 0.02, 0.025, SCAFFOLD, 0, y, -s));
    g.add(box(0.025, 0.02, 0.92, SCAFFOLD, s, y, 0));
    g.add(box(0.025, 0.02, 0.92, SCAFFOLD, -s, y, 0));
  }
  const net = new THREE.Mesh(new THREE.BoxGeometry(0.94, height * 0.9, 0.94), NET);
  net.position.y = height * 0.45;
  g.add(net);
  return g;
}

/** Two posts with a red ribbon and a bow at the front of the tile. */
export function createRibbon() {
  const g = new THREE.Group();
  g.add(box(0.025, 0.22, 0.025, M.pedestal, -0.42, 0, 0.5));
  g.add(box(0.025, 0.22, 0.025, M.pedestal, 0.42, 0, 0.5));
  g.add(box(0.84, 0.035, 0.01, RIBBON, 0, 0.17, 0.5));
  const bow = cone(0.05, 0.08, RIBBON, 4, 0.14);
  bow.position.z = 0.5;
  bow.rotation.z = Math.PI / 2;
  g.add(bow);
  return g;
}

// ---------------------------------------------------------------------------
// The mayor: dark suit, gold chain, a little taller than everyone else

export function createMayorFigure() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.095, 0.25, 8), material('#23262d'));
  body.position.y = 0.125;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), M.skin);
  head.position.y = 0.315;
  head.castShadow = true;
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16), M.gold);
  chain.position.set(0.02, 0.22, 0);
  chain.rotation.set(Math.PI / 2.4, 0, Math.PI / 2);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.067, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), material('#5a4a3a'));
  hair.position.y = 0.32;
  inner.add(body, head, chain, hair);
  // A golden ring on the ground so you can always find him.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.2, 24),
    new THREE.MeshBasicMaterial({ color: '#f2c230', transparent: true, opacity: 0.8 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(inner, ring);
  g.scale.setScalar(1.25);
  return { group: g, inner, ring };
}

// ---------------------------------------------------------------------------
// Citizens

const bodyGeo = new THREE.CylinderGeometry(0.045, 0.085, 0.22, 8);
const headGeo = new THREE.SphereGeometry(0.058, 10, 8);
const hitGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.42, 6);
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

export function createFigure() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: '#7ccf6a', flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.11;
  body.castShadow = true;
  const head = new THREE.Mesh(headGeo, M.skin);
  head.position.y = 0.28;
  head.castShadow = true;
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.position.y = 0.2;
  const inner = new THREE.Group(); // animated part (bobbing / dancing)
  inner.add(body, head);
  const sign = createSign();
  sign.visible = false;
  inner.add(sign);
  g.add(inner, hit);
  return { group: g, inner, bodyMat, hit, sign };
}

const signStickMat = material('#7a5532');
const signBoardMats = ['#ffffff', '#fff3b0', '#ffd6d6'].map((c) => material(c));
const signStripeMat = material('#d23b2f');

/** Protest sign held above the head: a stick, a cardboard board and a red "slogan" stripe. */
function createSign() {
  const g = new THREE.Group();
  g.add(box(0.012, 0.3, 0.012, signStickMat, 0.075, 0.12, 0));
  g.add(box(0.2, 0.12, 0.012, signBoardMats[Math.floor(Math.random() * signBoardMats.length)], 0.075, 0.4, 0));
  g.add(box(0.15, 0.025, 0.014, signStripeMat, 0.075, 0.455, 0));
  g.add(box(0.1, 0.018, 0.014, signStripeMat, 0.075, 0.42, 0));
  g.traverse((o) => (o.castShadow = false));
  return g;
}

// ---------------------------------------------------------------------------
// Actors for live map events. All face +x (the direction they walk in).

const EV = {
  bear: material('#5b3a22'),
  bearDark: material('#3e2716'),
  tractor: material('#3f8f3a'),
  tractorDark: material('#2b2b2b'),
  tractorRim: material('#e0b52b'),
  beacon: new THREE.MeshBasicMaterial({ color: '#ff9a1a' }),
  dress: material('#ffffff'),
  suit: material('#222428'),
  accordion: material('#c4302b'),
  camera: material('#1c1c1c'),
  jacket: material('#2f6db5'),
  guest: ['#e4a1c4', '#8fbf6a', '#e6c24a', '#7fa8d8'].map((c) => material(c)),
};

export function createBear() {
  const g = new THREE.Group();
  g.add(box(0.48, 0.26, 0.28, EV.bear, 0, 0.1, 0));
  g.add(box(0.2, 0.2, 0.2, EV.bear, 0.3, 0.2, 0));
  g.add(box(0.08, 0.07, 0.1, EV.bearDark, 0.43, 0.24, 0)); // snout
  g.add(box(0.05, 0.06, 0.05, EV.bearDark, 0.28, 0.4, -0.07));
  g.add(box(0.05, 0.06, 0.05, EV.bearDark, 0.28, 0.4, 0.07));
  for (const [x, z] of [[0.16, 0.09], [0.16, -0.09], [-0.16, 0.09], [-0.16, -0.09]]) g.add(box(0.08, 0.12, 0.08, EV.bearDark, x, 0, z));
  return g;
}

export function createTractor() {
  const g = new THREE.Group();
  g.add(box(0.42, 0.16, 0.26, EV.tractor, 0.06, 0.1, 0));
  g.add(box(0.2, 0.26, 0.26, EV.tractor, -0.12, 0.18, 0));
  g.add(box(0.16, 0.12, 0.27, M.window, -0.12, 0.28, 0));
  g.add(box(0.03, 0.18, 0.03, EV.tractorDark, 0.18, 0.24, 0.06)); // exhaust
  const wheel = (r, x, z) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.07, 12), EV.tractorDark);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, r, z);
    w.castShadow = true;
    return w;
  };
  g.add(wheel(0.14, -0.12, 0.16), wheel(0.14, -0.12, -0.16), wheel(0.08, 0.2, 0.15), wheel(0.08, 0.2, -0.15));
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), EV.beacon);
  beacon.position.set(-0.12, 0.47, 0);
  beacon.name = 'beacon';
  g.add(beacon);
  return g;
}

const CAR_COLORS = ['#c0392b', '#2e6fb7', '#e8e4da', '#3b3f45', '#d9a521', '#4f8a4b', '#8e9aa6'].map((c) => material(c));
const TYRE = material('#232323');
const CHARRED = material('#2a2522');

/** A small car facing +x (like the event actors). */
export function createCar(variant = 0) {
  const g = new THREE.Group();
  const paint = CAR_COLORS[variant % CAR_COLORS.length];
  g.add(box(0.36, 0.09, 0.19, paint, 0, 0.04, 0));
  g.add(box(0.19, 0.08, 0.17, M.window, -0.03, 0.13, 0));
  g.add(box(0.2, 0.02, 0.18, paint, -0.03, 0.21, 0));
  for (const [x, z] of [[0.11, 0.09], [0.11, -0.09], [-0.11, 0.09], [-0.11, -0.09]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10), TYRE);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.045, z);
    g.add(w);
  }
  return g;
}

/** Turns a vehicle into a burnt-out wreck (riots). */
export function charVehicle(obj) {
  obj.traverse((o) => {
    if (o.isMesh && o.material !== TYRE) o.material = CHARRED;
  });
}

function person(bodyMat, { dress = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    dress ? new THREE.ConeGeometry(0.1, 0.24, 8) : new THREE.CylinderGeometry(0.045, 0.08, 0.22, 8),
    bodyMat,
  );
  body.position.y = dress ? 0.12 : 0.11;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M.skin);
  head.position.y = 0.28;
  head.castShadow = true;
  g.add(body, head);
  return g;
}

/** A small wedding procession: accordion player in front, then the couple, then guests. */
export function createWeddingGroup() {
  const members = [];
  const player = person(EV.suit);
  player.add(box(0.1, 0.1, 0.14, EV.accordion, 0.07, 0.1, 0));
  members.push(player, person(EV.dress, { dress: true }), person(EV.suit));
  for (const m of EV.guest) members.push(person(m));
  return members;
}

const KRPAN = {
  coat: material('#6b4a2e'),
  hat: material('#2c241d'),
  mare: material('#8a6a4a'),
  mane: material('#3b2c20'),
  sack: material('#f1eee6'),
};

/**
 * The rare visitor: a very tall, broad man in a brown coat and hat, leading a small mare
 * with two white sacks. Faces +x like the other actors.
 */
export function createKrpan() {
  const g = new THREE.Group();
  const man = person(KRPAN.coat);
  man.scale.set(1.45, 1.55, 1.45);
  const hat = cylinder(0.075, 0.075, 0.03, KRPAN.hat, 10, 0.33);
  hat.add(cylinder(0.045, 0.05, 0.06, KRPAN.hat, 10, 0.03));
  man.add(hat);
  man.position.x = 0.22;
  g.add(man);
  // The little mare behind him.
  const mare = new THREE.Group();
  mare.add(box(0.28, 0.12, 0.12, KRPAN.mare, 0, 0.12, 0));
  mare.add(box(0.08, 0.14, 0.08, KRPAN.mare, 0.15, 0.2, 0).rotateZ(-0.4));
  mare.add(box(0.1, 0.06, 0.06, KRPAN.mare, 0.21, 0.27, 0));
  mare.add(box(0.03, 0.08, 0.13, KRPAN.mane, 0.1, 0.24, 0));
  mare.add(box(0.03, 0.12, 0.03, KRPAN.mane, -0.15, 0.12, 0).rotateZ(0.5));
  for (const [x, z] of [[0.1, 0.04], [0.1, -0.04], [-0.1, 0.04], [-0.1, -0.04]]) mare.add(box(0.035, 0.12, 0.035, KRPAN.mane, x, 0, z));
  // Two sacks of "grinding stones" hanging on both sides.
  mare.add(box(0.14, 0.1, 0.06, KRPAN.sack, 0, 0.16, 0.09));
  mare.add(box(0.14, 0.1, 0.06, KRPAN.sack, 0, 0.16, -0.09));
  mare.position.x = -0.12;
  g.add(mare);
  return g;
}

export function createJournalist() {
  const g = person(EV.jacket);
  g.add(box(0.08, 0.07, 0.1, EV.camera, 0.08, 0.2, 0));
  g.add(box(0.05, 0.04, 0.04, EV.camera, 0.14, 0.22, 0));
  return g;
}

// ---------------------------------------------------------------------------
// "For sale" sign on plots around the municipality

let saleTexture = null;
function saleSignTexture() {
  if (saleTexture) return saleTexture;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fbf6e6';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 118);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NA PRODAJ', 128, 66);
  saleTexture = new THREE.CanvasTexture(c);
  saleTexture.colorSpace = THREE.SRGBColorSpace;
  return saleTexture;
}

export function createSaleSign() {
  const g = new THREE.Group();
  const wood = material('#7a5532');
  g.add(box(0.05, 0.7, 0.05, wood, -0.4, 0, 0));
  g.add(box(0.05, 0.7, 0.05, wood, 0.4, 0, 0));
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.5, 0.04),
    [wood, wood, wood, wood, new THREE.MeshLambertMaterial({ map: saleSignTexture() }), new THREE.MeshLambertMaterial({ map: saleSignTexture() })],
  );
  board.position.y = 0.72;
  board.castShadow = true;
  g.add(board);
  g.rotation.y = (5 * Math.PI) / 4; // faces the default camera
  return g;
}
