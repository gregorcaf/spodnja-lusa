// Core rules: initial map, building, envy, the monthly turn.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, tileType, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { districtOf, oppositeOf } from '../src/game/map.js';
import { monthlyIncome, monthlyExpenses, countTiles } from '../src/game/stats.js';
import { BUILD_ERRORS } from '../src/game/texts.js';

afterEach(restoreRandom);

test('initial municipality matches the spec', () => {
  const { state } = newGame();
  assert.equal(state.citizens.length, 25);
  assert.equal(countTiles(state, 'house'), 20);
  assert.equal(countTiles(state, 'church'), 1);
  assert.equal(state.budget, 150000);
  assert.deepEqual([state.month, state.year], [3, 2026]); // April 2026
  for (const d of [0, 1, 2, 3]) assert.ok(state.citizens.some((c) => c.home === d), `district ${d} has citizens`);
});

test('roundabouts only go on roads, buildings only on meadow, the church stays', () => {
  const game = newGame();
  const grass = findTile(game.state, 'grass');
  const road = findTile(game.state, 'road');
  const church = findTile(game.state, 'church');
  assert.equal(game.act('roundabout', grass.x, grass.y).reason, BUILD_ERRORS.roundaboutNeedsRoad);
  assert.equal(game.act('house', road.x, road.y).reason, BUILD_ERRORS.occupied);
  assert.equal(game.act('demolish', church.x, church.y).reason, BUILD_ERRORS.demolishChurch);
  assert.ok(game.act('roundabout', road.x, road.y).ok);
  assert.equal(tileType(game.state, road.x, road.y), 'roundabout');
  assert.equal(game.state.budget, 150000 - CONFIG.buildings.roundabout.cost);
});

test('building makes the home district happy and the others envious (opposite ×1.3)', () => {
  const game = newGame();
  const s = game.state;
  const spot = findTile(s, 'grass', (x, y) => districtOf(x, y) === 0);
  const before = s.citizens.map((c) => ({ happy: c.happy, envy: c.envy }));
  game.act('house', spot.x, spot.y);
  const b = CONFIG.buildings.house;
  for (const c of s.citizens) {
    const old = before[c.id];
    if (c.home === 0) assert.ok(Math.abs(c.happy - Math.min(100, old.happy + b.homeHappy)) < 1e-9);
    else {
      const factor = c.home === oppositeOf(0) ? CONFIG.envy.oppositeMultiplier : 1;
      assert.ok(Math.abs(c.envy - Math.min(100, old.envy + b.envyElse * factor)) < 1e-9, `${c.name} envy`);
    }
  }
});

test('one month: income, expenses and the slow drift of moods', () => {
  const game = newGame();
  const s = game.state;
  const income = monthlyIncome(s).total;
  const expenses = monthlyExpenses(s).total;
  const envyBefore = s.citizens[0].envy;
  const happyBefore = s.citizens[0].happy;
  const report = game.nextMonth();
  assert.equal(report.balance, income - expenses);
  assert.equal(s.budget, 150000 + income - expenses);
  assert.equal(s.month, 4);
  const m = CONFIG.month;
  assert.ok(Math.abs(s.citizens[0].envy - Math.min(100, envyBefore + m.envyDrift)) < 1e-9);
  const expectedHappy = happyBefore + (m.happinessTarget - happyBefore) * m.happinessPull;
  assert.ok(Math.abs(s.citizens[0].happy - expectedHappy) < 1e-9);
});

test('inns and factories earn money every month', () => {
  const game = newGame();
  const s = game.state;
  const base = monthlyIncome(s).business;
  const a = findTile(s, 'grass');
  game.act('factory', a.x, a.y);
  const b = findTile(s, 'grass');
  game.act('inn', b.x, b.y);
  assert.equal(monthlyIncome(s).business - base, CONFIG.buildings.factory.income + CONFIG.buildings.inn.income);
});
