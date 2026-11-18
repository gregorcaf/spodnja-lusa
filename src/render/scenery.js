// Decoration only (no gameplay): what grows on empty meadows, the landmarks in the four
// forest corners and the hills and mountains around the map. Everything is deterministic,
// so the village looks the same after a reload.

import * as THREE from 'three';
import { material, tree, box, at, gable, cylinder, cone } from './models.js';

const SNOW = '#f2f5f8';

const S = {
  bush: material('#4a8a3c', '#e9eff2', {}, { autumn: '#9a8a3a', spring: '#5aa246' }),
  flowerA: material('#e8d34a', '#eef2f5', {}, { autumn: '#c99a3a' }),
  flowerB: material('#e46a8a', '#eef2f5', {}, { autumn: '#b5653a' }),
  flowerC: material('#f4f1ea', '#eef2f5'),
  tuft: material('#6fae4a', '#e8eef1', {}, { autumn: '#a7a24a', summer: '#7db84e' }),
  hay: material('#d9b45a', '#eef1f4', {}, { summer: '#e2bf62' }),
  pole: material('#7a5532'),
  crop: material('#7bb84a', '#eef2f5', {}, { summer: '#e0c35a', autumn: '#8a6b45', spring: '#8fca5a' }),
  soil: material('#8a6b4a', '#eef1f4'),
  apple: material('#d23b2f'),
  grape: material('#6b2f6b'),
  lily: material('#4f9a46', '#dde5ea'),
  duck: material('#f4f1ea'),
  beak: material('#e8a33a'),
  wood: material('#8b6a45'),
  woodDark: material('#5e4630'),
  roof: material('#7a3b22', SNOW),
  hill: material('#78a854', '#e6edf1', {}, { autumn: '#9fa652', summer: '#80b04f', spring: '#7fb45a' }),
  hillDark: material('#5f9246', '#dfe7ec', {}, { autumn: '#8c8f45', summer: '#6a9e45' }),
  rock: material('#8f9296', '#c9d0d6'),
  cap: material('#f4f6f8'),
  water: new THREE.MeshLambertMaterial({ color: '#5aa6d6', transparent: true, opacity: 0.85 }),
  reed: material('#6c8f3a', '#dfe6ea', {}, { autumn: '#a8904a' }),
  churchWall: material('#f6f2ea'),
  churchRoof: material('#c26a2e', SNOW),
  hive: ['#d9473a', '#3a7fd9', '#e8c23a', '#4fae5a', '#f4f1ea'].map((c) => material(c)),
};

/** Small deterministic hash of a tile, 0..1. */
export function tileHash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// --- Meadow decoration (empty grass tiles) --------------------------------------------

function flowers(r) {
  const g = new THREE.Group();
  const mats = [S.flowerA, S.flowerB, S.flowerC];
  for (let i = 0; i < 6; i++) {
    const a = r(i) * Math.PI * 2;
    const d = 0.1 + r(i + 10) * 0.3;
    g.add(box(0.04, 0.05, 0.04, mats[i % 3], Math.cos(a) * d, 0, Math.sin(a) * d));
  }
  for (let i = 0; i < 3; i++) g.add(cone(0.05, 0.08, S.tuft, 5, 0).translateX(r(i + 20) - 0.5).translateZ(r(i + 30) - 0.5));
  return g;
}

function bushes(r) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + r(i) * 0.06, 0), S.bush);
    b.position.set((r(i + 5) - 0.5) * 0.6, 0.08, (r(i + 9) - 0.5) * 0.6);
    b.castShadow = true;
    g.add(b);
  }
  return g;
}

function orchard(r) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.22, -0.2], [0.24, 0.18]]) {
    const t = tree(0.75 + r(x + 3) * 0.2, 1);
    t.position.set(x, 0, z);
    g.add(t);
    g.add(box(0.035, 0.035, 0.035, S.apple, x + 0.08, 0.2, z + 0.08));
  }
  return g;
}

/** Kopica: a haystack around a pole. */
function haystack() {
  const g = new THREE.Group();
  g.add(cone(0.16, 0.34, S.hay, 9, 0));
  g.add(box(0.02, 0.44, 0.02, S.pole));
  return g;
}

/** Njiva: a field with crop rows that change colour with the seasons. */
function field(r) {
  const g = new THREE.Group();
  const soil = box(0.86, 0.015, 0.86, S.soil);
  soil.castShadow = false;
  g.add(soil);
  for (let i = 0; i < 5; i++) {
    const row = box(0.8, 0.05, 0.08, S.crop, 0, 0.01, -0.34 + i * 0.17);
    row.castShadow = false;
    g.add(row);
  }
  g.rotation.y = r(1) < 0.5 ? 0 : Math.PI / 2;
  return g;
}

/** Kozolec: the Slovenian hayrack – posts, slats and a little gable roof. */
export function kozolec(length = 0.8) {
  const g = new THREE.Group();
  const posts = 4;
  for (let i = 0; i < posts; i++) g.add(box(0.035, 0.5, 0.035, S.woodDark, -length / 2 + (i * length) / (posts - 1), 0, 0));
  for (let k = 0; k < 4; k++) g.add(box(length, 0.02, 0.025, S.wood, 0, 0.1 + k * 0.1, 0));
  g.add(box(length * 0.92, 0.07, 0.03, S.hay, 0, 0.14, 0.02)); // hay drying between the slats
  g.add(gable(0.2, 0.1, length + 0.12, S.roof, 0.5).rotateY(Math.PI / 2));
  return g;
}

/**
 * Decoration for an empty meadow tile, or null. Tiles next to a road only get low things
 * (flowers, grass), so building spots still look free.
 */
export function meadowDecor(x, y, nearRoad) {
  const pick = tileHash(x, y);
  const r = (i) => tileHash(x, y, i + 1);
  let obj = null;
  if (nearRoad) {
    if (pick < 0.3) obj = flowers(r);
  } else if (pick < 0.16) obj = orchard(r);
  else if (pick < 0.3) obj = bushes(r);
  else if (pick < 0.4) obj = field(r);
  else if (pick < 0.47) obj = haystack();
  else if (pick < 0.51) obj = kozolec();
  else if (pick < 0.68) obj = flowers(r);
  if (obj) obj.rotation.y += Math.floor(r(7) * 4) * (Math.PI / 2);
  return obj;
}

// --- Landmarks in the four forest corners ------------------------------------------------

/** Height of a hill's surface at distance d from its centre. */
const hillY = (radius, height, d) => height * Math.sqrt(Math.max(0, 1 - (d / radius) ** 2));

function hillMesh(radius, height, mat = S.hill) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  m.scale.y = height / radius;
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}

/** A green hill with a small white church on top. */
export function hillChapel() {
  const g = new THREE.Group();
  const h = 1.1;
  g.add(hillMesh(2.6, h));
  const church = new THREE.Group();
  church.add(box(0.36, 0.3, 0.5, S.churchWall, 0, 0, 0.08));
  church.add(at(gable(0.44, 0.24, 0.56, S.churchRoof, 0.3), 0, 0.08));
  church.add(box(0.2, 0.62, 0.2, S.churchWall, 0, 0, -0.24));
  church.add(at(cone(0.17, 0.36, S.churchRoof, 4, 0.62), 0, -0.24));
  church.position.y = h - 0.03;
  church.scale.setScalar(1.25);
  church.rotation.y = Math.PI / 4;
  g.add(church);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const d = 1.5 + (i % 2) * 0.5;
    const t = tree(0.85, i);
    t.position.set(Math.cos(a) * d, hillY(2.6, h, d) - 0.04, Math.sin(a) * d);
    g.add(t);
  }
  return g;
}

/** A pond with reeds and a few stones. */
export function pond() {
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.6, 18), S.water);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.02;
  water.scale.set(1, 0.7, 1);
  g.add(water);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const ex = Math.cos(a);
    const ez = Math.sin(a);
    if (i % 4 === 0) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), S.rock);
      stone.position.set(ex * 1.68, 0.05, ez * 1.18);
      g.add(stone);
    } else if (i % 4 !== 2) {
      // A clump of reeds on the bank.
      for (let k = 0; k < 4; k++) {
        g.add(box(0.03, 0.3 + ((i + k) % 3) * 0.1, 0.03, S.reed, ex * 1.55 + (k - 1.5) * 0.06, 0, ez * 1.05 + ((k * 7) % 3) * 0.04));
      }
    }
  }
  // Lily pads and two ducks.
  for (const [x, z] of [[-0.6, 0.2], [-0.4, 0.35], [0.5, -0.3], [0.7, 0.15]]) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), S.lily);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, 0.03, z);
    g.add(pad);
  }
  for (const [x, z, r] of [[0.1, 0.1, 0.3], [0.45, 0.35, -0.9]]) {
    const duck = new THREE.Group();
    duck.add(box(0.14, 0.07, 0.08, S.duck, 0, 0.02, 0));
    duck.add(box(0.06, 0.07, 0.06, S.duck, 0.06, 0.08, 0));
    duck.add(box(0.05, 0.02, 0.03, S.beak, 0.11, 0.1, 0));
    duck.position.set(x, 0, z);
    duck.rotation.y = r;
    g.add(duck);
  }
  return g;
}

/** A sunny slope with vine rows and a klopotec on a pole. */
export function vineyardHill() {
  const g = new THREE.Group();
  const h = 0.8;
  g.add(hillMesh(2.4, h, S.hillDark));
  // Vine rows made of short pieces that follow the curve of the slope, with grapes.
  for (let r = 0; r < 5; r++) {
    const z = -0.9 + r * 0.45;
    for (let k = 0; k < 7; k++) {
      const x = -0.9 + k * 0.3;
      const y = hillY(2.4, h, Math.hypot(x, z)) - 0.03;
      g.add(box(0.3, 0.12, 0.08, S.bush, x, y, z));
      if (k % 2) g.add(box(0.04, 0.05, 0.04, S.grape, x, y + 0.02, z + 0.05));
    }
  }
  g.add(box(0.03, 0.8, 0.03, S.pole, 0.3, h - 0.05, 0)); // klopotec on the hilltop
  const blades = box(0.36, 0.03, 0.035, S.wood, 0.3, h + 0.74, 0.02);
  blades.rotation.z = 0.6;
  g.add(blades);
  return g;
}

/** A meadow with a kozolec and a čebelnjak with painted hive fronts. */
export function farmMeadow() {
  const g = new THREE.Group();
  g.add(at(kozolec(1.4), -0.6, 0.2));
  const house = new THREE.Group();
  house.add(box(0.7, 0.36, 0.34, S.wood));
  house.add(gable(0.8, 0.2, 0.42, S.roof, 0.36).rotateY(Math.PI / 2));
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) house.add(box(0.11, 0.1, 0.02, S.hive[(i + row * 2) % 5], -0.26 + i * 0.13, 0.06 + row * 0.14, 0.175));
  }
  house.position.set(0.9, 0, 0.7);
  house.rotation.y = (5 * Math.PI) / 4; // painted hive fronts towards the default camera
  g.add(house);
  for (let i = 0; i < 3; i++) g.add(at(haystack(), -1.2 + i * 0.5, -0.8));
  return g;
}

// --- Hills and mountains around the map ---------------------------------------------------

/** Soft hills in a ring around the map, and snowy mountains further away. */
export function backdrop(rng) {
  const g = new THREE.Group();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + rng() * 0.15;
    const d = 22.5 + rng() * 7;
    const radius = 2.2 + rng() * 2.2;
    const height = 0.6 + rng() * 1.1;
    const hill = new THREE.Group();
    hill.add(hillMesh(radius, height, i % 2 ? S.hill : S.hillDark));
    // A few trees on the slopes, so they read as wooded hills rather than discs.
    const trees = 3 + Math.floor(rng() * 4);
    for (let k = 0; k < trees; k++) {
      const ta = rng() * Math.PI * 2;
      const td = rng() * radius * 0.75;
      const t = tree(0.9 + rng() * 0.6, k);
      t.position.set(Math.cos(ta) * td, hillY(radius, height, td) - 0.05, Math.sin(ta) * td);
      hill.add(t);
    }
    hill.position.set(Math.cos(a) * d, -0.05, Math.sin(a) * d);
    g.add(hill);
  }
  for (let i = 0; i < 9; i++) {
    // Mountains stand to the south-east: behind the village in the default view.
    const a = Math.PI * 0.05 + (i / 8) * Math.PI * 0.9 + rng() * 0.1;
    const d = 36 + rng() * 6;
    const height = 7 + rng() * 6;
    const mountain = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(height * 0.75, height, 7), S.rock);
    body.position.y = height / 2;
    const capH = height * 0.32;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(height * 0.75 * 0.32 * 1.03, capH, 7), S.cap);
    cap.position.y = height - capH / 2 + 0.02;
    mountain.add(body, cap);
    mountain.position.set(Math.cos(a) * d, -0.1, Math.sin(a) * d);
    mountain.rotation.y = rng() * Math.PI;
    g.add(mountain);
  }
  return g;
}
