// All tunable game numbers in one place.
// CONFIG is a live object: game logic reads it on every action, the dev panel mutates it.

export const DEFAULT_CONFIG = {
  // Population comes from housing: a house is 1 household, a block of flats several.
  population: {
    perHousehold: 4, // residents per household
    flatsHouseholds: 5, // households in one block of flats
    towerHouseholds: 12, // households in one tower block
    factoryMin: 120, // a factory needs workers
    extraWalkerEvery: 25, // one extra (anonymous) walker per this many new residents
    maxExtraWalkers: 12, // the streets should feel alive, not crowded
  },

  // Household tax, set by the player in the sidebar.
  taxes: {
    start: 300, // € per household per month at the start
    neutral: 300, // at this rate the tax doesn't change happiness
    step: 50,
    min: 0,
    max: 1000,
    happyPer100: 1.5, // monthly happiness −1,5 for every 100 € above neutral (+ below)
    lowBelow: 150, // "low" tax: happy thoughts
    highAt: 450, // "high" tax: angry thoughts
    veryHighAt: 600, // "very high": angry news, extra envy, bigger protests
    veryHighEnvy: 1, // extra monthly envy ("in Žlampe it's cheaper")
    protestBoost: 15, // more citizens join a protest when the tax is very high
  },

  economy: {
    startBudget: 150000,
    baseIncome: 6000, // € per month
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
    // Block of flats: many households (= lots of tax), but the neighbours don't like it.
    flats: { cost: 45000, upkeep: 200, homeHappy: -3, envyElse: 1, allHappy: 0 },
    // Tower block: even more households, and the whole district lives in its shadow.
    tower: { cost: 100000, upkeep: 500, homeHappy: -6, envyElse: 2, allHappy: 0 },
    // Public services: each has its own rule (see services.js).
    clinic: { cost: 90000, upkeep: 1500, homeHappy: 6, envyElse: 1, allHappy: 4 }, // everyone uses it: hardly any envy
    police: { cost: 50000, upkeep: 1200, income: 600, homeHappy: -2, envyElse: 2, allHappy: 0 }, // fines bring a little money
    shop: { cost: 20000, upkeep: 0, income: 500, homeHappy: 5, envyElse: 2, allHappy: 0 },
    vineyard: { cost: 15000, upkeep: 100, homeHappy: 3, envyElse: 2, allHappy: 0 },
    cemetery: { cost: 25000, upkeep: 300, homeHappy: -5, envyElse: -3, allHappy: 0 }, // the others are glad it isn't theirs
    // Education ladder (see education.js): each step needs the previous one.
    kindergarten: { cost: 30000, upkeep: 400, homeHappy: 6, envyElse: 3, allHappy: 0 },
    school: { cost: 70000, upkeep: 900, homeHappy: 7, envyElse: 4, allHappy: 1 },
    highschool: { cost: 110000, upkeep: 1500, homeHappy: 6, envyElse: 6, allHappy: 1 },
    faculty: { cost: 180000, upkeep: 2500, homeHappy: 8, envyElse: 8, allHappy: 2 },
  },

  // Education: the higher the highest working step, the more each household brings in.
  education: {
    minPop: { kindergarten: 60, school: 100, highschool: 180, faculty: 280 },
    perHousehold: [0, 15, 40, 80, 140], // € per household per month, by level 0–4
  },

  // Special rules of the public buildings.
  services: {
    clinicMin: 160, // residents needed before a doctor agrees to come
    clinicMonthlyHappy: 1, // everyone, every month, while a clinic works (more clinics don't add up)
    policeVandalismShare: 0.5, // protest vandalism costs only this share with a police station
    shopMonthlyHappy: 0.5, // residents of a district with a shop ("no need to drive to town")
    vineyardHarvest: 8000, // € per vineyard at the end of September
    vineyardHarvestAffair: 1.5, // per vineyard: "wine tastings" with the right people
    vineyardPartyBonus: 0.15, // the party works this much better per vineyard …
    vineyardPartyMax: 3, // … counting at most this many
    cemeteryNeededAt: 140, // residents: from here on, a municipality without a cemetery grumbles
    cemeteryMissingHappy: -1.5, // monthly, for everyone, while there is none
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
      flats: { homeHappy: 2, envyElse: -1, allHappy: 0 }, // the neighbours get their view back
      tower: { homeHappy: 5, envyElse: -1, allHappy: 0 }, // the sun is back
      clinic: { homeHappy: -8, envyElse: 0, allHappy: -4 },
      police: { homeHappy: 2, envyElse: -1, allHappy: 0 }, // nobody misses the radar
      shop: { homeHappy: -6, envyElse: -1, allHappy: 0 },
      vineyard: { homeHappy: -4, envyElse: -1, allHappy: 0 },
      cemetery: { homeHappy: 4, envyElse: 3, allHappy: -2 }, // relief at home, worry everywhere else
      kindergarten: { homeHappy: -6, envyElse: -1, allHappy: -1 },
      school: { homeHappy: -8, envyElse: -2, allHappy: -2 },
      highschool: { homeHappy: -6, envyElse: -3, allHappy: -2 },
      faculty: { homeHappy: -6, envyElse: -4, allHappy: -3 },
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
    // perMonth: tenders per month; each one pays less (decay), the affair risk stays the same.
    cousin: { cost: 4000, secretMin: 12000, secretMax: 25000, affairMin: 10, affairMax: 18, perMonth: 2, decay: 0.8, recovery: 0.1 },
    praise: { cost: 2000, propaganda: 8, decay: 0.75, recovery: 0.1, grumblerEnvy: 2 },
    // Slow recovery: a renewable (but weak) tool against envy, which grows every month.
    neighbor: { cost: 2000, envyReduction: 12, decay: 0.75, recovery: 0.03 },
    snow: { cost: 6000, happiness: -8, secret: 8000, affair: -10 },
    // affair: flat change of the affair risk (not weakened by repeated use)
    // The party is fun, but weaker than it used to be – and alcohol has consequences (see partyIncidents.js).
    party: {
      cost: 5000,
      envyReduction: 10,
      happiness: 6,
      affair: -5,
      decay: 0.75,
      recovery: 0.03,
      duration: 20,
      drunkMin: 6, // citizens drunk after the party
      drunkMax: 9,
      drunkSeconds: 35,
      incidentChance: 0.5,
      brawlHappy: 10,
      brawlEnvy: 6,
      brawlCost: 800,
      photoPropaganda: 4,
      photoAffair: 4,
      hangoverCost: 1500,
    },
    // Paid from the secret account, not the budget.
    media: { cost: 15000, affair: -20, decay: 0.75, recovery: 0.1 },
    // Paid from the secret account: a gamble that may bring a state grant into the budget.
    minister: { cost: 40000, payout: 70000, chance: 0.7, delay: 2 },
    // Once a year: the whole municipality celebrates together.
    holiday: { cost: 10000, envyReduction: 15, happiness: 4, propaganda: 3, cooldown: 12, duration: 16 },
    // Firefighting contest against Zgornje Žlampe: envy turns outward, the result is a gamble.
    contest: {
      cost: 3000,
      duration: 14, // seconds the contest is shown on the map
      envyReduction: 8,
      decay: 0.75,
      recovery: 0.05,
      winBase: 0.35, // win chance with one firehouse …
      winPerFirehouse: 0.1, // … plus this per extra working firehouse
      winMax: 0.75,
      winHappy: 5,
      winPropaganda: 3,
      loseHappy: -2,
      brawlChance: 0.15, // a fight with the Žlampe team
      brawlAffair: 4,
      brawlCost: 1500,
    },
    // Town-hall meeting in the most envious district: envy drops there, but someone wants something.
    assembly: { cost: 1000, envyReduction: 20, happiness: 2, cooldown: 3, duration: 12 },
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
    // Unhappiness alone also brings people onto the street (support = citizens on the mayor's side, of 25).
    // Shares of the named citizens on the mayor's side (the sample grows with every hamlet).
    // (Simulated: at 32 %/16 % even an active mayor got 10/30 early elections; at 24 %/12 % about 2/30.)
    supportProtestAtMost: 0.24,
    supportRiotAtMost: 0.12,
    noConfidenceMonths: 3, // riot months in a row before the council calls early elections
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
    bubbleEvery: 26, // seconds of quiet between speech bubbles (one every ~30 s; one villager speaks at a time)
    bubbleDuration: 4,
  },

  // New buildings: scaffolding first, then an opening ceremony waiting for the mayor.
  construction: {
    months: {
      house: 0.12, roundabout: 0.3, firehouse: 0.3, hall: 0.45, inn: 0.25, factory: 0.4, flats: 0.35, tower: 0.55,
      clinic: 0.45, police: 0.3, shop: 0.2, vineyard: 0.15, cemetery: 0.2,
      kindergarten: 0.25, school: 0.4, highschool: 0.45, faculty: 0.6,
    },
    ribbonWindow: 0.7, // game-months the ribbon waits for the mayor
    ribbonPropaganda: { roundabout: 4, firehouse: 3, hall: 5, inn: 2, factory: 3, flats: 2, tower: 3, clinic: 5, police: 2, shop: 2, vineyard: 1, cemetery: 1, kindergarten: 2, school: 3, highschool: 3, faculty: 5 },
    ribbonDistrictHappy: 3,
    missedDistrictHappy: -2,
  },

  // The mayor walking on the map.
  mayor: {
    walkSpeed: 2.6, // tiles per second at 1× (he hurries)
    reach: 1.3, // tiles: close enough to shake hands, cut a ribbon or deal with an event
    shakeHappy: 4,
    shakeEnvy: -2,
    shakeCooldown: 3, // months before the same citizen is impressed again
    campaignShakePropaganda: 1,
    listenWishChance: 0.35, // listening sometimes turns into a wish
    listenHappy: 2,
  },

  // Buying land around the municipality: each plot becomes a new hamlet ("zaselek").
  hamlets: {
    basePrice: 80000,
    priceStep: 40000, // each next plot costs this much more
    newCitizens: 3, // named citizens moving in with the first families
    othersEnvy: 3, // the old quarters are a bit jealous of all the attention
  },

  // Live events on the map (bear, tractor, wedding, fire, journalist).
  mapEvents: {
    minMonths: 0.8, // game-months between events
    maxMonths: 1.4,
    durationScale: 1, // how long an event waits for a click (1 = default per event, ~12–18 s at 1×)
  },

  // Anti-corruption investigation (KPK): a special card when the mayor gets greedy.
  kpk: {
    affairAtLeast: 60, // triggers when the affair risk is this high …
    secretAtLeast: 50000, // … or the secret account this full
    monthlyChance: 0.25,
    cooldownMonths: 12, // at most one investigation a year
  },

  dilemmas: {
    minMonths: 5, // game-months between dilemma cards (about every 2.5–3.5 minutes at 1×)
    maxMonths: 7,
    firstAfter: [2.5, 3.5], // the first card comes after this many months
  },

  elections: {
    termMonths: 48, // a term lasts 4 years
    campaignMonths: 3, // campaign before the vote
    campaignPraiseBoost: 1.5, // "Hvalospevi" work better during the campaign
    // Winning needs more than half of all votes (districts weighted by population).
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
    everyMonths: 3.5, // game-months between new wishes (about one every 1¾ minutes at 1×)
    maxActive: 2, // open wishes at the same time
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
