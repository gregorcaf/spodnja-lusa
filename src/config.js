// All tunable game numbers in one place.
// CONFIG is a live object: game logic reads it on every action, the dev panel mutates it.

export const DEFAULT_CONFIG = {
  economy: {
    startBudget: 150000,
    baseIncome: 6000, // € per month
    taxPerHouse: 300, // € per house per month
    baseCost: 7000, // salaries and coffee for the municipal office
  },

  // Cost, monthly upkeep and construction effects
  buildings: {
    road: { cost: 2000, upkeep: 30, homeHappy: 2, envyElse: 1, allHappy: 0 },
    house: { cost: 10000, upkeep: 0, homeHappy: 3, envyElse: 2, allHappy: 0 },
    roundabout: { cost: 60000, upkeep: 500, homeHappy: 15, envyElse: 12, allHappy: 3 },
    firehouse: { cost: 35000, upkeep: 1000, homeHappy: 6, envyElse: 4, allHappy: 6 },
    hall: { cost: 140000, upkeep: 3000, homeHappy: 10, envyElse: 15, allHappy: -3 },
  },

  // Demolition: single cost, effect depends on what is demolished
  demolish: {
    cost: 1000,
    effects: {
      road: { homeHappy: -1, envyElse: 0, allHappy: 0 },
      house: { homeHappy: -6, envyElse: -2, allHappy: 0 },
      roundabout: { homeHappy: -10, envyElse: -8, allHappy: 2 },
      firehouse: { homeHappy: -8, envyElse: -3, allHappy: -4 },
      hall: { homeHappy: -4, envyElse: -10, allHappy: 3 },
    },
  },

  envy: {
    multiplier: 1, // global envy strength
    oppositeMultiplier: 1.3, // diagonally opposite district
  },

  month: {
    happinessTarget: 35,
    happinessPull: 0.06, // 6 % pull toward target per month
    envyDrift: 1, // "they always find something"
    propagandaDecay: 1,
    affairDecay: 0.5,
  },

  levers: {
    cousin: { cost: 4000, secretMin: 12000, secretMax: 25000, affairMin: 10, affairMax: 18 },
    praise: { cost: 2000, propaganda: 8, decay: 0.75, recovery: 0.1, grumblerEnvy: 2 },
    neighbor: { cost: 2000, envyReduction: 12, decay: 0.75, recovery: 0 },
    snow: { cost: 6000, happiness: -8, secret: 8000, affair: -10 },
    party: { cost: 5000, envyReduction: 20, happiness: 10, decay: 0.75, recovery: 0, duration: 20 },
  },

  mood: {
    envyWeight: 0.7, // score = happiness − 0.7 × envy + propaganda
    supportThreshold: 25,
    greenAbove: 25,
    yellowAbove: 5,
  },

  start: {
    happyMin: 45,
    happyMax: 65,
    envyMin: 10,
    envyMax: 25,
    affairRisk: 5,
  },

  citizens: {
    walkSpeed: 1.1, // tiles per second
    snowSpeedFactor: 0.45,
    homeBias: 0.85, // preference for staying in the home district
    thoughtMin: 5, // seconds between thought changes
    thoughtMax: 9,
    bubbleEvery: 4, // seconds between speech bubbles
    bubbleDuration: 4,
  },
};

export const CONFIG = structuredClone(DEFAULT_CONFIG);

/** Restores every CONFIG value to its default (keeps the same object). */
export function resetConfig() {
  const fresh = structuredClone(DEFAULT_CONFIG);
  const assign = (target, src) => {
    for (const k of Object.keys(src)) {
      if (src[k] && typeof src[k] === 'object') assign(target[k], src[k]);
      else target[k] = src[k];
    }
  };
  assign(CONFIG, fresh);
}

export function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => o[k], obj);
}

export function setByPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}
