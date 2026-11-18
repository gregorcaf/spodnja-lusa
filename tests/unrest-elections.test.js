// Protests, riots, elections and the campaign tricks.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { countTiles } from '../src/game/stats.js';

afterEach(restoreRandom);

test('affair risk thresholds start protests and riots', () => {
  const game = newGame();
  const s = game.state;
  const events = [];
  game.on('unrest', (u) => events.push(u.level));
  s.affair = CONFIG.unrest.protestAt;
  game.refreshUnrest();
  assert.equal(s.unrest, 'protest');
  assert.ok(s.citizens.some((c) => c.protesting));
  s.affair = CONFIG.unrest.riotAt;
  game.refreshUnrest();
  assert.equal(s.unrest, 'riot');
  s.affair = 10;
  game.refreshUnrest();
  assert.equal(s.unrest, 'calm');
  assert.ok(s.citizens.every((c) => !c.protesting));
  assert.deepEqual(events, ['protest', 'riot', 'calm']);
});

test('a protest month costs vandalism and taxes; a riot month burns a building', () => {
  const game = newGame();
  const s = game.state;
  s.affair = 60;
  game.refreshUnrest();
  const report = game.nextMonth();
  assert.ok(report.income.strike > 0, 'tax strike');
  assert.equal(report.damage.cost, CONFIG.unrest.protestVandalism);

  const game2 = newGame();
  const s2 = game2.state;
  s2.affair = 95;
  game2.refreshUnrest();
  const houses = countTiles(s2, 'house');
  const r2 = game2.nextMonth();
  assert.equal(r2.damage.cost, CONFIG.unrest.riotRepairCost);
  assert.ok(countTiles(s2, 'house') <= houses);
  assert.ok(s2.stats.burned === 1);
});

function startCampaign(game) {
  game.state.nextElectionAt = game.state.monthIndex + 2;
  game.nextMonth();
  assert.ok(game.state.campaign);
}

test('bought votes count even when everyone is unhappy', () => {
  const game = newGame();
  const s = game.state;
  s.secret = 200000;
  startCampaign(game);
  const bought = s.citizens.filter((c) => c.id !== s.opponentId).slice(0, 4);
  for (const c of bought) assert.ok(game.buyVote(c.id).ok);
  for (const c of s.citizens) {
    c.happy = 0;
    c.envy = 100;
    c.loyalMonths = 0;
  }
  s.nextElectionAt = s.monthIndex + 1;
  game.nextMonth();
  assert.equal(s.election.reps.mayor, 4, 'four bought citizens in the sample');
  assert.equal(s.election.won, false);
});

test('vote prices rise within a campaign', () => {
  const game = newGame();
  const s = game.state;
  s.secret = 200000;
  startCampaign(game);
  const ids = s.citizens.filter((c) => c.id !== s.opponentId).map((c) => c.id);
  const prices = ids.slice(0, 3).map((id) => game.buyVote(id).price);
  const e = CONFIG.elections;
  assert.deepEqual(prices, [e.voteBaseCost, e.voteBaseCost + e.voteCostStep, e.voteBaseCost + 2 * e.voteCostStep]);
});

test('a lost election can be won back by a recount, or ends the game', () => {
  const outcomes = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const game = newGame({ seed });
    const s = game.state;
    s.secret = 50000;
    for (const c of s.citizens) {
      c.happy = 0;
      c.envy = 100;
    }
    s.nextElectionAt = s.monthIndex + 1;
    game.nextMonth();
    assert.equal(s.election.won, false);
    const kept = game.requestRecount();
    outcomes.add(kept);
    if (kept) assert.equal(s.term, 2);
    else assert.equal(s.over, true);
  }
  assert.deepEqual([...outcomes].sort(), [false, true], 'both outcomes happen');
});
