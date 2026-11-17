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

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(unitBox, mat);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y + h / 2, z);
  return shadow(mesh);
}

/** Moves an object in world-aligned x/z (unlike translateX, ignores its own rotation). */
function at(obj, x, z) {
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

function gable(w, h, len, mat, y) {
  const mesh = new THREE.Mesh(gableGeometry(w, h, len), mat);
  mesh.position.y = y;
  return shadow(mesh);
}

function cylinder(rTop, rBottom, h, mat, segments = 12, y = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
  mesh.position.y = y + h / 2;
  return shadow(mesh);
}

function cone(r, h, mat, segments = 4, y = 0) {
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
  g.add(cylinder(0.33, 0.33, 0.06, M.curb, 20));
  g.add(cylinder(0.29, 0.29, 0.09, M.island, 20));
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

const BUILDERS = { road, house, church, roundabout, firehouse, hall, inn, factory };

/** Returns a new Object3D for the given tile type, or null for grass. */
export function createModel(type, variant = 0) {
  const fn = BUILDERS[type];
  return fn ? fn(variant) : null;
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
