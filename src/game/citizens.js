// Citizens: creation, characters and state-dependent thoughts.

import { CONFIG } from '../config.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { CITIZEN_NAMES, CHARACTERS, THOUGHTS, BUILDINGS, NEIGHBOR, MOOD_LABELS } from './texts.js';
import { clamp, randFloat, randInt, pick, shuffle, capitalize, fillTemplate } from './util.js';
import { moodOf } from './stats.js';

const CHARACTER_KEYS = Object.keys(CHARACTERS);

export function createCitizens() {
  const s = CONFIG.start;
  const characters = shuffle(CITIZEN_NAMES.map((_, i) => CHARACTER_KEYS[i % CHARACTER_KEYS.length]));
  const citizens = CITIZEN_NAMES.map((name, i) => {
    const home = i % 4;
    const others = [0, 1, 2, 3].filter((d) => d !== home);
    return {
      id: i,
      name,
      female: i % 2 === 1,
      home,
      character: characters[i],
      happy: randFloat(s.happyMin, s.happyMax),
      envy: randFloat(s.envyMin, s.envyMax),
      // Who they are envious of: { district: 0..3 | 'neighbor', what: building type | null }
      envyTarget: { district: pick(others), what: null },
      protesting: false,
      thought: '',
      thoughtTimer: randFloat(0, CONFIG.citizens.thoughtMax),
    };
  });
  return citizens;
}

export function clampCitizen(c) {
  c.happy = clamp(c.happy);
  c.envy = clamp(c.envy);
}

export function characterName(c) {
  return CHARACTERS[c.character][c.female ? 1 : 0];
}

export function moodLabel(c, state) {
  return MOOD_LABELS[moodOf(c, state)][c.female ? 1 : 0];
}

/** Human-readable answer to "who are they envious of?" */
export function envyTargetLabel(c) {
  const t = c.envyTarget;
  if (!t) return 'Na nikogar (zaenkrat).';
  if (t.district === 'neighbor') return `Na sosednjo občino ${NEIGHBOR.name}`;
  const d = DISTRICTS[t.district];
  const what = t.what ? ` (${BUILDINGS[t.what].short})` : ' (kar tako, iz principa)';
  return `Na tiste ${d.from}${what}`;
}

/** Picks a new thought based on the citizen's and the municipality's state. */
export function pickThought(c, state) {
  const pools = [];
  const add = (list, weight) => list && list.length && pools.push({ list, weight });

  // Protesters only shout slogans (unless everyone is at the party).
  if (c.protesting && !state.party) {
    const slogans = state.unrest === 'riot' ? [...THOUGHTS.riot, ...THOUGHTS.protest] : THOUGHTS.protest;
    let text = fillThought(pick(slogans), c);
    if (text === c.thought) text = fillThought(pick(slogans), c);
    return text;
  }
  if (state.party) add(THOUGHTS.party, 6);
  const wish = state.wishes?.find((w) => w.citizenId === c.id);
  if (wish) add([`Želim si samo eno: ${wish.text.charAt(0).toLowerCase()}${wish.text.slice(1)}`], 3);
  if (c.grudgeMonths > 0) add(THOUGHTS.grudge, 4);
  if (c.loyalMonths > 0) add(THOUGHTS.loyal, 1.5);
  if (c.boughtVote && state.campaign) add(THOUGHTS.bought, 3);
  if (state.campaign) {
    const opp = state.opponentId != null ? state.citizens[state.opponentId].name : 'nekdo';
    add(THOUGHTS.campaign.map((t) => t.replace('{opponent}', opp)), 2.5);
  }
  if (state.snow) add(THOUGHTS.snow, 4);

  const t = c.envyTarget;
  if (c.envy >= 35 && t) {
    const weight = c.envy >= 55 ? 4 : 1.5;
    if (t.district === 'neighbor') add(THOUGHTS.envyNeighbor, weight);
    else if (t.what) add(THOUGHTS.envy, weight);
    else add(THOUGHTS.envyGeneric, weight);
  }
  if (state.propaganda >= 6) add(THOUGHTS.propaganda, 2);
  if (districtHas(state, c.home, 'factory')) add(THOUGHTS.nearFactory, 2.5);
  if (districtHas(state, c.home, 'inn')) add(THOUGHTS.nearInn, 2);
  if (c.happy < 30) add(THOUGHTS.lowHappy, 3);
  if (c.happy > 70) add(THOUGHTS.highHappy, 3);
  add(THOUGHTS.character[c.character], 2);
  add(THOUGHTS.general, 1.5);

  const total = pools.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pool = pools[pools.length - 1];
  for (const p of pools) {
    r -= p.weight;
    if (r <= 0) {
      pool = p;
      break;
    }
  }

  let template = pick(pool.list);
  for (let i = 0; i < 4 && pool.list.length > 1; i++) {
    const candidate = fillThought(template, c);
    if (candidate !== c.thought) break;
    template = pick(pool.list);
  }
  return fillThought(template, c);
}

function districtHas(state, district, type) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[idx(x, y)].type === type && districtOf(x, y) === district) return true;
    }
  }
  return false;
}

function fillThought(template, c) {
  const t = c.envyTarget;
  const d = t && typeof t.district === 'number' ? DISTRICTS[t.district] : null;
  const vars = {
    loc: d ? d.loc : '',
    Loc: d ? capitalize(d.loc) : '',
    from: d ? d.from : '',
    what: t && t.what ? BUILDINGS[t.what].what : '',
    homeName: DISTRICTS[c.home].name,
  };
  return fillTemplate(template, vars, c.female);
}

/** Advances per-citizen thought timers (real time). Returns true if any thought changed. */
export function tickThoughts(state, dt) {
  let changed = false;
  for (const c of state.citizens) {
    c.thoughtTimer -= dt;
    if (c.thoughtTimer <= 0) {
      c.thought = pickThought(c, state);
      c.thoughtTimer = randInt(CONFIG.citizens.thoughtMin * 10, CONFIG.citizens.thoughtMax * 10) / 10;
      changed = true;
    }
  }
  return changed;
}
