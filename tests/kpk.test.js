// The anti-corruption investigation.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { checkKpk } from '../src/game/kpk.js';

afterEach(restoreRandom);

test('an honest mayor is never investigated', () => {
  const game = newGame();
  let n = 0;
  for (let i = 0; i < 200; i++) if (checkKpk(game.state)) n++;
  assert.equal(n, 0);
});

test('a greedy mayor gets an investigation card, at most once a year', () => {
  const game = newGame({ quiet: false });
  const s = game.state;
  s.mapEventTimer = 1e9;
  s.wishTimer = 1e9;
  s.secret = CONFIG.kpk.secretAtLeast + 10000;
  const cards = [];
  game.on('dilemma', (c) => {
    cards.push(c.title);
    game.chooseDilemma(c.title === 'Preiskava KPK' ? 2 : 0); // cooperate with the KPK; other cards: first option
  });
  for (let m = 0; m < 30 && !cards.includes('Preiskava KPK'); m++) {
    s.secret = CONFIG.kpk.secretAtLeast + 10000;
    game.nextMonth();
    for (let i = 0; i < 40; i++) game.tick(0.5);
  }
  assert.ok(cards.includes('Preiskava KPK'), 'the KPK came');
  assert.equal(s.secret < 1000, true, 'cooperating gives up the secret account');
  assert.ok(s.kpkCooldownUntil > s.monthIndex, 'and buys a year of peace');
});

test('hiding the money with the aunt sometimes ends with everything confiscated', () => {
  const outcomes = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const game = newGame({ seed });
    const s = game.state;
    s.secret = 80000;
    s.kpkDue = true;
    game.state.dilemma = { id: 'kpk', ctx: {} };
    game.chooseDilemma(0);
    game.nextMonth();
    outcomes.add(s.secret === 0 ? 'confiscated' : 'safe');
  }
  assert.deepEqual([...outcomes].sort(), ['confiscated', 'safe']);
});
