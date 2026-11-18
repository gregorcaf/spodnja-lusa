// Road access: buildings only work when they touch a road connected to the main roads.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { idx, CORE } from '../src/game/map.js';
import { roadNetwork, hasRoadAccess, disconnectedBuildings } from '../src/game/roads.js';
import { population } from '../src/game/population.js';
import { monthlyIncome } from '../src/game/stats.js';
import { LEVER_ERRORS } from '../src/game/texts.js';

afterEach(restoreRandom);

const finish = (game, p) => delete game.state.grid[idx(p.x, p.y)].build;

/** A meadow tile two steps away from any road (so a single road tile can connect it). */
function remoteMeadow(state) {
  const net = roadNetwork(state);
  return findTile(state, 'grass', (x, y) => !hasRoadAccess(state, x, y, net), { anywhere: true });
}

test('at the start every building has road access', () => {
  const { state } = newGame();
  assert.deepEqual(disconnectedBuildings(state), []);
});

test('a house without a road stays empty until a road reaches it', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  // Pick a meadow tile whose neighbour does touch the network, so one road tile connects it.
  const net = roadNetwork(s);
  const spot = findTile(
    s,
    'grass',
    (x, y) => !hasRoadAccess(s, x, y, net) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.grid[idx(x + dx, y + dy)]?.type === 'grass' && hasRoadAccess(s, x + dx, y + dy, net)),
    { anywhere: true },
  );
  assert.ok(spot);
  const before = population(s);
  game.act('house', spot.x, spot.y);
  finish(game, spot);
  assert.equal(population(s), before, 'nobody moves in');
  assert.equal(disconnectedBuildings(s).length, 1);
  // Build the connecting road tile.
  const link = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: spot.x + dx, y: spot.y + dy }))
    .find((p) => s.grid[idx(p.x, p.y)]?.type === 'grass' && hasRoadAccess(s, p.x, p.y));
  game.act('road', link.x, link.y);
  assert.equal(population(s), before + CONFIG.population.perHousehold, 'now they move in');
  assert.deepEqual(disconnectedBuildings(s), []);
});

test('cutting a road cuts off the buildings behind it', () => {
  const game = newGame();
  const s = game.state;
  // Zgornja vas side street (core row y=3, x 1–6) joins the main road at x=6; houses hang off it.
  const before = population(s);
  game.act('demolish', CORE + 6, CORE + 3);
  assert.ok(disconnectedBuildings(s).length > 0, 'some houses lost their road');
  assert.ok(population(s) < before, 'and their residents');
});

test('a factory with no road earns nothing', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  CONFIG.population.factoryMin = 0;
  const base = monthlyIncome(s).business;
  const spot = remoteMeadow(s);
  game.act('factory', spot.x, spot.y);
  assert.equal(monthlyIncome(s).business, base);
});

test('a fire station with no road cannot host a party', () => {
  const game = newGame();
  const s = game.state;
  const spot = remoteMeadow(s);
  game.act('firehouse', spot.x, spot.y);
  assert.equal(game.useLever('party').reason, LEVER_ERRORS.firehouseNoRoad);
});
