// Ticker filler news: shuffled deck, seasonal stories only in their season.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { restoreRandom, seedRandom } from './helpers.js';
import { NewsDeck } from '../src/game/newsDeck.js';
import { FIXED_NEWS, SEASON_NEWS } from '../src/game/texts.js';

afterEach(restoreRandom);

test('every story appears once per round', () => {
  seedRandom(3);
  const deck = new NewsDeck(() => 'summer');
  const total = FIXED_NEWS.length + SEASON_NEWS.summer.length;
  const round = Array.from({ length: total }, () => deck.next());
  assert.equal(new Set(round).size, total);
});

test('the order is random and never repeats a story back to back', () => {
  seedRandom(5);
  const deck = new NewsDeck(() => 'winter');
  const seen = Array.from({ length: 500 }, () => deck.next());
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  const first = seen.slice(0, 10);
  assert.notDeepEqual(first, FIXED_NEWS.slice(0, 10));
});

test('seasonal stories only appear in their season', () => {
  seedRandom(7);
  const deck = new NewsDeck(() => 'autumn');
  const round = Array.from({ length: 200 }, () => deck.next());
  for (const other of ['winter', 'spring', 'summer']) {
    for (const story of SEASON_NEWS[other]) assert.ok(!round.includes(story), story);
  }
  assert.ok(SEASON_NEWS.autumn.every((story) => round.includes(story)));
});

test('no duplicate stories in the news lists', () => {
  const all = [...FIXED_NEWS, ...Object.values(SEASON_NEWS).flat()];
  assert.equal(new Set(all).size, all.length);
});
