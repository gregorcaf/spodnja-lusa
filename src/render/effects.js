// Weather and party effects: snowfall with white landscape, party lights and music notes,
// plus the gatherings: holiday fireworks, the firefighting contest and the town-hall meeting.

import * as THREE from 'three';
import { setLandscape, FACTORY_CHIMNEY } from './models.js';
import { tileToWorld } from './coords.js';
import { SIZE, idx } from '../game/map.js';
import { BURNABLE } from '../game/unrest.js';

const MAX_FIRES = 2;

const SKY = new THREE.Color('#cfe4ec');
const SNOW_SKY = new THREE.Color('#dde3e8');
const SEASON_SKY = {
  spring: SKY,
  summer: new THREE.Color('#c3e2f2'),
  autumn: new THREE.Color('#d8dccb'),
  winter: SNOW_SKY,
};
const FLAKES = 1800;
const AREA = 20;

export class Effects {
  constructor(scene) {
    this.scene = scene;
    scene.background = SKY.clone();
    this.buildSnow();
    this.party = null;
    this.notes = [];
    this.noteTimer = 0;
    this.noteTextures = ['♪', '♫', '♬'].map(makeGlyphTexture);
    this.complaintTextures = ['!', '?', '€', '#'].map(makeGlyphTexture);
    this.sparkTex = makeBlobTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    this.gathering = null; // { kind, group, center, timer, age, total, win, trophy?, cloud? }
    this.sparks = []; // fireworks, confetti and water drops
    this.fires = []; // { x, y, light, timer }
    this.factorySmokeTimer = 0;
    this.particles = []; // flames and smoke
    this.flameTex = makeBlobTexture('rgba(255,220,90,1)', 'rgba(255,90,20,0)');
    this.smokeTex = makeBlobTexture('rgba(90,90,90,0.9)', 'rgba(60,60,60,0)');
  }

  /** During riots a couple of buildings are on fire (cosmetic; the real damage happens monthly). */
  syncRiot(state) {
    const rioting = state.unrest === 'riot';
    // Drop fires that are no longer valid (riot over, or the building is gone).
    this.fires = this.fires.filter((f) => {
      const ok = rioting && BURNABLE.includes(state.grid[idx(f.x, f.y)].type);
      if (!ok) this.scene.remove(f.light);
      return ok;
    });
    if (!rioting || this.fires.length >= MAX_FIRES) return;
    const candidates = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (BURNABLE.includes(state.grid[idx(x, y)].type) && !this.fires.some((f) => f.x === x && f.y === y)) {
          candidates.push({ x, y });
        }
      }
    }
    if (!candidates.length) return;
    const { x, y } = candidates[Math.floor(Math.random() * candidates.length)];
    const light = new THREE.PointLight('#ff7a2a', 2.5, 3);
    tileToWorld(x, y, light.position).y = 0.8;
    this.scene.add(light);
    this.fires.push({ x, y, light, timer: 0 });
  }

  /** A fire at a free world position (a burning car); `key` identifies it for removal. */
  addWorldFire(key, pos) {
    const light = new THREE.PointLight('#ff7a2a', 2.2, 2.5);
    light.position.set(pos.x, 0.6, pos.z);
    this.scene.add(light);
    this.worldFires ??= [];
    this.worldFires.push({ key, world: pos.clone(), light, timer: 0, x: pos.x });
  }

  removeWorldFire(key) {
    this.worldFires = (this.worldFires || []).filter((f) => {
      if (f.key === key) this.scene.remove(f.light);
      return f.key !== key;
    });
  }

  spawnParticle(fire, smoke) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: smoke ? this.smokeTex : this.flameTex,
        transparent: true,
        depthWrite: false,
        blending: smoke ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    );
    // Building fires sit on a tile and are spread wider; a car fire is small.
    const p = fire.world || tileToWorld(fire.x, fire.y);
    const spread = fire.world ? 0.25 : 0.5;
    sprite.position.set(p.x + (Math.random() - 0.5) * spread, smoke ? (fire.world ? 0.45 : 0.7) : fire.world ? 0.15 : 0.25, p.z + (Math.random() - 0.5) * spread);
    sprite.userData = { life: 0, max: smoke ? 2.6 : 0.8, smoke, grow: smoke ? 0.5 : -0.25, size: smoke ? 0.3 : 0.4 };
    sprite.scale.setScalar(sprite.userData.size);
    this.scene.add(sprite);
    this.particles.push(sprite);
  }

  buildSnow() {
    const pos = new Float32Array(FLAKES * 3);
    this.flakeSpeed = new Float32Array(FLAKES);
    for (let i = 0; i < FLAKES; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * AREA;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * AREA;
      this.flakeSpeed[i] = 0.8 + Math.random() * 0.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: '#ffffff', size: 3, sizeAttenuation: false, transparent: true, opacity: 0.9 }),
    );
    this.snow.visible = false;
    this.scene.add(this.snow);
  }

  /**
   * Season look plus the snow lever. Winter brings a white landscape and light snowfall;
   * the lever brings a proper blizzard in any season.
   */
  setWeather(season, snowLever) {
    const snowy = snowLever || season === 'winter';
    this.snow.visible = snowy;
    this.snow.geometry.setDrawRange(0, snowLever ? FLAKES : Math.floor(FLAKES / 3));
    this.snow.material.opacity = snowLever ? 0.9 : 0.6;
    setLandscape(season, snowy);
    this.scene.background.copy(snowLever ? SNOW_SKY : SEASON_SKY[season]);
  }

  startParty(site) {
    this.endParty();
    const center = tileToWorld(site.x, site.y);
    const g = new THREE.Group();
    g.position.copy(center);

    // Four poles with a ring of coloured bulbs strung between them.
    const poleMat = new THREE.MeshLambertMaterial({ color: '#6b4a2b' });
    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    const R = 1.35;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(Math.cos(a) * R, 0.4, Math.sin(a) * R);
      g.add(pole);
    }
    const colors = ['#ff4d4d', '#ffd93d', '#4dd2ff', '#7dff6b', '#ff7bd5'];
    const bulbGeo = new THREE.SphereGeometry(0.045, 8, 6);
    this.bulbs = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const bulb = new THREE.Mesh(bulbGeo, mat);
      // Slight sag between poles.
      const sag = Math.abs(Math.sin(a * 2)) * 0.12;
      bulb.position.set(Math.cos(a) * R, 0.78 - sag, Math.sin(a) * R);
      bulb.userData.base = new THREE.Color(colors[i % colors.length]);
      g.add(bulb);
      this.bulbs.push(bulb);
    }
    const light = new THREE.PointLight('#ffcf7a', 3, 5);
    light.position.y = 1;
    g.add(light);

    this.scene.add(g);
    this.party = g;
  }

  endParty() {
    if (this.party) {
      this.scene.remove(this.party);
      this.party = null;
    }
  }

  /** Holiday, firefighting contest or town-hall meeting: props on the map until it ends. */
  startGathering(g) {
    this.endGathering();
    const center = tileToWorld(g.x, g.y);
    const group = new THREE.Group();
    group.position.copy(center);
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
    const boxAt = (w, h, d, m, x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y + h / 2, z);
      b.castShadow = true;
      group.add(b);
      return b;
    };

    if (g.kind === 'holiday') {
      // Four poles with white-blue-red bunting around the square.
      const R = 1.45;
      const pole = mat('#6b4a2b');
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        boxAt(0.035, 0.85, 0.035, pole, Math.cos(a) * R, 0, Math.sin(a) * R);
      }
      const flagGeo = new THREE.ConeGeometry(0.05, 0.1, 3);
      const colors = ['#ffffff', '#2456b4', '#d8262e'].map((c) => new THREE.MeshBasicMaterial({ color: c }));
      this.flags = [];
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const flag = new THREE.Mesh(flagGeo, colors[i % 3]);
        flag.rotation.x = Math.PI;
        flag.position.set(Math.cos(a) * R, 0.8 - Math.abs(Math.sin(a * 2)) * 0.12, Math.sin(a) * R);
        group.add(flag);
        this.flags.push(flag);
      }
    } else if (g.kind === 'contest') {
      // Target board on two posts, a hose reel and two cones.
      const white = mat('#f4f1ea');
      const red = mat('#d12f25');
      boxAt(0.03, 0.5, 0.03, mat('#7a5532'), 0.95, 0, -0.2);
      boxAt(0.03, 0.5, 0.03, mat('#7a5532'), 0.95, 0, 0.2);
      this.target = boxAt(0.05, 0.3, 0.42, white, 0.95, 0.35, 0);
      boxAt(0.055, 0.12, 0.14, red, 0.95, 0.44, 0);
      for (const z of [-0.6, 0.6]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 8), mat('#ff7a1a'));
        cone.position.set(0.3, 0.07, z);
        group.add(cone);
      }
    } else {
      // Town-hall meeting: a lectern and two benches.
      const wood = mat('#8b6a45');
      boxAt(0.14, 0.26, 0.12, wood, 0, 0, 0);
      boxAt(0.18, 0.03, 0.14, wood, 0, 0.26, 0);
      for (const z of [-0.3, 0.3]) boxAt(0.5, 0.06, 0.1, wood, 0.32, 0.1, z);
    }

    this.scene.add(group);
    this.gathering = { kind: g.kind, group, center, timer: 0.5, age: 0, total: g.remaining, win: g.win };
  }

  endGathering() {
    if (!this.gathering) return;
    this.scene.remove(this.gathering.group);
    if (this.gathering.trophy) this.scene.remove(this.gathering.trophy);
    this.gathering = null;
  }

  /** A burst of coloured sparks (fireworks high up, confetti low down). */
  burst(at, count, speed, colors) {
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.sparkTex, color: colors[i % colors.length], transparent: true, depthWrite: false }));
      s.scale.setScalar(0.1);
      s.position.copy(at);
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 2 - 1;
      const v = speed * (0.6 + Math.random() * 0.4);
      s.userData = { life: 0, max: 1.4, vel: new THREE.Vector3(Math.cos(a) * v, up * v, Math.sin(a) * v), gravity: 1.2 };
      this.scene.add(s);
      this.sparks.push(s);
    }
  }

  /** One drop of the firefighters' water jet, from the hose towards the target. */
  waterDrop(from, to) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.sparkTex, color: '#7cc7ef', transparent: true, depthWrite: false }));
    s.scale.setScalar(0.07);
    s.position.copy(from);
    const t = 0.7; // flight time
    const gravity = 4.4;
    // Projectile that lands exactly on the target after t seconds.
    const vel = new THREE.Vector3((to.x - from.x) / t, (to.y - from.y + 0.5 * gravity * t * t) / t, (to.z - from.z) / t);
    s.userData = { life: 0, max: t, vel, gravity };
    this.scene.add(s);
    this.sparks.push(s);
  }

  updateGathering(dt, time, crowd) {
    const g = this.gathering;
    if (!g) return;
    g.age += dt;
    g.timer -= dt;
    const c = g.center;
    if (g.kind === 'holiday') {
      for (const [i, f] of this.flags.entries()) f.rotation.z = Math.sin(time * 4 + i) * 0.3;
      if (g.timer <= 0) {
        // Fireworks over the church.
        const at = new THREE.Vector3(c.x + (Math.random() - 0.5) * 3, 2.6 + Math.random() * 1.2, c.z + (Math.random() - 0.5) * 3);
        const palette = [['#ff4d4d', '#ffd93d'], ['#4dd2ff', '#ffffff'], ['#7dff6b', '#ff7bd5'], ['#ffffff', '#2456b4', '#d8262e']];
        this.burst(at, 26, 1.6, palette[Math.floor(Math.random() * palette.length)]);
        g.timer = 0.45 + Math.random() * 0.5;
      }
    } else if (g.kind === 'contest') {
      const decided = g.age > g.total * 0.65;
      if (!decided && g.timer <= 0) {
        // Two hoses spray at the target board.
        for (const z of [-0.15, 0.15]) {
          this.waterDrop(new THREE.Vector3(c.x - 0.1, 0.25, c.z + z * 2), new THREE.Vector3(c.x + 0.92, 0.5, c.z + z));
        }
        g.timer = 0.04;
      }
      if (decided && !g.trophy) {
        // The result: a golden cup with confetti, or a grey cloud of disappointment.
        if (g.win) {
          const gold = new THREE.MeshLambertMaterial({ color: '#e3b84a', emissive: '#3a2a05' });
          const cup = new THREE.Group();
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.07, 0.2, 12), gold);
          bowl.position.y = 0.2;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6), gold);
          stem.position.y = 0.05;
          const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.16), gold);
          cup.add(bowl, stem, base);
          cup.position.set(c.x, 1.0, c.z);
          g.trophy = cup;
          this.burst(new THREE.Vector3(c.x, 1.3, c.z), 40, 1.2, ['#ffd93d', '#ff4d4d', '#4dd2ff', '#7dff6b']);
        } else {
          const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.sparkTex, color: '#c3c8ce', transparent: true, opacity: 0.85, depthWrite: false }));
          cloud.scale.set(1.0, 0.5, 1);
          cloud.position.set(c.x, 1.6, c.z);
          g.trophy = cloud;
        }
        this.scene.add(g.trophy);
      }
      if (g.trophy) {
        if (g.win) {
          g.trophy.rotation.y += dt * 2;
          g.trophy.position.y = 1.0 + Math.min(0.6, (g.age - g.total * 0.65) * 0.5) + Math.sin(time * 3) * 0.04;
        } else {
          g.trophy.position.x = c.x + Math.sin(time * 1.5) * 0.15;
        }
      }
    } else if (crowd.length && g.timer <= 0) {
      // Complaints rise from the meeting.
      const tex = this.complaintTextures[Math.floor(Math.random() * this.complaintTextures.length)];
      this.spawnNote(crowd[Math.floor(Math.random() * crowd.length)], tex);
      g.timer = 0.35;
    }
  }

  spawnNote(at, texture = null) {
    const tex = texture || this.noteTextures[Math.floor(Math.random() * this.noteTextures.length)];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.setScalar(0.28);
    sprite.position.set(at.x + (Math.random() - 0.5) * 0.2, 0.5, at.z + (Math.random() - 0.5) * 0.2);
    sprite.userData.life = 0;
    sprite.userData.drift = (Math.random() - 0.5) * 0.4;
    this.scene.add(sprite);
    this.notes.push(sprite);
  }

  /** Factories puff grey smoke from their chimneys all the time. */
  factorySmoke(dt, state) {
    this.factorySmokeTimer -= dt;
    if (this.factorySmokeTimer > 0) return;
    this.factorySmokeTimer = 0.35;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = state.grid[idx(x, y)];
        // A chimney filter (upgrade) ends the smoke.
        if (tile.type !== 'factory' || tile.upgrades?.includes('filter')) continue;
        const p = tileToWorld(x, y).add(FACTORY_CHIMNEY);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: this.smokeTex, transparent: true, depthWrite: false }),
        );
        sprite.position.set(p.x + (Math.random() - 0.5) * 0.05, p.y, p.z + (Math.random() - 0.5) * 0.05);
        sprite.userData = { life: 0, max: 3.2, smoke: true, grow: 0.35, size: 0.18 };
        sprite.scale.setScalar(0.18);
        this.scene.add(sprite);
        this.particles.push(sprite);
      }
    }
  }

  /** The house of a fire event burns (with light, flames and smoke) until the event ends. */
  syncEventFire(state) {
    const ev = state.mapEvent;
    const want = ev && ev.type === 'fire' ? ev.tile : null;
    const have = this.eventFire;
    if (have && (!want || have.x !== want.x || have.y !== want.y)) {
      this.scene.remove(have.light);
      this.eventFire = null;
    }
    if (want && !this.eventFire) {
      const light = new THREE.PointLight('#ff7a2a', 3, 3);
      tileToWorld(want.x, want.y, light.position).y = 0.8;
      this.scene.add(light);
      this.eventFire = { x: want.x, y: want.y, light, timer: 0 };
    }
  }

  update(dt, time, dancers, state, crowd = []) {
    this.updateGathering(dt, time, crowd);
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      const u = s.userData;
      u.life += dt;
      u.vel.y -= u.gravity * dt;
      s.position.addScaledVector(u.vel, dt);
      s.material.opacity = Math.max(0, 1 - u.life / u.max);
      if (u.life > u.max) {
        this.scene.remove(s);
        s.material.dispose();
        this.sparks.splice(i, 1);
      }
    }
    this.syncRiot(state);
    this.syncEventFire(state);
    this.factorySmoke(dt, state);
    for (const f of [...this.fires, ...(this.eventFire ? [this.eventFire] : []), ...(this.worldFires || [])]) {
      f.light.intensity = 2 + Math.sin(time * 17 + f.x) * 0.6 + Math.random() * 0.5;
      f.timer -= dt;
      if (f.timer <= 0) {
        this.spawnParticle(f, false);
        if (Math.random() < 0.35) this.spawnParticle(f, true);
        f.timer = 0.05;
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const u = p.userData;
      u.life += dt;
      p.position.y += dt * (u.smoke ? 0.5 : 0.9);
      p.scale.setScalar(Math.max(0.02, u.size + u.grow * u.life));
      p.material.opacity = Math.max(0, 1 - u.life / u.max) * (u.smoke ? 0.6 : 1);
      if (u.life > u.max) {
        this.scene.remove(p);
        p.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    if (this.snow.visible) {
      const p = this.snow.geometry.attributes.position;
      for (let i = 0; i < FLAKES; i++) {
        let y = p.getY(i) - this.flakeSpeed[i] * dt;
        if (y < 0) y += 12;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(time + i) * 0.003);
      }
      p.needsUpdate = true;
    }

    if (this.party) {
      this.bulbs.forEach((b, i) => {
        const on = Math.sin(time * 6 + i * 0.9) > -0.2;
        b.material.color.copy(b.userData.base).multiplyScalar(on ? 1 : 0.25);
      });
      this.noteTimer -= dt;
      if (dancers.length && this.noteTimer <= 0) {
        this.spawnNote(dancers[Math.floor(Math.random() * dancers.length)]);
        this.noteTimer = 0.18;
      }
    }

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      n.userData.life += dt;
      n.position.y += dt * 0.6;
      n.position.x += n.userData.drift * dt;
      n.material.opacity = Math.max(0, 1 - n.userData.life / 1.6);
      if (n.userData.life > 1.6) {
        this.scene.remove(n);
        n.material.dispose();
        this.notes.splice(i, 1);
      }
    }
  }
}

function makeBlobTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlyphTexture(glyph) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(glyph, 32, 34);
  ctx.fillStyle = '#2b2350';
  ctx.fillText(glyph, 32, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
