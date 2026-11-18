// Saving/loading and seasons.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, FakeStorage } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { Game } from '../src/game/game.js';
import { saveGame, loadGame, clearSave, deserialize, SAVE_KEY } from '../src/game/save.js';
import { seasonOf } from '../src/game/seasons.js';
import { spawnWish } from '../src/game/wishes.js';
import { WISHES } from '../src/game/content/wishes.js';
import { drawDilemma } from '../src/game/dilemmas.js';

afterEach(restoreRandom);

test('a saved game loads back identically and keeps running', () => {
  const game = newGame();
  game.useLever('cousin');
  game.nextMonth();
  const storage = new FakeStorage();
  assert.ok(saveGame(storage, game.state));
  const loaded = loadGame(storage);
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), JSON.parse(JSON.stringify(game.state)));
  const resumed = new Game(loaded);
  resumed.nextMonth();
  assert.equal(resumed.state.monthIndex, 2);
  clearSave(storage);
  assert.equal(loadGame(storage), null);
});

test('older saves get defaults for new fields; broken saves are ignored', () => {
  const game = newGame();
  const old = JSON.parse(JSON.stringify(game.state));
  delete old.yearlyDone;
  delete old.envelopesThisYear;
  const loaded = deserialize(JSON.stringify({ version: 1, state: old }));
  assert.deepEqual(loaded.yearlyDone, {});
  assert.equal(loaded.envelopesThisYear, 0);
  assert.equal(deserialize('not json'), null);
  assert.equal(deserialize(JSON.stringify({ version: 999, state: old })), null);
  const storage = new FakeStorage();
  storage.setItem(SAVE_KEY, '{"broken":');
  assert.equal(loadGame(storage), null);
});

test('months map to seasons', () => {
  assert.deepEqual([0, 1, 2, 4, 5, 7, 8, 10, 11].map(seasonOf), [
    'winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'autumn', 'autumn', 'winter',
  ]);
});

test('the Christmas fair comes every December, once', () => {
  const game = newGame();
  const s = game.state;
  s.month = 11;
  assert.equal(drawDilemma(s).id, 'christmas-fair');
  assert.notEqual(drawDilemma(s).id, 'christmas-fair');
  s.year += 1;
  assert.equal(drawDilemma(s).id, 'christmas-fair');
});

test('seasonal wishes only appear in their season', () => {
  const game = newGame();
  const s = game.state;
  for (const month of [0, 4, 7, 10]) {
    s.month = month;
    for (let i = 0; i < 60; i++) {
      s.wishes = [];
      const w = spawnWish(s);
      const tpl = WISHES.find((t) => t.id === w.templateId);
      if (tpl.season) assert.equal(tpl.season, seasonOf(month), `${tpl.id} in month ${month}`);
    }
  }
});

test('the snow lever is not available in winter', () => {
  const game = newGame();
  const s = game.state;
  for (const month of [11, 0, 1]) {
    s.month = month;
    const budget = s.budget;
    assert.equal(game.useLever('snow').ok, false, `month ${month}`);
    assert.equal(s.snow, false);
    assert.equal(s.budget, budget);
  }
  s.month = 4; // May: a proper surprise
  assert.equal(game.useLever('snow').ok, true);
  assert.equal(s.secret, CONFIG.levers.snow.secret);
});
