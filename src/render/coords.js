// Conversion between grid tiles and world coordinates.
// Tile (x, y) has its centre at world (x - 7.5, 0, y - 7.5); grid y maps to world z.

import * as THREE from 'three';
import { SIZE } from '../game/map.js';

const OFFSET = SIZE / 2 - 0.5;

export function tileToWorld(x, y, target = new THREE.Vector3()) {
  return target.set(x - OFFSET, 0, y - OFFSET);
}

export function worldToTile(wx, wz) {
  return { x: Math.floor(wx + SIZE / 2), y: Math.floor(wz + SIZE / 2) };
}
