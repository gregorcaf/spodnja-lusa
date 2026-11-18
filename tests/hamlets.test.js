// Expanding the municipality: buying plots, new hamlets, building there, saves.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile, FakeStorage } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { PLOTS, idx, districtOf, isOwned, activeDistricts, SIZE, CORE } from '../src/game/map.js';
import { hamletPrice } from '../src/game/hamlets.js';
import { districtStats } from '../src/game/stats.js';
import { population, districtPopulation } from '../src/game/population.js';
import { runElection } from '../src/game/elections.js';
import { saveGame, loadGame, deserialize } from '../src/game/save.js';
import { BUILD_ERRORS } from '../src/game/texts.js';

afterEach(restoreRandom);

test('the plots around the municipality are not ours until bought', () => {
  const game = newGame();
  const s = game.state;
  const p = PLOTS[0];
  assert.equal(isOwned(s, p.x + 1, p.y + 1), false);
  const res = game.act('house', p.x + 1, p.y + 1);
  assert.equal(res.ok, false);
  assert.equal(res.reason, BUILD_ERRORS.notOwned);
  assert.equal(activeDistricts(s).length, 4);
});

test('buying a plot creates a hamlet with roads and newcomers', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  const p = PLOTS[2];
  const price = hamletPrice(s);
  const citizensBefore = s.citizens.length;
  const res = game.buyHamlet(p.id);
  assert.ok(res.ok);
  assert.equal(s.budget, 1e6 - price);
  assert.ok(isOwned(s, p.x, p.y));
  assert.equal(activeDistricts(s).length, 5);
  for (const [x, y] of p.roads) assert.equal(s.grid[idx(x, y)].type, 'road');
  assert.equal(s.citizens.length, citizensBefore + CONFIG.hamlets.newCitizens);
  assert.ok(s.citizens.slice(citizensBefore).every((c) => c.home === p.id && !/[{}]/.test(c.thought)));
  assert.ok(districtStats(s).some((d) => d.district.id === p.id));
  assert.equal(game.buyHamlet(p.id).ok, false, 'not twice');
  assert.ok(hamletPrice(s) > price, 'the next plot costs more');
});

test('the hamlet road connects to the core road network', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e8; // enough for all eight plots
  for (const p of PLOTS) assert.ok(game.buyHamlet(p.id).ok);
  // BFS over roads from the core crossroads must reach every plot.
  const seen = new Set([idx(15, 15)]);
  const queue = [[15, 15]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || seen.has(idx(nx, ny))) continue;
      if (!['road', 'roundabout'].includes(s.grid[idx(nx, ny)].type)) continue;
      seen.add(idx(nx, ny));
      queue.push([nx, ny]);
    }
  }
  for (const p of PLOTS) assert.ok(p.roads.every(([x, y]) => seen.has(idx(x, y))), `plot ${p.id} is reachable`);
});

test('houses in a hamlet count for population and the election', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  const p = PLOTS[5];
  game.buyHamlet(p.id);
  for (let i = 0; i < 4; i++) {
    const g = findTile(s, 'grass', (x, y) => districtOf(x, y) === p.id);
    game.act('house', g.x, g.y);
    delete s.grid[idx(g.x, g.y)].build;
  }
  assert.equal(districtPopulation(s)[p.id], 16);
  assert.equal(population(s), 96);
  const e = runElection(s);
  assert.ok(e.districts.some((d) => d.id === p.id && d.mayor + d.opponent === 16));
});

test('hamlets are saved, and old 16×16 saves are moved into the big map', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e6;
  game.buyHamlet(PLOTS[0].id);
  const storage = new FakeStorage();
  saveGame(storage, s);
  assert.deepEqual(loadGame(storage).hamlets, [PLOTS[0].id]);

  // A save from before the expansion: 16×16 grid, church at (6, 6).
  const old = JSON.parse(JSON.stringify(s));
  old.grid = Array.from({ length: 256 }, (_, i) => s.grid[idx((i % 16) + CORE, Math.floor(i / 16) + CORE)]);
  delete old.hamlets;
  const migrated = deserialize(JSON.stringify({ version: 1, state: old }));
  assert.equal(migrated.grid.length, SIZE * SIZE);
  assert.equal(migrated.grid[idx(6 + CORE, 6 + CORE)].type, 'church');
  assert.deepEqual(migrated.hamlets, []);
});
