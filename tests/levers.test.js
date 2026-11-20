// The mayor's levers and the secret account.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { LEVER_ERRORS } from '../src/game/texts.js';

afterEach(restoreRandom);

test('razpis za bratranca fills the secret account and raises the affair risk', () => {
  const game = newGame();
  const s = game.state;
  const c = CONFIG.levers.cousin;
  assert.ok(game.useLever('cousin').ok);
  assert.ok(s.secret >= c.secretMin && s.secret <= c.secretMax);
  assert.ok(s.affair >= CONFIG.start.affairRisk + c.affairMin && s.affair <= CONFIG.start.affairRisk + c.affairMax);
  assert.equal(s.budget, 150000 - c.cost);
});

test('the party needs a firehouse and lowers the affair risk', () => {
  const game = newGame();
  const s = game.state;
  assert.equal(game.useLever('party').reason, LEVER_ERRORS.noFirehouse);
  const spot = findTile(s, 'grass');
  game.act('firehouse', spot.x, spot.y);
  s.affair = 40;
  assert.ok(game.useLever('party').ok);
  assert.equal(s.affair, 40 + CONFIG.levers.party.affair);
  assert.equal(game.useLever('party').reason, LEVER_ERRORS.partyActive);
});

test('repeated newsletters get weaker', () => {
  const game = newGame();
  const s = game.state;
  game.useLever('praise');
  const first = s.propaganda;
  game.useLever('praise');
  assert.ok(Math.abs(s.propaganda - first - first * CONFIG.levers.praise.decay) < 1e-9);
});

test('secret-account levers need money on the secret account', () => {
  const game = newGame();
  const s = game.state;
  assert.equal(game.useLever('media').reason, LEVER_ERRORS.noSecret);
  s.secret = 100000;
  s.affair = 70;
  assert.ok(game.useLever('media').ok);
  assert.equal(s.affair, 70 + CONFIG.levers.media.affair);
  assert.equal(s.secret, 100000 - CONFIG.levers.media.cost);
});

test('lunch with the minister pays out (or not) two months later, once at a time', () => {
  let paid = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const game = newGame({ seed });
    const s = game.state;
    s.secret = 50000;
    assert.ok(game.useLever('minister').ok);
    assert.equal(game.useLever('minister').reason, LEVER_ERRORS.ministerPending);
    const before = s.budget;
    game.nextMonth();
    const afterOne = s.budget;
    game.nextMonth();
    const regular = afterOne - before;
    if (s.budget - afterOne - regular > 50000) paid++;
  }
  // 70 % chance: comfortably between 15 and 38 of 40.
  assert.ok(paid > 15 && paid < 38, `paid ${paid}/40`);
});

test('a lever blocked by a dilemma deal cannot be used', () => {
  const game = newGame();
  game.state.modifiers.push({ key: 'cousin-offended', label: 'Bratranec užaljen', months: 2, blockLever: 'cousin' });
  assert.equal(game.useLever('cousin').ok, false);
  game.nextMonth();
  game.nextMonth();
  assert.ok(game.useLever('cousin').ok, 'available again after the deal runs out');
});

test('envelopes make a citizen loyal and get pricier within a year', () => {
  const game = newGame();
  const s = game.state;
  s.secret = 100000;
  assert.ok(game.giveEnvelope(1).ok);
  assert.ok(game.giveEnvelope(2).ok);
  assert.equal(s.secret, 100000 - CONFIG.loyalty.baseCost * 2 - CONFIG.loyalty.costStep);
  assert.ok(s.citizens[1].loyalMonths > 0);
  assert.equal(game.giveEnvelope(1).ok, false, 'already loyal');
});

const avgEnvy = (s, pred = () => true) => {
  const people = s.citizens.filter(pred);
  return people.reduce((a, c) => a + c.envy, 0) / people.length;
};

test('the local holiday lowers envy for everyone, then waits a year', () => {
  const game = newGame();
  const s = game.state;
  for (const c of s.citizens) c.envy = 50;
  assert.ok(game.useLever('holiday').ok);
  assert.ok(avgEnvy(s) < 50);
  assert.equal(game.canUseLever('holiday').ok, false);
  assert.equal(s.modifiers.find((m) => m.blockLever === 'holiday').months, CONFIG.levers.holiday.cooldown);
});

test('the firefighting contest needs a firehouse and turns envy outward', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  const hadStation = s.grid.some((t) => t.type === 'firehouse');
  if (!hadStation) {
    assert.equal(game.useLever('contest').ok, false);
    const p = findTile(s, 'grass');
    game.act('firehouse', p.x, p.y);
  }
  for (const c of s.citizens) c.envy = 50;
  const res = game.useLever('contest');
  assert.ok(res.ok, res.reason);
  assert.ok(avgEnvy(s) < 50);
  assert.ok(s.leverMult.contest < 1);
});

test('a town-hall meeting calms the most envious district and brings a wish', () => {
  const game = newGame();
  const s = game.state;
  s.wishes = [];
  for (const c of s.citizens) c.envy = c.home === 2 ? 80 : 20;
  const res = game.useLever('assembly');
  assert.ok(res.ok, res.reason);
  assert.ok(avgEnvy(s, (c) => c.home === 2) < 80);
  assert.equal(avgEnvy(s, (c) => c.home !== 2), 20);
  assert.equal(s.wishes.length, 1);
  assert.equal(s.citizens[s.wishes[0].citizenId].home, 2);
  assert.equal(game.canUseLever('assembly').ok, false);
});

test('when a gathering ends, the other gathering levers are free again (and the UI hears about it)', () => {
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  assert.ok(game.useLever('holiday').ok);
  assert.equal(game.canUseLever('assembly').ok, false);
  let refreshed = false;
  game.on('state', () => (refreshed = true));
  game.endGathering();
  assert.ok(refreshed);
  assert.equal(game.canUseLever('assembly').ok, true);
});

test('the cousin gets at most a few tenders a month, each paying less', async () => {
  const { recoverLevers } = await import('../src/game/levers.js');
  const game = newGame();
  const s = game.state;
  s.budget = 1e7;
  const c = CONFIG.levers.cousin;
  for (let i = 0; i < c.perMonth; i++) assert.ok(game.useLever('cousin').ok);
  const res = game.useLever('cousin');
  assert.equal(res.ok, false);
  assert.match(res.reason, /bratranec/i);
  assert.ok(s.leverMult.cousin < 1, 'repeated tenders pay less');
  // A new month: new tenders, and the cousin slowly regains his "credibility".
  const mult = s.leverMult.cousin;
  recoverLevers(s);
  assert.equal(s.cousinThisMonth, 0);
  assert.ok(s.leverMult.cousin > mult);
  assert.ok(game.useLever('cousin').ok);
});
