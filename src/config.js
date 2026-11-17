// All tunable game numbers in one place.
// CONFIG is a live object: game logic reads it on every action, the dev panel mutates it.

export const DEFAULT_CONFIG = {
  economy: {
    startBudget: 150000,
    baseIncome: 6000, // € per month
    taxPerHouse: 300, // € per house per month
    baseCost: 7000, // salaries and coffee for the municipal office
  },

  // Cost, monthly upkeep, monthly income and construction effects
  buildings: {
    road: { cost: 2000, upkeep: 30, homeHappy: 2, envyElse: 1, allHappy: 0 },
    house: { cost: 10000, upkeep: 0, homeHappy: 3, envyElse: 2, allHappy: 0 },
    roundabout: { cost: 60000, upkeep: 500, homeHappy: 15, envyElse: 12, allHappy: 3 },
    firehouse: { cost: 35000, upkeep: 1000, homeHappy: 6, envyElse: 4, allHappy: 6 },
    hall: { cost: 140000, upkeep: 3000, homeHappy: 10, envyElse: 15, allHappy: -3 },
    // Income buildings: they earn money every month, with a catch.
    inn: { cost: 25000, upkeep: 0, income: 800, homeHappy: 8, envyElse: 4, allHappy: 0 },
    factory: { cost: 80000, upkeep: 0, income: 3000, homeHappy: -6, envyElse: 5, allHappy: 0 },
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
      inn: { homeHappy: -8, envyElse: -2, allHappy: 0 },
      factory: { homeHappy: 6, envyElse: -3, allHappy: 0 }, // the neighbours finally breathe
    },
  },

  envy: {
    multiplier: 1, // global envy strength
    oppositeMultiplier: 1.3, // diagonally opposite district
  },

  month: {
    // "Hard" difficulty: even a good mayor loses support over a term and must win it back.
    happinessTarget: 30,
    happinessPull: 0.08, // 8 % pull toward target per month
    envyDrift: 2, // "they always find something"
    propagandaDecay: 1,
    affairDecay: 0.5,
  },

  levers: {
    cousin: { cost: 4000, secretMin: 12000, secretMax: 25000, affairMin: 10, affairMax: 18 },
    praise: { cost: 2000, propaganda: 8, decay: 0.75, recovery: 0.1, grumblerEnvy: 2 },
    neighbor: { cost: 2000, envyReduction: 12, decay: 0.75, recovery: 0 },
    snow: { cost: 6000, happiness: -8, secret: 8000, affair: -10 },
    // affair: flat change of the affair risk (not weakened by repeated use)
    party: { cost: 5000, envyReduction: 20, happiness: 10, affair: -5, decay: 0.75, recovery: 0, duration: 20 },
    // Paid from the secret account, not the budget.
    media: { cost: 15000, affair: -20, decay: 0.75, recovery: 0.1 },
    // Paid from the secret account: a gamble that may bring a state grant into the budget.
    minister: { cost: 40000, payout: 70000, chance: 0.7, delay: 2 },
  },

  time: {
    secondsPerMonth: 30, // real seconds per in-game month at 1× speed
  },

  // Consequences of a high affair risk.
  unrest: {
    protestAt: 50, // affair risk % where protests start
    riotAt: 80, // affair risk % where protests turn into riots
    protestHappy: -3, // monthly happiness change for everyone during unrest
    riotHappy: -6,
    taxStrike: 0.3, // share of house taxes not paid during unrest
    riotRepairCost: 8000, // € per building burned in a riot month
    protestVandalism: 2000, // € per protest month (graffiti, broken benches)
    protestDamageChance: 0.35, // chance per protest month to topple a statue or tear up a road
    extraAffairDecay: 3, // media lose interest faster during unrest
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

  dilemmas: {
    minMonths: 1, // game-months between dilemma cards
    maxMonths: 2,
  },

  elections: {
    termMonths: 48, // a term lasts 4 years
    campaignMonths: 3, // campaign before the vote
    campaignPraiseBoost: 1.5, // "Hvalospevi" work better during the campaign
    votesToWin: 13, // of 25
    envyDriftPerTerm: 0.5, // every new term people expect more
    recountCost: 30000, // € from the secret account
    recountChance: 0.5,
    recountAffair: 30,
    // Buying votes (secret account, campaign only). Each next vote in a campaign costs more.
    voteBaseCost: 8000,
    voteCostStep: 2000,
    voteAffair: 5,
    // Bribing the opponent: expensive, may be refused, may leak.
    bribeCost: 80000,
    bribeChance: 0.5,
    bribeRefuseAffair: 30,
    bribeLeakChance: 0.3,
    bribeLeakAffair: 25,
  },

  wishes: {
    everyMonths: 0.8, // game-months between new wishes
    maxActive: 3,
    deadlineMonths: 3,
    fulfillHappy: 15,
    fulfillEnvy: -5,
    loyalMonths: 12, // fulfilled wish = loyal voter for this long
    loyalBonus: 15, // added to the mood score of loyal citizens
    ignoreEnvy: 10,
    ignoreHappy: -5,
    grudgeMonths: 6,
    // Paying a wish "iz svojega žepa" (secret account) instead of the budget.
    secretPropaganda: 3,
    secretAffair: 3,
  },

  // Envelopes for loyalty, any time of the year (secret account).
  loyalty: {
    baseCost: 10000,
    costStep: 2000, // each next envelope in the same year costs more
    affair: 5,
  },

  audio: {
    musicVolume: 0.35,
    tempo: 126, // quarter notes per minute (polka in 2/4)
    sfxVolume: 0.5, // sound effects
    ambientVolume: 0.35, // protest chants and riot fire
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
