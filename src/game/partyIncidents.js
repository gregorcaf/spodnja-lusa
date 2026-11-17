// What happens after the fire-brigade party: some citizens are drunk for a while,
// and often there's an incident (a brawl, a drunk tanker driver, the mayor on a table, a hangover).

import { CONFIG } from '../config.js';
import { DISTRICTS, SIZE, idx, districtOf } from './map.js';
import { clampCitizen } from './citizens.js';
import { envyFactor } from './envy.js';
import { clamp, pick, shuffle, capitalize, randInt, formatEuro } from './util.js';

const a = (c) => (c.female ? 'a' : '');
const first = (c) => c.name.split(' ')[0];

function tilesOf(state, type) {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (state.grid[idx(x, y)].type === type) out.push({ x, y });
  return out;
}

const INCIDENTS = {
  // Two citizens from different districts fight; their districts grow more envious of each other.
  brawl(state) {
    const p = CONFIG.levers.party;
    const [c1, ...rest] = shuffle(state.citizens);
    const c2 = rest.find((c) => c.home !== c1.home) || rest[0];
    for (const c of [c1, c2]) {
      c.happy -= p.brawlHappy;
      clampCitizen(c);
    }
    for (const c of state.citizens) {
      const other = c.home === c1.home ? c2.home : c.home === c2.home ? c1.home : null;
      if (other == null) continue;
      c.envy += p.brawlEnvy * envyFactor(c.home, other);
      c.envyTarget = { district: other, what: null };
      clampCitizen(c);
    }
    state.budget -= p.brawlCost;
    const reason = pick(['zaradi parkirnega mesta', 'zaradi tega, kdo je bolje zapel', 'zaradi meje med njivama iz leta 1974', 'zaradi zadnjega kosa potice']);
    return {
      type: 'brawl',
      citizens: [c1.id, c2.id],
      tiles: [],
      news: `Na veselici sta se ${first(c1)} (${DISTRICTS[c1.home].name}) in ${first(c2)} (${DISTRICTS[c2.home].name}) stepla ${reason}. Reševalci so zaračunali ${formatEuro(p.brawlCost)}.`,
    };
  },

  // A drunk firefighter drives the tanker into the roundabout (statue down) or into a ditch (road gone).
  tanker(state) {
    const statues = tilesOf(state, 'roundabout');
    const target = statues.length ? pick(statues) : pick(tilesOf(state, 'road'));
    if (!target) return null;
    const tile = state.grid[idx(target.x, target.y)];
    const wasRoundabout = tile.type === 'roundabout';
    state.grid[idx(target.x, target.y)] = { type: wasRoundabout ? 'road' : 'grass', variant: tile.variant };
    const loc = DISTRICTS[districtOf(target.x, target.y)].loc;
    return {
      type: 'tanker',
      citizens: [],
      tiles: [target],
      news: wasRoundabout
        ? `Po veselici je gasilec s cisterno ${loc} zapeljal naravnost čez krožišče. Kip leži, gasilec trdi, da je »reševal mačko«.`
        : `Po veselici je gasilska cisterna ${loc} končala v jarku, skupaj s kosom ceste. Voznik: »Cesta se je premaknila.«`,
    };
  },

  // A photo of the mayor dancing on a table.
  photo(state) {
    const p = CONFIG.levers.party;
    state.propaganda = Math.max(0, state.propaganda - p.photoPropaganda);
    state.affair = clamp(state.affair + p.photoAffair);
    return {
      type: 'photo',
      citizens: [],
      tiles: [],
      news: 'Po občini kroži fotografija župana, ki ob dveh zjutraj pleše na mizi z gasilsko čelado. Glasilo jo je poskušalo izbrisati. Neuspešno.',
    };
  },

  // Monday after the party: half the municipality is on sick leave.
  hangover(state) {
    const cost = CONFIG.levers.party.hangoverCost;
    state.budget -= cost;
    return {
      type: 'hangover',
      citizens: [],
      tiles: [],
      news: `Ponedeljek po veselici: pol občinske uprave je na bolniški »zaradi prehlada«. Zamujeni roki stanejo ${formatEuro(cost)}.`,
    };
  },
};

/**
 * Called when a party ends. Marks some citizens drunk and maybe causes an incident.
 * Returns { drunk: [ids], incident: { type, news, citizens, tiles } | null }.
 */
export function afterParty(state) {
  const p = CONFIG.levers.party;
  const drunk = shuffle(state.citizens).slice(0, randInt(p.drunkMin, p.drunkMax));
  for (const c of drunk) {
    c.drunk = p.drunkSeconds;
    c.thoughtTimer = 0; // start hiccuping right away
  }

  let incident = null;
  if (Math.random() < p.incidentChance) {
    for (const key of shuffle(Object.keys(INCIDENTS))) {
      incident = INCIDENTS[key](state);
      if (incident) break;
    }
  }
  return { drunk: drunk.map((c) => c.id), incident };
}

/** Real-time countdown of drunkenness (seconds). */
export function tickDrunk(state, dt) {
  for (const c of state.citizens) if (c.drunk > 0) c.drunk = Math.max(0, c.drunk - dt);
}

export function partyIncidentLabel(type) {
  return { brawl: 'Pretep', tanker: 'Pijana cisterna', photo: 'Župan na mizi', hangover: 'Maček' }[type] || capitalize(type);
}
