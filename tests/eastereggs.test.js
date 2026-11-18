// Easter eggs: the rare visitor, the local wine and the church bells.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom } from './helpers.js';
import { EGGS, rollKrpan, tickKrpan, krpanProgress } from '../src/game/eastereggs.js';

afterEach(restoreRandom);

test('the visitor comes rarely, at most once a year, and crosses the map', () => {
  const game = newGame();
  const s = game.state;
  Math.random = () => 0; // he always wants to come
  assert.ok(rollKrpan(s));
  assert.equal(rollKrpan(s), null, 'only one at a time');
  assert.equal(krpanProgress(s), 0);
  tickKrpan(s, EGGS.krpanMonths / 2);
  assert.ok(Math.abs(krpanProgress(s) - 0.5) < 1e-9);
  const bye = tickKrpan(s, EGGS.krpanMonths);
  assert.equal(s.krpan, null);
  assert.ok(bye, 'nobody stopped him: a farewell news');
  assert.equal(rollKrpan(s), null, 'not again in the same year');
  s.monthIndex += EGGS.krpanCooldownMonths;
  assert.ok(rollKrpan(s));
});

test('stopping him brings a sack of salt, once per visit', () => {
  const game = newGame();
  const s = game.state;
  Math.random = () => 0;
  rollKrpan(s);
  const budget = s.budget;
  assert.equal(game.meetKrpan().ok, true);
  assert.equal(s.budget, budget + EGGS.krpanSalt);
  assert.equal(game.meetKrpan().ok, false);
  assert.equal(tickKrpan(s, 1), null, 'no farewell news after meeting the mayor');
});

test('cviček makes everyone tipsy and happier, then needs a pause', () => {
  const game = newGame();
  const s = game.state;
  for (const c of s.citizens) c.happy = 50;
  assert.equal(game.pourCvicek().ok, true);
  assert.ok(s.citizens.every((c) => c.drunk === EGGS.cvicekSeconds && c.happy === 52));
  assert.equal(game.pourCvicek().ok, false);
  s.monthIndex += EGGS.cvicekCooldownMonths;
  assert.equal(game.pourCvicek().ok, true);
});

test('the church bells only make news', () => {
  const game = newGame();
  const s = game.state;
  const before = JSON.stringify({ budget: s.budget, affair: s.affair });
  const news = [];
  game.on('news', (n) => news.push(n));
  game.ringBells();
  assert.equal(news.length, 1);
  assert.equal(JSON.stringify({ budget: s.budget, affair: s.affair }), before);
});
