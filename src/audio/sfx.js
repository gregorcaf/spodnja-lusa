// Sound effects and ambience, synthesised live with Web Audio (no audio files).
//
// One-shot effects: play('build' | 'demolish' | 'coin' | 'paper' | 'chime' | 'fanfare' | 'shush' |
//   'clink' | 'error' | 'bell' | 'card' | 'wish' | 'drumroll' | 'win' | 'lose' | 'fire' | 'click')
// Ambience: setAmbient('calm' | 'protest' | 'riot') – chanting crowd, and crackling fire in riots.

import { CONFIG } from '../config.js';
import { getAudioContext } from './context.js';

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class Sfx {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.ambient = 'calm';
    this.paused = false;
    this.ambientTimer = null;
  }

  /** Lazily creates the audio graph. Returns false while sound can't play. */
  ready() {
    if (!this.enabled) return false;
    if (!this.ctx) {
      const ctx = getAudioContext();
      this.ctx = ctx;
      this.out = ctx.createGain();
      this.out.gain.value = CONFIG.audio.sfxVolume;
      this.ambientOut = ctx.createGain();
      this.ambientOut.gain.value = 0;
      this.out.connect(ctx.destination);
      this.ambientOut.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 1.5);
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.out.gain.value = this.enabled ? CONFIG.audio.sfxVolume : 0;
    this.syncAmbient();
    return true;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.ctx) {
      this.out.gain.value = this.enabled ? CONFIG.audio.sfxVolume : 0;
      this.updateAmbientGain();
    }
    return this.enabled;
  }

  // --- Building blocks --------------------------------------------------------

  tone({ type = 'sine', midi, hz, t = 0, dur = 0.2, gain = 0.2, attack = 0.005, glideTo = null, dest = this.out }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + t;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz ?? freq(midi), start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp).connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  burst({ t = 0, dur = 0.1, gain = 0.3, type = 'bandpass', hz = 1000, q = 1, dest = this.out }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + t;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    filter.Q.value = q;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter).connect(amp).connect(dest);
    src.start(start, Math.random() * 1.2);
    src.stop(start + dur + 0.05);
  }

  // --- One-shot effects ---------------------------------------------------------

  play(name) {
    if (!this.ready()) return;
    const fx = EFFECTS[name];
    if (fx) fx(this);
  }

  // --- Ambience -----------------------------------------------------------------

  /** Remembers the level; the sound itself starts once audio is unlocked by a user gesture. */
  setAmbient(level) {
    this.ambient = level;
    this.syncAmbient();
  }

  syncAmbient() {
    if (!this.ctx) return;
    this.updateAmbientGain();
    if (this.ambient === 'calm') {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    } else if (!this.ambientTimer) {
      this.chantAt = 0;
      this.ambientTimer = setInterval(() => this.ambientTick(), 100);
    }
  }

  /** Ambience falls silent while the game is paused. */
  setPaused(paused) {
    if (paused === this.paused) return; // called every frame; only act on changes
    this.paused = paused;
    if (this.ctx) this.updateAmbientGain();
  }

  updateAmbientGain() {
    const on = this.enabled && !this.paused && this.ambient !== 'calm';
    const level = this.ambient === 'riot' ? 1 : 0.6;
    this.ambientOut.gain.setTargetAtTime(on ? CONFIG.audio.ambientVolume * level : 0, this.ctx.currentTime, 0.3);
  }

  ambientTick() {
    if (!this.ctx || this.ambient === 'calm') return;
    const riot = this.ambient === 'riot';
    // The crowd chants "OD-STOP!" – faster and angrier during riots.
    this.chantAt -= 0.1;
    if (this.chantAt <= 0) {
      this.chant(riot);
      this.chantAt = riot ? 1.1 : 1.7;
    }
    // Riots: fire crackles all the time.
    if (riot) {
      for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.6) {
          this.burst({ t: Math.random() * 0.1, dur: 0.02 + Math.random() * 0.03, gain: 0.05 + Math.random() * 0.12, type: 'highpass', hz: 2500, dest: this.ambientOut });
        }
      }
      this.burst({ dur: 0.15, gain: 0.05, type: 'lowpass', hz: 300, dest: this.ambientOut });
    }
  }

  /** A crowd shouting two syllables: several rough voices through a vowel-like filter. */
  chant(riot) {
    const syllables = [
      { t: 0, dur: 0.22, pitch: 52, vowel: 600 }, // "OD"
      { t: 0.3, dur: 0.32, pitch: 50, vowel: 750 }, // "STOP"
    ];
    for (const syl of syllables) {
      for (let v = 0; v < (riot ? 7 : 5); v++) {
        const ctx = this.ctx;
        const start = ctx.currentTime + syl.t + Math.random() * 0.05;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq(syl.pitch + (Math.random() * 6 - 3) + (v % 2 ? 7 : 0));
        const formant = ctx.createBiquadFilter();
        formant.type = 'bandpass';
        formant.frequency.value = syl.vowel;
        formant.Q.value = 3;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime(0.09, start + 0.03);
        amp.gain.exponentialRampToValueAtTime(0.0001, start + syl.dur);
        osc.connect(formant).connect(amp).connect(this.ambientOut);
        osc.start(start);
        osc.stop(start + syl.dur + 0.05);
      }
      // The "S"/"T" of the shout.
      this.burst({ t: syl.t, dur: 0.06, gain: 0.08, type: 'highpass', hz: 3000, dest: this.ambientOut });
    }
  }
}

// ---------------------------------------------------------------------------
// Effect recipes

const EFFECTS = {
  // Three hammer knocks.
  build: (s) => {
    for (let i = 0; i < 3; i++) {
      s.tone({ hz: 140, t: i * 0.13, dur: 0.12, gain: 0.35, glideTo: 70 });
      s.burst({ t: i * 0.13, dur: 0.05, gain: 0.25, hz: 1800, q: 2 });
    }
  },
  // A rumbling collapse.
  demolish: (s) => {
    s.burst({ dur: 0.9, gain: 0.5, type: 'lowpass', hz: 350 });
    s.burst({ t: 0.05, dur: 0.25, gain: 0.3, hz: 900 });
    s.tone({ hz: 90, dur: 0.6, gain: 0.3, glideTo: 40 });
  },
  // Coins dropping into the secret account.
  coin: (s) => {
    s.tone({ type: 'triangle', midi: 88, dur: 0.12, gain: 0.18 });
    s.tone({ type: 'triangle', midi: 93, t: 0.08, dur: 0.35, gain: 0.18 });
  },
  // Newsletter pages being flipped.
  paper: (s) => {
    s.burst({ dur: 0.18, gain: 0.25, hz: 2500, q: 0.8 });
    s.burst({ t: 0.15, dur: 0.15, gain: 0.2, hz: 3200, q: 0.8 });
  },
  // Snow: soft high bells.
  chime: (s) => {
    [84, 88, 91, 96, 91].forEach((m, i) => s.tone({ midi: m, t: i * 0.09, dur: 0.6, gain: 0.08 }));
  },
  // Party: a quick accordion-like flourish.
  fanfare: (s) => {
    [65, 69, 72, 77].forEach((m, i) => s.tone({ type: 'sawtooth', midi: m, t: i * 0.09, dur: 0.25, gain: 0.07 }));
    s.tone({ type: 'sawtooth', midi: 81, t: 0.36, dur: 0.5, gain: 0.07 });
  },
  // Media silenced: "shhh".
  shush: (s) => s.burst({ dur: 0.7, gain: 0.25, type: 'highpass', hz: 3000 }),
  // Lunch with the minister: glasses clinking.
  clink: (s) => {
    s.tone({ midi: 100, dur: 0.4, gain: 0.12 });
    s.tone({ midi: 101, t: 0.01, dur: 0.4, gain: 0.08 });
  },
  // Not allowed / no money.
  error: (s) => s.tone({ type: 'square', hz: 160, dur: 0.18, gain: 0.08, glideTo: 110 }),
  // End of month.
  bell: (s) => {
    s.tone({ midi: 79, dur: 1.2, gain: 0.12 });
    s.tone({ midi: 91, dur: 0.9, gain: 0.05 });
  },
  // A dilemma card appears: a questioning two-note motif.
  card: (s) => {
    s.tone({ type: 'triangle', midi: 72, dur: 0.18, gain: 0.15 });
    s.tone({ type: 'triangle', midi: 74, t: 0.18, dur: 0.35, gain: 0.15 });
  },
  // A wish fulfilled: happy arpeggio.
  wish: (s) => [72, 76, 79, 84].forEach((m, i) => s.tone({ type: 'triangle', midi: m, t: i * 0.07, dur: 0.3, gain: 0.13 })),
  // Election night.
  drumroll: (s) => {
    for (let i = 0; i < 40; i++) s.burst({ t: i * 0.06, dur: 0.05, gain: 0.08 + i * 0.004, hz: 900, q: 1 });
  },
  win: (s) => {
    [60, 64, 67].forEach((m, i) => s.tone({ type: 'sawtooth', midi: m, t: i * 0.14, dur: 0.18, gain: 0.08 }));
    s.tone({ type: 'sawtooth', midi: 72, t: 0.42, dur: 0.9, gain: 0.09 });
  },
  // Sad trombone.
  lose: (s) => {
    [55, 54, 53].forEach((m, i) => s.tone({ type: 'sawtooth', midi: m, t: i * 0.4, dur: 0.38, gain: 0.08 }));
    s.tone({ type: 'sawtooth', midi: 52, t: 1.2, dur: 1.1, gain: 0.08, glideTo: freq(50) });
  },
  // A building burns down in a riot.
  fire: (s) => {
    s.burst({ dur: 1.2, gain: 0.35, type: 'lowpass', hz: 500 });
    for (let i = 0; i < 12; i++) s.burst({ t: Math.random() * 1, dur: 0.03, gain: 0.15, type: 'highpass', hz: 2500 });
  },
  click: (s) => s.tone({ type: 'triangle', midi: 84, dur: 0.05, gain: 0.08 }),
  // A live event appears: two quick attention beeps.
  alert: (s) => {
    s.tone({ type: 'square', midi: 81, dur: 0.09, gain: 0.06 });
    s.tone({ type: 'square', midi: 86, t: 0.12, dur: 0.12, gain: 0.06 });
  },
  // Bear: a low growl.
  growl: (s) => {
    s.burst({ dur: 0.9, gain: 0.35, type: 'lowpass', hz: 220, q: 4 });
    s.tone({ type: 'sawtooth', hz: 95, dur: 0.9, gain: 0.12, glideTo: 60 });
  },
  // Tractor: an old diesel going putt-putt.
  tractor: (s) => {
    for (let i = 0; i < 8; i++) s.tone({ type: 'square', hz: 55, t: i * 0.09, dur: 0.07, gain: 0.1 });
  },
  // Scissors cutting the ribbon, then applause.
  snip: (s) => {
    s.burst({ dur: 0.05, gain: 0.3, type: 'highpass', hz: 4000 });
    s.burst({ t: 0.12, dur: 0.05, gain: 0.3, type: 'highpass', hz: 4500 });
    for (let i = 0; i < 18; i++) s.burst({ t: 0.3 + Math.random() * 0.9, dur: 0.03, gain: 0.12, hz: 1500, q: 0.7 });
  },
  // A brawl: a couple of dull punches.
  punch: (s) => {
    for (let i = 0; i < 4; i++) {
      s.tone({ hz: 110, t: i * 0.22 + Math.random() * 0.05, dur: 0.1, gain: 0.3, glideTo: 50 });
      s.burst({ t: i * 0.22, dur: 0.04, gain: 0.2, type: 'lowpass', hz: 600 });
    }
  },
  // A friendly double pat on the shoulder.
  pat: (s) => {
    s.tone({ type: 'triangle', hz: 220, dur: 0.08, gain: 0.15 });
    s.tone({ type: 'triangle', hz: 260, t: 0.12, dur: 0.1, gain: 0.15 });
  },
  // Journalist: camera shutter.
  camera: (s) => {
    s.burst({ dur: 0.04, gain: 0.35, type: 'highpass', hz: 2000 });
    s.burst({ t: 0.08, dur: 0.05, gain: 0.25, type: 'highpass', hz: 1500 });
  },
};
