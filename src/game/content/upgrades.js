// Building upgrades (Slovenian player-facing text). Two per building type, each bought once per building.
//
// Fields: id, name, desc, cost, effect (applied once, in the building's district – see effects.js),
//   monthly: +income / −upkeep per month from then on, decor: visual change on the map (render/models.js).

export const UPGRADES = {
  house: [
    { id: 'facade', name: 'Nova fasada', desc: 'Sveže prepleskana hiša. Sosedje bodo morali tudi.', cost: 2000, effect: { districtHappy: 2, othersEnvy: 1 }, decor: 'facade' },
    { id: 'flowers', name: 'Cvetlična korita', desc: 'Pelargonije na oknih. Slovenski standard.', cost: 500, effect: { districtHappy: 1 }, decor: 'flowers' },
  ],
  roundabout: [
    { id: 'statue', name: 'Večji kip', desc: 'Kip je dvakrat višji. Podobnost z županom je naključna.', cost: 8000, effect: { districtHappy: 4, propaganda: 2, othersEnvy: 3 }, decor: 'bigStatue' },
    { id: 'fountain', name: 'Fontana', desc: 'Voda, ki teče v krogu. Kot promet.', cost: 12000, effect: { districtHappy: 5, happy: 1 }, monthly: -200, decor: 'fountain' },
  ],
  firehouse: [
    { id: 'tanker', name: 'Nova cisterna', desc: 'Sijoča, rdeča in pripravljena na vse. Predvsem na parado.', cost: 15000, effect: { happy: 4 }, decor: 'tanker' },
    { id: 'tent', name: 'Stalni šotor', desc: 'Šotor za veselice, ki se nikoli ne podre. Tudi ko bi se moral.', cost: 6000, effect: { districtHappy: 3 }, monthly: 300, decor: 'tent' },
  ],
  hall: [
    { id: 'gym', name: 'Fitnes v dvorani', desc: 'Dvorana je končno dobila namen. Članarina je obvezna.', cost: 10000, effect: { districtHappy: 3 }, monthly: 600, decor: 'banner' },
    { id: 'aircon', name: 'Klimatska naprava', desc: 'Poleti hladno, pozimi tudi.', cost: 5000, effect: { districtHappy: 2 }, monthly: -100, decor: 'aircon' },
  ],
  inn: [
    { id: 'linden', name: 'Vrt z lipo', desc: 'Senca, klopi in debate o politiki do treh zjutraj.', cost: 4000, effect: { districtHappy: 3 }, monthly: 300, decor: 'linden' },
    { id: 'band', name: 'Ansambel ob petkih', desc: 'V živo, glasno in z istim repertoarjem kot leta 1994.', cost: 3000, effect: { happy: 2 }, monthly: 200, decor: 'speaker' },
  ],
  factory: [
    { id: 'filter', name: 'Filter na dimniku', desc: 'Ni več smradu. Sosedje ne vedo, kaj bi zdaj počeli.', cost: 12000, effect: { districtHappy: 8 }, monthly: -500, decor: 'filter' },
    { id: 'line', name: 'Nova proizvodna linija', desc: 'Več izdelkov, več denarja, več dima.', cost: 20000, effect: { districtHappy: -4, othersEnvy: 3 }, monthly: 2000, decor: 'annex' },
  ],
  church: [
    { id: 'tower', name: 'Obnova zvonika', desc: 'Zvonik zasije. Župnik v pridigi omeni župana.', cost: 6000, effect: { happy: 3, propaganda: 2 }, decor: 'goldTower' },
    { id: 'lights', name: 'Osvetlitev cerkve', desc: 'Ponoči jo vidijo celo v Zgornjih Žlampah. Prav.', cost: 4000, effect: { happy: 2, envy: -2 }, monthly: -100, decor: 'spotlight' },
  ],
};
