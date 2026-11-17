// Balance guard: over a full term a passive mayor loses, an active one usually wins.
// Uses fixed random seeds, so the result is repeatable.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom } from './helpers.js';
import { districtOf } from '../src/game/map.js';

afterEach(restoreRandom);

function playTerm(seed, active) {
  const game = newGame({ seed, quiet: false });
  const s = game.state;
  let result = null;
  game.on('dilemma', () => game.chooseDilemma(Math.floor(Math.random() * 2)));
  game.on('election', (e) => (result = e));
  // An active mayor reacts to live events on the map; a passive one lets them run out.
  if (active) game.on('mapevent', (e) => e.phase === 'start' && game.clickMapEvent());
  let last = -1;
  while (!result && s.monthIndex < 49) {
    game.tick(1);
    if (!active || s.monthIndex === last) continue;
    last = s.monthIndex;
    for (const w of [...s.wishes]) if (w.cost != null && s.budget > 20000) game.payWish(w.uid);
    const d = s.monthIndex % 4;
    const free = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (districtOf(x, y) === d && s.grid[y * 16 + x].type === 'grass') free.push([x, y]);
    if (free.length && s.monthIndex % 3 === 0) game.act(s.monthIndex % 9 === 0 ? 'inn' : 'house', ...free[0]);
    if (s.monthIndex === 3 && free.length) game.act('firehouse', ...free[free.length - 1]);
    if (s.monthIndex % 4 === 0) game.useLever('neighbor');
    if (s.monthIndex % 6 === 0) game.useLever('party');
    if (s.campaign) game.useLever('praise');
  }
  return result;
}

test('a passive mayor loses the first election', () => {
  for (let seed = 1; seed <= 5; seed++) assert.equal(playTerm(seed, false).won, false, `seed ${seed}`);
});

test('an active mayor usually wins the first election', () => {
  const wins = [1, 2, 3, 4, 5, 6].filter((seed) => playTerm(seed, true).won).length;
  assert.ok(wins >= 4, `won ${wins}/6`);
});
