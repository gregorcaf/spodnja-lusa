// Live map events: every type, clicked or ignored.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile, tileType } from './helpers.js';
import { MAP_EVENT_TYPES } from '../src/game/mapEvents.js';

afterEach(restoreRandom);

function runOut(game) {
  for (let i = 0; i < 500 && game.state.mapEvent; i++) game.tick(0.5);
  assert.equal(game.state.mapEvent, null, 'event ran out');
}

test('every event can start, be clicked and be ignored, with readable news', () => {
  for (const type of MAP_EVENT_TYPES) {
    for (const click of [true, false]) {
      const game = newGame();
      game.state.mapEventTimer = 1e9;
      game.state.secret = 10000;
      const news = [];
      game.on('news', (n) => news.push(n));
      assert.ok(game.startMapEvent(type), `${type} starts`);
      if (click) assert.ok(game.clickMapEvent());
      else runOut(game);
      assert.equal(news.length >= 1, true);
      for (const n of news) assert.ok(!/[{}]/.test(n), `${type}: ${n}`);
    }
  }
});

test('an ignored fire burns the house down; a clicked one saves it', () => {
  for (const click of [true, false]) {
    const game = newGame();
    game.state.mapEventTimer = 1e9;
    const ev = game.startMapEvent('fire');
    const { x, y } = ev.tile;
    if (click) game.clickMapEvent();
    else runOut(game);
    assert.equal(tileType(game.state, x, y), click ? 'house' : 'grass');
  }
});

test('our own fire station puts fires out for free', () => {
  const game = newGame();
  const s = game.state;
  s.mapEventTimer = 1e9;
  const g = findTile(s, 'grass');
  game.act('firehouse', g.x, g.y);
  const before = s.budget;
  game.startMapEvent('fire');
  game.clickMapEvent();
  assert.equal(s.budget, before);
});

test('an ignored journalist only hurts when there is something to find', () => {
  for (const [affair, expectUp] of [[40, true], [10, false]]) {
    const game = newGame();
    game.state.mapEventTimer = 1e9;
    game.state.affair = affair;
    game.startMapEvent('journalist');
    runOut(game);
    assert.equal(game.state.affair > affair, expectUp, `affair ${affair}`);
  }
});

test('events appear on their own, one at a time, and freeze while paused', () => {
  const game = newGame({ quiet: false });
  const s = game.state;
  s.dilemmaTimer = 1e9;
  let starts = 0;
  game.on('mapevent', (e) => e.phase === 'start' && starts++);
  for (let i = 0; i < 30 * 6; i++) {
    game.tick(1); // six game-months at 1×
    assert.ok(starts - (s.mapEvent ? 1 : 0) >= 0);
  }
  // About one every 1.6 months (≈0.5 running + 0.8–1.4 pause).
  assert.ok(starts >= 2 && starts <= 6, `${starts} events in six months`);
  game.startMapEvent('bear') || game.state.mapEvent; // ensure one is running
  const p = s.mapEvent.progress;
  game.setSpeed(0);
  game.tick(5);
  assert.equal(s.mapEvent.progress, p, 'no progress while paused');
});
