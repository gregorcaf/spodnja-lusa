// Public buildings with their own rules: clinic, police, shop, vineyard and cemetery.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { idx, districtOf } from '../src/game/map.js';
import { population } from '../src/game/population.js';
import { monthlyIncome } from '../src/game/stats.js';
import { applyMonthlyUnrest, BURNABLE } from '../src/game/unrest.js';
import { applyMonthlyServices, cemeteryMissing, partyWineBonus } from '../src/game/services.js';
import { useLever } from '../src/game/levers.js';

afterEach(restoreRandom);

/** Builds `type` next to a road in `district` (or anywhere) and opens it at once. */
function place(game, type, district = null) {
  const s = game.state;
  s.budget = Math.max(s.budget, 1e7);
  const p = findTile(s, 'grass', (x, y) => district == null || districtOf(x, y) === district);
  const res = game.act(type, p.x, p.y);
  assert.ok(res.ok, `${type}: ${res.reason}`);
  delete s.grid[idx(p.x, p.y)].build;
  return p;
}

/** Adds finished blocks of flats until the population reaches `n`. */
function growTo(game, n) {
  while (population(game.state) < n) place(game, 'flats');
}

const avgHappy = (s) => s.citizens.reduce((a, c) => a + c.happy, 0) / s.citizens.length;

test('a clinic needs enough residents', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  const p = findTile(s, 'grass');
  assert.equal(game.act('clinic', p.x, p.y).ok, false);
  growTo(game, CONFIG.services.clinicMin);
  const q = findTile(s, 'grass');
  assert.equal(game.act('clinic', q.x, q.y).ok, true);
});

test('a working clinic lifts everyone a little every month', () => {
  const game = newGame();
  const s = game.state;
  growTo(game, CONFIG.services.clinicMin);
  place(game, 'cemetery'); // keep the "no cemetery" grumbling out of this test
  for (const c of s.citizens) c.happy = 50;
  applyMonthlyServices(s);
  assert.equal(avgHappy(s), 50);
  place(game, 'clinic');
  for (const c of s.citizens) c.happy = 50;
  applyMonthlyServices(s);
  assert.equal(avgHappy(s), 50 + CONFIG.services.clinicMonthlyHappy);
});

test('riots burn nothing where a police station stands', () => {
  const game = newGame();
  const s = game.state;
  for (const d of [0, 1, 2, 3]) place(game, 'police', d);
  s.unrest = 'riot';
  const burnable = () => s.grid.filter((t) => BURNABLE.includes(t.type)).length;
  const before = burnable();
  for (let i = 0; i < 10; i++) {
    const { damage } = applyMonthlyUnrest(s);
    assert.equal(damage.type, null);
    assert.equal(damage.cost, 0);
    assert.match(damage.news, /Policija/);
  }
  assert.equal(burnable(), before);
});

test('police halves the cost of protest vandalism', () => {
  const game = newGame();
  const s = game.state;
  s.unrest = 'protest';
  const without = applyMonthlyUnrest(s).damage.cost;
  place(game, 'police');
  s.unrest = 'protest'; // building re-checks the unrest level
  const withPolice = applyMonthlyUnrest(s).damage.cost;
  assert.equal(without, CONFIG.unrest.protestVandalism);
  assert.equal(withPolice, Math.round(CONFIG.unrest.protestVandalism * CONFIG.services.policeVandalismShare));
});

test('a shop cheers up its own district every month', () => {
  const game = newGame();
  const s = game.state;
  const p = place(game, 'shop', 0);
  for (const c of s.citizens) c.happy = 50;
  applyMonthlyServices(s);
  const home = s.citizens.filter((c) => c.home === districtOf(p.x, p.y));
  const others = s.citizens.filter((c) => c.home !== districtOf(p.x, p.y));
  assert.ok(home.every((c) => c.happy === 50 + CONFIG.services.shopMonthlyHappy));
  assert.ok(others.every((c) => c.happy === 50));
});

test('vineyards pay out at the September harvest only, and raise the affair risk', () => {
  const game = newGame();
  const s = game.state;
  place(game, 'vineyard');
  place(game, 'vineyard');
  s.month = 5;
  assert.equal(monthlyIncome(s).harvest, 0);
  s.month = 8;
  assert.equal(monthlyIncome(s).harvest, 2 * CONFIG.services.vineyardHarvest);
  const affair = s.affair;
  const news = applyMonthlyServices(s);
  assert.equal(s.affair, affair + 2 * CONFIG.services.vineyardHarvestAffair);
  assert.ok(news.some((n) => /Trgatev|trgatev/.test(n)));
});

test('local wine makes the party stronger (up to a limit)', () => {
  const game = newGame();
  const s = game.state;
  assert.equal(partyWineBonus(s), 1);
  place(game, 'firehouse'); // the party needs a fire station
  for (let i = 0; i < 5; i++) place(game, 'vineyard');
  const max = 1 + CONFIG.services.vineyardPartyMax * CONFIG.services.vineyardPartyBonus;
  assert.equal(partyWineBonus(s), max);
  for (const c of s.citizens) c.happy = 40;
  assert.ok(useLever(s, 'party').ok);
  assert.ok(Math.abs(avgHappy(s) - (40 + CONFIG.levers.party.happiness * max)) < 1e-9);
});

test('a big municipality without a cemetery grumbles until it gets one', () => {
  const game = newGame();
  const s = game.state;
  assert.equal(cemeteryMissing(s), false, 'small villages don’t mind yet');
  growTo(game, CONFIG.services.cemeteryNeededAt);
  assert.equal(cemeteryMissing(s), true);
  for (const c of s.citizens) c.happy = 50;
  applyMonthlyServices(s);
  assert.equal(avgHappy(s), 50 + CONFIG.services.cemeteryMissingHappy);
  place(game, 'cemetery');
  assert.equal(cemeteryMissing(s), false);
});

test('a cemetery makes its own district sad and the others relieved', () => {
  const game = newGame();
  const s = game.state;
  for (const c of s.citizens) {
    c.happy = 50;
    c.envy = 30;
  }
  const p = place(game, 'cemetery', 0);
  const home = districtOf(p.x, p.y);
  const b = CONFIG.buildings.cemetery;
  for (const c of s.citizens) {
    if (c.home === home) assert.equal(c.happy, 50 + b.homeHappy);
    else assert.ok(c.envy < 30, 'others are relieved');
  }
});

test('the education ladder: each step needs the previous one and enough residents', async () => {
  const { educationLevel, educationIncome } = await import('../src/game/education.js');
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  const p = findTile(s, 'grass');
  // A school without a kindergarten: no.
  assert.equal(game.act('school', p.x, p.y).ok, false);
  growTo(game, CONFIG.education.minPop.faculty);
  assert.equal(educationIncome(s), 0);
  for (const type of ['kindergarten', 'school', 'highschool', 'faculty']) place(game, type);
  assert.equal(educationLevel(s), 4);
  // The higher the education, the more each household brings in.
  const inc = monthlyIncome(s);
  assert.ok(inc.education > 0);
  assert.equal(inc.education, CONFIG.education.perHousehold[4] * inc.houses);
});

test('a road dragged across the map is one L-shaped stretch, existing roads are skipped', async () => {
  const { roadPath } = await import('../src/game/roads.js');
  const path = roadPath({ x: 2, y: 2 }, { x: 5, y: 3 });
  assert.deepEqual(path, [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 3 }]);
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  const a = findTile(s, 'grass');
  const before = s.budget;
  const res = game.actMany('road', [a, a]); // the second tile is already road by then
  assert.equal(res.built, 1);
  assert.equal(before - s.budget, CONFIG.buildings.road.cost);
  // Without money the stretch stops.
  s.budget = 0;
  const b = findTile(s, 'grass');
  assert.equal(game.actMany('road', [b]).ok, false);
});
