// Live events on the map: a bear, a tractor, a wedding, a house fire, a journalist.
// One at a time; the mayor can click it (react) or ignore it until it runs out.
//
// state.mapEvent = { uid, type, district, progress 0..1, duration (game-months), path: [{x,y}], tile: {x,y} }
// Positions are in tile coordinates; the renderer animates along `path` by `progress`.

import { CONFIG } from '../config.js';
import { DISTRICTS, SIZE, HALF, idx, districtOf, inBounds, isWalkable } from './map.js';
import { applyEffect } from './effects.js';
import { findFirehouses } from './levers.js';
import { pick, capitalize, fillTemplate, formatEuro, randFloat } from './util.js';

// ---------------------------------------------------------------------------
// Helpers

function tilesOf(state, test) {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(state.grid[idx(x, y)].type, x, y)) out.push({ x, y });
  return out;
}

/** Shortest road path between two road tiles (BFS), or null. */
function roadPath(state, from, to) {
  const key = (t) => idx(t.x, t.y);
  const prev = new Map([[key(from), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === to.x && cur.y === to.y) {
      const path = [];
      for (let t = cur; t; t = prev.get(key(t))) path.unshift(t);
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: cur.x + dx, y: cur.y + dy };
      if (!inBounds(n.x, n.y) || !isWalkable(state.grid[idx(n.x, n.y)].type) || prev.has(key(n))) continue;
      prev.set(key(n), cur);
      queue.push(n);
    }
  }
  return null;
}

/** A road walk of at least `minLength` tiles, preferably inside `district`. */
function randomRoadWalk(state, district, minLength) {
  const roads = tilesOf(state, (t) => isWalkable(t));
  const local = roads.filter((t) => districtOf(t.x, t.y) === district);
  for (let i = 0; i < 30; i++) {
    const a = pick(local.length ? local : roads);
    const b = pick(roads);
    const path = roadPath(state, a, b);
    if (path && path.length >= minLength) return path.slice(0, minLength + 4);
  }
  return null;
}

const vars = (district) => {
  const d = DISTRICTS[district];
  return { loc: d.loc, Loc: capitalize(d.loc), district: d.name };
};

// ---------------------------------------------------------------------------
// Event types

export const MAP_EVENTS = {
  bear: {
    icon: '🐻',
    name: 'Medved',
    duration: 0.6,
    announce: 'Medved se sprehaja {loc}! Klikni nanj, preden najde čebelnjake.',
    spawn(state) {
      // From the forest outside the map, straight through the district centre, out the other side.
      const district = Math.floor(Math.random() * 4);
      const cx = district % 2 === 0 ? HALF / 2 - 0.5 : HALF + HALF / 2 - 0.5;
      const cy = district < 2 ? HALF / 2 - 0.5 : HALF + HALF / 2 - 0.5;
      const angle = Math.random() * Math.PI * 2;
      const r = 9;
      const path = [
        { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r },
        { x: cx, y: cy },
        { x: cx - Math.cos(angle) * r, y: cy - Math.sin(angle) * r },
      ];
      return { district, path };
    },
    action: () => `Preženi ga (lovci, ${formatEuro(1000)})`,
    click: (state, ev) => ({
      effect: { budget: -1000, districtHappy: 5 },
      extra: () => {
        // Lojze always said there was a bear.
        const lojze = state.citizens.find((c) => c.name.startsWith('Lojze'));
        if (lojze) lojze.happy = Math.min(100, lojze.happy + 15);
      },
      news: 'Lovci so medveda {loc} pospremili nazaj v gozd. Lojze: »Saj sem rekel!«',
    }),
    ignoreHint: 'Sicer: odškodnina 4.000 €, sreča v kraju −6',
    expire: () => ({
      effect: { budget: -4000, districtHappy: -6 },
      news: 'Medved je {loc} pojedel tri panje medu in en štrudl. Odškodnina: 4.000 €. Medved zanika.',
    }),
  },

  tractor: {
    icon: '🚜',
    name: 'Traktor na cesti',
    duration: 0.5,
    announce: 'Traktor je obstal sredi glavne ceste {loc}! Klikni, da ga odvlečejo.',
    spawn(state) {
      // On one of the main roads.
      const main = tilesOf(state, (t, x, y) => t === 'road' && (x === HALF - 1 || x === HALF || y === HALF - 1 || y === HALF));
      if (!main.length) return null;
      const tile = pick(main);
      return { district: districtOf(tile.x, tile.y), tile, path: [tile] };
    },
    action: () => `Odvleci ga (${formatEuro(300)})`,
    click: () => ({
      effect: { budget: -300, districtHappy: 3 },
      news: 'Traktor {loc} je odvlečen. Kmet trdi, da je samo »za minutko skočil v gostilno«.',
    }),
    ignoreHint: 'Sicer: zastoj, sreča vseh −3',
    expire: () => ({
      effect: { happy: -3 },
      news: 'Traktor je pol dneva stal sredi glavne ceste {loc}. Zastoj je segal do Zgornjih Žlamp.',
    }),
  },

  wedding: {
    icon: '💒',
    name: 'Svatba',
    duration: 0.5,
    announce: 'Svatba {loc}! Svatje s harmonikarjem gredo po cesti. Klikni in jim nazdravi.',
    spawn(state) {
      const district = Math.floor(Math.random() * 4);
      const path = randomRoadWalk(state, district, 8);
      return path ? { district, path } : null;
    },
    action: () => `Nazdravi svatom (${formatEuro(500)})`,
    click: () => ({
      effect: { budget: -500, propaganda: 4, districtHappy: 4 },
      news: 'Župan je svatom {loc} nazdravil s šnopsom in podaril kuverto. Fotografija bo v glasilu.',
    }),
    ignoreHint: 'Sicer: užaljeni svatje, sreča v kraju −3',
    expire: () => ({
      effect: { districtHappy: -3 },
      news: 'Svatje {loc} so šli mimo občine. Župan ni prišel ven. To si bodo zapomnili do tretjega kolena.',
    }),
  },

  fire: {
    icon: '🔥',
    name: 'Požar',
    duration: 0.4,
    announce: 'Gori hiša {loc}! Klikni, da pokličeš gasilce.',
    spawn(state) {
      const houses = tilesOf(state, (t) => t === 'house');
      if (!houses.length) return null;
      const tile = pick(houses);
      return { district: districtOf(tile.x, tile.y), tile, path: [tile] };
    },
    action: (state) => (findFirehouses(state).length ? 'Pokliči naše gasilce (brezplačno)' : `Pokliči gasilce iz Žlamp (${formatEuro(3000)})`),
    click: (state) =>
      findFirehouses(state).length
        ? {
            effect: { happy: 4, propaganda: 2 },
            news: 'Gasilci so požar {loc} pogasili v štirih minutah. Potem so imeli veselico.',
          }
        : {
            effect: { budget: -3000, envy: 4 },
            news: 'Gasilci iz Zgornjih Žlamp so pogasili požar {loc}. Račun: 3.000 € in veliko zbadanja.',
          },
    ignoreHint: 'Sicer: hiša pogori, sreča v kraju −6',
    expire: (state, ev) => {
      const t = ev.tile;
      const tile = state.grid[idx(t.x, t.y)];
      const burned = tile.type === 'house';
      if (burned) state.grid[idx(t.x, t.y)] = { type: 'grass', variant: tile.variant };
      return {
        effect: { districtHappy: -6 },
        tiles: burned ? [t] : [],
        news: 'Hiša {loc} je pogorela do tal. Gasilcev ni poklical nihče, vsi so snemali s telefoni.',
      };
    },
  },

  journalist: {
    icon: '📷',
    name: 'Novinar',
    duration: 0.5,
    announce: 'Novinar z kamero se potika {loc}! Klikni, preden kaj najde.',
    spawn(state) {
      const district = Math.floor(Math.random() * 4);
      const path = randomRoadWalk(state, district, 6);
      return path ? { district, path } : null;
    },
    action: (state) =>
      state.secret >= 2000 ? `»Honorar za sodelovanje« (${formatEuro(2000)} iz skrivnega računa)` : `»Honorar« iz proračuna (${formatEuro(2000)}, tveganje afere +3)`,
    click: (state) =>
      state.secret >= 2000
        ? { effect: { secret: -2000 }, news: 'Novinar je dobil »honorar za sodelovanje« in odšel pisat o rekordni buči.' }
        : { effect: { budget: -2000, affair: 3 }, news: 'Novinar je dobil honorar iz proračuna. Na položnici piše »svetovanje«.' },
    ignoreHint: 'Sicer: pri tveganju afere od 30 % škandal (+10), drugače lepa reportaža',
    expire: (state) =>
      state.affair >= 30
        ? { effect: { affair: 10 }, news: 'Novinar je objavil članek »Kdo je pravzaprav bratranec?«. Telefoni na občini ne nehajo zvoniti.' }
        : { effect: { propaganda: 2 }, news: 'Novinar je napisal reportažo o naši idilični občini {loc}. Nič ni našel. Še.' },
  },
};

export const MAP_EVENT_TYPES = Object.keys(MAP_EVENTS);

// ---------------------------------------------------------------------------
// Lifecycle

/** Tries to start an event (random type that fits). Returns it or null. */
export function spawnMapEvent(state, type = null) {
  const types = type ? [type] : [...MAP_EVENT_TYPES].sort(() => Math.random() - 0.5);
  for (const t of types) {
    const def = MAP_EVENTS[t];
    const spot = def.spawn(state);
    if (!spot) continue;
    state.mapEvent = {
      uid: `${t}-${state.monthIndex}-${Math.floor(Math.random() * 1e6)}`,
      type: t,
      district: spot.district,
      path: spot.path,
      tile: spot.tile || null,
      progress: 0,
      duration: def.duration * CONFIG.mapEvents.durationScale,
    };
    return state.mapEvent;
  }
  return null;
}

function finish(state, outcome) {
  const ev = state.mapEvent;
  state.mapEvent = null;
  const { tiles } = applyEffect(state, outcome.effect, { district: ev.district });
  outcome.extra?.();
  return { event: ev, news: fillTemplate(outcome.news, vars(ev.district)), tiles: [...tiles, ...(outcome.tiles || [])] };
}

/** The mayor clicked the event. Returns { event, news, tiles } or null. */
export function clickMapEvent(state) {
  const ev = state.mapEvent;
  if (!ev) return null;
  return { ...finish(state, MAP_EVENTS[ev.type].click(state, ev)), clicked: true };
}

/** Advances the running event by `months`; returns the result when it runs out unanswered. */
export function advanceMapEvent(state, months) {
  const ev = state.mapEvent;
  if (!ev) return null;
  ev.progress = Math.min(1, ev.progress + months / ev.duration);
  if (ev.progress < 1) return null;
  return { ...finish(state, MAP_EVENTS[ev.type].expire(state, ev)), clicked: false };
}

/** Text for the toast, the hover tooltip and the marker. */
export function describeMapEvent(state) {
  const ev = state.mapEvent;
  if (!ev) return null;
  const def = MAP_EVENTS[ev.type];
  return {
    icon: def.icon,
    name: def.name,
    announce: fillTemplate(def.announce, vars(ev.district)),
    action: def.action(state),
    ignoreHint: def.ignoreHint,
    timeLeft: 1 - ev.progress,
  };
}

export function nextMapEventDelay() {
  const m = CONFIG.mapEvents;
  return randFloat(m.minMonths, m.maxMonths);
}
