// Population, blocks of flats and the factory threshold.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { idx } from '../src/game/map.js';
import { population, households } from '../src/game/population.js';
import { monthlyIncome } from '../src/game/stats.js';

afterEach(restoreRandom);

function finish(game, p) {
  delete game.state.grid[idx(p.x, p.y)].build;
}

test('the municipality starts with 80 residents in 20 households', () => {
  const { state } = newGame();
  assert.equal(households(state), 20);
  assert.equal(population(state), 80);
});

test('houses and flats add residents once built; demolishing removes them', () => {
  const game = newGame();
  const s = game.state;
  const h = findTile(s, 'grass');
  game.act('house', h.x, h.y);
  assert.equal(population(s), 80, 'empty while under scaffolding');
  finish(game, h);
  assert.equal(population(s), 84);
  const f = findTile(s, 'grass');
  game.act('flats', f.x, f.y);
  finish(game, f);
  assert.equal(population(s), 84 + CONFIG.population.flatsHouseholds * CONFIG.population.perHousehold);
  game.act('demolish', h.x, h.y);
  assert.equal(population(s), 80 + CONFIG.population.flatsHouseholds * CONFIG.population.perHousehold);
});

test('tax is paid per household, so a block of flats pays several times', () => {
  const game = newGame();
  const s = game.state;
  const before = monthlyIncome(s).taxes;
  const f = findTile(s, 'grass');
  game.act('flats', f.x, f.y);
  finish(game, f);
  assert.equal(monthlyIncome(s).taxes - before, CONFIG.population.flatsHouseholds * CONFIG.taxes.start);
});

test('a factory needs enough residents', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6; // this test is about workers, not money
  let g = findTile(s, 'grass');
  const refused = game.act('factory', g.x, g.y);
  assert.equal(refused.ok, false);
  assert.match(refused.reason, /120/);
  for (let i = 0; i < 2; i++) {
    const f = findTile(s, 'grass');
    game.act('flats', f.x, f.y);
    finish(game, f);
  }
  assert.ok(population(s) >= CONFIG.population.factoryMin);
  g = findTile(s, 'grass');
  assert.ok(game.act('factory', g.x, g.y).ok);
});

test('support and elections are scaled to the population', async () => {
  const { supportPeople, supportCount } = await import('../src/game/stats.js');
  const { runElection } = await import('../src/game/elections.js');
  const game = newGame();
  const s = game.state;
  assert.equal(supportPeople(s), Math.round((supportCount(s) / 25) * population(s)));
  // A popular mayor: votes add up to the whole population, and more residents mean more votes.
  for (const c of s.citizens) c.happy = 90;
  const small = runElection(s);
  assert.equal(small.mayor + small.opponent, population(s));
  assert.ok(small.won);
  const f = findTile(s, 'grass');
  game.act('flats', f.x, f.y);
  finish(game, f);
  const big = runElection(s);
  assert.ok(big.mayor > small.mayor, 'more residents, more votes');
});

test('a populous district weighs more in the election', async () => {
  const { runElection } = await import('../src/game/elections.js');
  const { districtOf } = await import('../src/game/map.js');
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  // District 0 loves the mayor, everyone else hates him.
  for (const c of s.citizens) c.happy = c.home === 0 ? 100 : 0;
  for (const c of s.citizens) c.envy = c.home === 0 ? 0 : 100;
  assert.equal(runElection(s).won, false, 'one district of four is not enough');
  // Pack district 0 with blocks of flats.
  for (let i = 0; i < 8; i++) {
    const g = findTile(s, 'grass', (x, y) => districtOf(x, y) === 0);
    if (!g) break;
    game.act('flats', g.x, g.y);
    finish(game, g);
  }
  assert.equal(runElection(s).won, true, 'now that district outweighs the rest');
});
