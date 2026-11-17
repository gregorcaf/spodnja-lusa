// Weather and party effects: snowfall with white landscape, party lights and music notes.

import * as THREE from 'three';
import { setSnowMaterials } from './models.js';
import { tileToWorld } from './coords.js';

const SKY = new THREE.Color('#cfe4ec');
const SNOW_SKY = new THREE.Color('#dde3e8');
const FLAKES = 1800;
const AREA = 13;

export class Effects {
  constructor(scene) {
    this.scene = scene;
    scene.background = SKY.clone();
    this.buildSnow();
    this.party = null;
    this.notes = [];
    this.noteTimer = 0;
    this.noteTextures = ['♪', '♫', '♬'].map(makeGlyphTexture);
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

  setSnow(on) {
    this.snow.visible = on;
    setSnowMaterials(on);
    this.scene.background.copy(on ? SNOW_SKY : SKY);
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

  spawnNote(at) {
    const tex = this.noteTextures[Math.floor(Math.random() * this.noteTextures.length)];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.setScalar(0.28);
    sprite.position.set(at.x + (Math.random() - 0.5) * 0.2, 0.5, at.z + (Math.random() - 0.5) * 0.2);
    sprite.userData.life = 0;
    sprite.userData.drift = (Math.random() - 0.5) * 0.4;
    this.scene.add(sprite);
    this.notes.push(sprite);
  }

  update(dt, time, dancers) {
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
