// The fire-brigade party: weaker than before, and alcohol has consequences.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { countTiles } from '../src/game/stats.js';

afterEach(restoreRandom);

function partyGame(seed) {
  const game = newGame({ seed });
  const s = game.state;
  s.mapEventTimer = 1e9;
  const g = findTile(s, 'grass');
  game.act('firehouse', g.x, g.y);
  return game;
}

test('the party is weaker than it used to be', () => {
  assert.ok(CONFIG.levers.party.happiness <= 6);
  assert.ok(CONFIG.levers.party.envyReduction <= 10);
});

test('after the party some citizens are drunk, and it wears off', () => {
  const game = partyGame(1);
  let after = null;
  game.on('party-after', (a) => (after = a));
  game.useLever('party');
  game.endParty();
  const p = CONFIG.levers.party;
  assert.ok(after.drunk.length >= p.drunkMin && after.drunk.length <= p.drunkMax);
  const drunk = game.state.citizens.filter((c) => c.drunk > 0);
  assert.equal(drunk.length, after.drunk.length);
  game.tick(0.1);
  assert.ok(drunk.some((c) => /Hik|prijatelj|kolo|cesta|car/.test(c.thought)), 'drunk thoughts');
  for (let i = 0; i < 100; i++) game.tick(0.5);
  assert.ok(game.state.citizens.every((c) => !(c.drunk > 0)), 'sober again');
});

test('incidents happen about half the time and each kind works', () => {
  const kinds = new Set();
  let incidents = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const game = partyGame(seed);
    const s = game.state;
    let after = null;
    game.on('party-after', (a) => (after = a));
    const roundabouts = countTiles(s, 'roundabout');
    const budget = s.budget;
    game.useLever('party');
    game.endParty();
    if (!after.incident) continue;
    incidents++;
    kinds.add(after.incident.type);
    assert.ok(!/[{}]/.test(after.incident.news));
    if (after.incident.type === 'brawl') assert.equal(new Set(after.incident.citizens).size, 2);
    if (after.incident.type === 'hangover') assert.ok(s.budget < budget - CONFIG.levers.party.cost);
    if (after.incident.type === 'tanker') assert.equal(after.incident.tiles.length, 1);
    assert.ok(countTiles(s, 'roundabout') <= roundabouts);
  }
  assert.ok(incidents > 15 && incidents < 45, `${incidents}/60 incidents`);
  assert.deepEqual([...kinds].sort(), ['brawl', 'hangover', 'photo', 'tanker']);
});
