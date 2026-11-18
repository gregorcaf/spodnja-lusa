// Static scenery (forest, hills, landmarks) is made of hundreds of small meshes. Each one is
// a separate draw call, so we bake them into one mesh per material. It looks exactly the same,
// seasonal colours keep working (the materials are shared), and the GPU has far less to do.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP = ['position', 'normal', 'uv'];

/** Returns a new group with one mesh per material, holding every mesh of `root` in place. */
export function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map(); // material -> { geometries, castShadow }
  const out = new THREE.Group();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    // A mesh with one material per face (the »NA PRODAJ« board) stays as it is.
    if (Array.isArray(o.material)) {
      const copy = new THREE.Mesh(o.geometry, o.material);
      copy.applyMatrix4(o.matrixWorld);
      copy.castShadow = o.castShadow;
      out.add(copy);
      return;
    }
    let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (g.index) g = g.toNonIndexed(); // every geometry must be in the same form to merge
    for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    const b = buckets.get(o.material) || { geometries: [], castShadow: false };
    b.geometries.push(g);
    b.castShadow ||= o.castShadow;
    buckets.set(o.material, b);
  });
  for (const [mat, b] of buckets) {
    const merged = mergeGeometries(b.geometries, false);
    for (const g of b.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = b.castShadow;
    mesh.receiveShadow = true;
    out.add(mesh);
  }
  return out;
}
