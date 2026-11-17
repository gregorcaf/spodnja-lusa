// Background music: an original polka in Slovenian folk style, synthesised live with Web Audio.
// Accordion-like lead + clarinet-like second voice in parallel thirds, oom-pah bass,
// off-beat accordion chords and a light brush. No audio files are used.

import { CONFIG } from '../config.js';
import { getAudioContext } from './context.js';

// ---------------------------------------------------------------------------
// Score. Each bar is 2/4 = four eighth notes. Melody tokens: [midi | null (rest), length in eighths].

const F_MAJOR = [5, 7, 9, 10, 0, 2, 4]; // pitch classes F G A Bb C D E
const BB_MAJOR = [10, 0, 2, 3, 5, 7, 9]; // Bb C D Eb F G A

const CHORDS = {
  F: { root: 41, fifth: 48, notes: [53, 57, 60] },
  C7: { root: 48, fifth: 43, notes: [52, 55, 58] },
  Bb: { root: 46, fifth: 41, notes: [50, 53, 58] },
  Eb: { root: 39, fifth: 46, notes: [51, 55, 58] },
  F7: { root: 41, fifth: 48, notes: [51, 57, 60] },
};

const A4 = 69, Bb4 = 70, C5 = 72, D5 = 74, Eb5 = 75, E5 = 76, F5 = 77, G5 = 79, A5 = 81, Bb5 = 82, G4 = 67;

// Part A in F major, part B ("trio") in B-flat, as polkas traditionally go.
const SECTIONS = [
  {
    scale: F_MAJOR,
    chords: ['F', 'F', 'C7', 'C7', 'C7', 'C7', 'F', 'F', 'F', 'F', 'Bb', 'Bb', 'C7', 'C7', 'F', 'F'],
    melody: [
      [[C5, 1], [A4, 1], [C5, 1], [F5, 1]],
      [[A5, 2], [G5, 1], [F5, 1]],
      [[E5, 1], [G5, 1], [E5, 1], [C5, 1]],
      [[Bb4, 2], [C5, 1], [D5, 1]],
      [[E5, 1], [D5, 1], [E5, 1], [G5, 1]],
      [[G5, 2], [E5, 1], [C5, 1]],
      [[A4, 1], [C5, 1], [F5, 1], [A5, 1]],
      [[F5, 2], [null, 2]],
      [[C5, 1], [A4, 1], [C5, 1], [F5, 1]],
      [[A5, 2], [G5, 1], [F5, 1]],
      [[F5, 1], [D5, 1], [Bb4, 1], [D5, 1]],
      [[F5, 2], [G5, 1], [F5, 1]],
      [[E5, 1], [D5, 1], [C5, 1], [Bb4, 1]],
      [[G4, 1], [Bb4, 1], [E5, 1], [G5, 1]],
      [[F5, 1], [C5, 1], [A4, 1], [C5, 1]],
      [[F5, 2], [null, 2]],
    ],
  },
  {
    scale: BB_MAJOR,
    chords: ['Bb', 'Bb', 'F7', 'F7', 'F7', 'F7', 'Bb', 'Bb', 'Bb', 'Bb', 'Eb', 'Eb', 'F7', 'F7', 'Bb', 'Bb'],
    melody: [
      [[F5, 2], [D5, 1], [F5, 1]],
      [[Bb5, 2], [A5, 1], [G5, 1]],
      [[A5, 1], [F5, 1], [Eb5, 1], [C5, 1]],
      [[A4, 2], [C5, 1], [Eb5, 1]],
      [[Eb5, 1], [F5, 1], [A5, 1], [F5, 1]],
      [[Eb5, 2], [C5, 2]],
      [[D5, 1], [F5, 1], [Bb5, 1], [F5, 1]],
      [[D5, 2], [null, 2]],
      [[F5, 2], [D5, 1], [F5, 1]],
      [[Bb5, 2], [A5, 1], [G5, 1]],
      [[G5, 1], [Eb5, 1], [Bb4, 1], [Eb5, 1]],
      [[G5, 2], [A5, 1], [Bb5, 1]],
      [[A5, 1], [G5, 1], [F5, 1], [Eb5, 1]],
      [[C5, 1], [Eb5, 1], [A5, 1], [F5, 1]],
      [[D5, 1], [F5, 1], [Bb4, 1], [D5, 1]],
      [[Bb4, 2], [null, 2]],
    ],
  },
];

/** Diatonic third below `midi` within the given scale (pitch classes). */
function thirdBelow(midi, scale) {
  const pc = midi % 12;
  const i = scale.indexOf(pc);
  if (i < 0) return null;
  const target = scale[(i + 5) % 7]; // two scale steps down = five steps up, mod 7
  let n = midi - 1;
  while (n % 12 !== target) n--;
  return n;
}

/** Flattens the score into a list of steps (one per eighth note). */
function buildSteps() {
  const steps = [];
  for (const section of SECTIONS) {
    const tonic = section.scale[0];
    section.melody.forEach((bar, b) => {
      const chord = CHORDS[section.chords[b]];
      const barSteps = [0, 1, 2, 3].map((pos) => ({ chord, pos, melody: null, tonic }));
      let pos = 0;
      for (const [midi, len] of bar) {
        if (midi != null) barSteps[pos].melody = { midi, len, harmony: thirdBelow(midi, section.scale) };
        pos += len;
      }
      steps.push(...barSteps);
    });
  }
  return steps;
}

const STEPS = buildSteps();

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Parallel minor: lowers the 3rd, 6th and 7th degree of the major key (for riots). */
function minorize(midi, tonic) {
  const interval = (((midi - tonic) % 12) + 12) % 12;
  return interval === 4 || interval === 9 || interval === 11 ? midi - 1 : midi;
}

// ---------------------------------------------------------------------------

const LOOKAHEAD = 0.15; // seconds scheduled ahead

export class Music {
  constructor() {
    this.ctx = null;
    this.enabled = true; // music is always on when the game loads
    this.party = false;
    this.minor = false; // riots turn the polka into a sad minor-key version
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;

    // Start right away where the browser allows it (e.g. Firefox with autoplay permitted).
    // Elsewhere browsers require a user gesture, so we also start on the first click/key press.
    if (navigator.getAutoplayPolicy?.('audiocontext') === 'allowed') this.start();

    const unlock = (e) => {
      // A click on the music button itself is handled by toggle().
      if (e.target instanceof Element && e.target.closest('#music-toggle')) return;
      if (this.enabled) this.start();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

  }

  init() {
    const ctx = getAudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(ctx.destination);

    // Shared white-noise buffer for the brush.
    const len = Math.floor(ctx.sampleRate * 0.2);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  start() {
    if (!this.ctx) this.init();
    this.ctx.resume();
    this.nextTime = this.ctx.currentTime + 0.1;
    this.master.gain.setTargetAtTime(this.volume(), this.ctx.currentTime, 0.3);
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (!this.ctx) return;
    clearInterval(this.timer);
    this.timer = null;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
  }

  toggle() {
    // Enabled but not audible yet (no gesture so far): the first press means "play".
    if (this.enabled && !this.isPlaying()) {
      this.start();
      return true;
    }
    this.enabled = !this.enabled;
    if (this.enabled) this.start();
    else this.stop();
    return this.enabled;
  }

  isPlaying() {
    return !!this.timer && this.ctx?.state === 'running';
  }

  /** The party is louder and a little faster. */
  setParty(on) {
    this.party = on;
  }

  /** Minor key and a slower tempo while the municipality is rioting. */
  setMinor(on) {
    this.minor = on;
  }

  volume() {
    return CONFIG.audio.musicVolume * (this.party ? 1.3 : 1);
  }

  eighth() {
    const bpm = CONFIG.audio.tempo * (this.party ? 1.12 : this.minor ? 0.85 : 1);
    return 60 / bpm / 2;
  }

  schedule() {
    const ctx = this.ctx;
    // Live volume (dev panel slider, party boost).
    this.master.gain.setTargetAtTime(this.volume(), ctx.currentTime, 0.2);
    // If the timer was throttled, skip ahead instead of firing a burst of late notes.
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;

    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(STEPS[this.step], this.nextTime);
      this.nextTime += this.eighth();
      this.step = (this.step + 1) % STEPS.length;
    }
  }

  playStep(s, t) {
    const e = this.eighth();
    const n = (midi) => (this.minor ? minorize(midi, s.tonic) : midi);
    // Oom (bass on the beat) – pah (accordion chord on the off-beat).
    if (s.pos === 0) this.bass(n(s.chord.root), t, e * 1.6);
    if (s.pos === 2) this.bass(n(s.chord.fifth), t, e * 1.6);
    if (s.pos === 1 || s.pos === 3) {
      for (const note of s.chord.notes) this.chordNote(n(note), t, e * 0.7);
      this.brush(t);
    }
    if (s.melody) {
      const dur = s.melody.len * e * 0.92;
      this.lead(n(s.melody.midi), t, dur);
      if (s.melody.harmony) this.clarinet(n(s.melody.harmony), t, dur);
    }
  }

  // --- Instruments -----------------------------------------------------------

  voice({ type, midi, t, dur, gain, cutoff, detune = 0, attack = 0.015, release = 0.08 }) {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + attack);
    amp.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
    amp.gain.linearRampToValueAtTime(0, t + dur);
    filter.connect(amp).connect(this.master);

    // Two slightly detuned reeds give the accordion its "musette" wobble.
    const detunes = detune ? [-detune, detune] : [0];
    for (const d of detunes) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq(midi);
      osc.detune.value = d;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
  }

  lead(midi, t, dur) {
    this.voice({ type: 'sawtooth', midi, t, dur, gain: 0.09, cutoff: 2600, detune: 7 });
  }

  clarinet(midi, t, dur) {
    this.voice({ type: 'square', midi, t, dur, gain: 0.05, cutoff: 1700 });
  }

  chordNote(midi, t, dur) {
    this.voice({ type: 'sawtooth', midi, t, dur, gain: 0.035, cutoff: 1400, detune: 5, attack: 0.01, release: 0.05 });
  }

  bass(midi, t, dur) {
    this.voice({ type: 'sawtooth', midi, t, dur, gain: 0.16, cutoff: 420, attack: 0.01, release: 0.12 });
  }

  brush(t) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.05, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(hp).connect(amp).connect(this.master);
    src.start(t);
    src.stop(t + 0.08);
  }
}
