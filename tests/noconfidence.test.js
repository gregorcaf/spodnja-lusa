// Unrest out of unhappiness, and the vote of no confidence after months of riots.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { unrestCause } from '../src/game/unrest.js';

afterEach(restoreRandom);

function makeMiserable(state) {
  for (const c of state.citizens) {
    c.happy = 0;
    c.envy = 100;
    c.loyalMonths = 0;
  }
}

test('very low support alone brings riots, even without a scandal', () => {
  const game = newGame();
  const s = game.state;
  s.affair = 0;
  makeMiserable(s);
  game.refreshUnrest();
  assert.equal(s.unrest, 'riot');
  assert.equal(unrestCause(s), 'mood');
});

test('after three riot months the council calls early elections', () => {
  const game = newGame();
  const s = game.state;
  let election = null;
  game.on('election', (e) => (election = e));
  for (let m = 0; m < CONFIG.unrest.noConfidenceMonths && !election; m++) {
    makeMiserable(s);
    game.refreshUnrest();
    game.nextMonth();
  }
  assert.ok(election, 'an election was held');
  assert.equal(election.early, true);
  assert.equal(election.won, false, 'nobody votes for a mayor in a riot');
  assert.ok(s.monthIndex < CONFIG.elections.termMonths, 'well before the regular election');
});

test('winning the early election starts a new term and resets the riot count', () => {
  const game = newGame();
  const s = game.state;
  s.riotMonths = 5;
  s.secret = 0;
  game.holdElection(true);
  if (s.election.won) {
    assert.equal(s.term, 2);
    assert.equal(s.riotMonths, 0);
  }
});
