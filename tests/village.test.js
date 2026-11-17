// Construction, ribbon cutting, upgrades and the mayor in person.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile, FakeStorage } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { idx } from '../src/game/map.js';
import { monthlyIncome, monthlyExpenses } from '../src/game/stats.js';
import { saveGame, loadGame } from '../src/game/save.js';

afterEach(restoreRandom);

const tileAt = (s, p) => s.grid[idx(p.x, p.y)];

function build(game, type) {
  const p = findTile(game.state, 'grass');
  assert.ok(game.act(type, p.x, p.y).ok);
  return p;
}

function tickMonths(game, months) {
  for (let i = 0; i < Math.round(months * CONFIG.time.secondsPerMonth * 10); i++) game.tick(0.1);
}

test('a new building goes from scaffolding to a ribbon that can be cut', () => {
  const game = newGame();
  game.state.mapEventTimer = 1e9;
  const p = build(game, 'inn');
  assert.equal(tileAt(game.state, p).build.phase, 'construction');
  tickMonths(game, CONFIG.construction.months.inn + 0.05);
  assert.equal(tileAt(game.state, p).build.phase, 'opening');
  assert.equal(game.pendingRibbons().length, 1);
  const prop = game.state.propaganda;
  assert.ok(game.cutRibbon(p.x, p.y).ok);
  assert.equal(tileAt(game.state, p).build, undefined);
  assert.equal(game.state.propaganda, prop + CONFIG.construction.ribbonPropaganda.inn);
});

test('a missed opening upsets the district; houses have no ribbon', () => {
  const game = newGame();
  game.state.mapEventTimer = 1e9;
  const news = [];
  game.on('news', (n) => news.push(n));
  const inn = build(game, 'inn');
  const house = build(game, 'house');
  tickMonths(game, CONFIG.construction.months.inn + CONFIG.construction.ribbonWindow + 0.1);
  assert.equal(tileAt(game.state, inn).build, undefined);
  assert.equal(tileAt(game.state, house).build, undefined, 'house finished without a ribbon');
  assert.ok(news.some((n) => n.includes('Župana ni bilo') || n.includes('brez župana')));
});

test('upgrades cost money once and change the monthly balance', () => {
  const game = newGame();
  const s = game.state;
  s.mapEventTimer = 1e9;
  const p = build(game, 'inn');
  assert.equal(game.buyUpgrade(p.x, p.y, 'linden').ok, false, 'not before the opening');
  delete tileAt(s, p).build;
  const before = { budget: s.budget, income: monthlyIncome(s).business };
  assert.ok(game.buyUpgrade(p.x, p.y, 'linden').ok);
  assert.equal(s.budget, before.budget - 4000);
  assert.equal(monthlyIncome(s).business, before.income + 300);
  assert.equal(game.buyUpgrade(p.x, p.y, 'linden').ok, false, 'only once');
  const f = build(game, 'factory');
  delete tileAt(s, f).build;
  const upkeep = monthlyExpenses(s).upkeep;
  assert.ok(game.buyUpgrade(f.x, f.y, 'filter').ok);
  assert.equal(monthlyExpenses(s).upkeep, upkeep + 500);
  game.act('demolish', f.x, f.y);
  assert.equal(monthlyExpenses(s).upkeep, upkeep, 'upgrades go with the building');
});

test('the church can be upgraded too', () => {
  const game = newGame();
  const church = findTile(game.state, 'church');
  assert.ok(game.buyUpgrade(church.x, church.y, 'tower').ok);
});

test('a handshake helps once, then needs a few months', () => {
  const game = newGame();
  const c = game.state.citizens[2];
  const happy = c.happy;
  assert.equal(game.shakeHands(2).effective, true);
  assert.equal(c.happy, Math.min(100, happy + CONFIG.mayor.shakeHappy));
  assert.equal(game.shakeHands(2).effective, false, 'cooldown');
  for (let i = 0; i < CONFIG.mayor.shakeCooldown; i++) game.nextMonth();
  assert.equal(game.shakeHands(2).effective, true);
});

test('listening sometimes turns into a wish for that citizen', () => {
  let wishes = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const game = newGame({ seed });
    const res = game.listen(5);
    if (res.wish) {
      wishes++;
      assert.equal(res.wish.citizenId, 5);
    }
  }
  assert.ok(wishes > 4 && wishes < 20, `${wishes}/20`);
});

test('construction and upgrades are saved', () => {
  const game = newGame();
  const p = build(game, 'hall');
  const church = findTile(game.state, 'church');
  game.buyUpgrade(church.x, church.y, 'lights');
  const storage = new FakeStorage();
  saveGame(storage, game.state);
  const loaded = loadGame(storage);
  assert.equal(loaded.grid[idx(p.x, p.y)].build.phase, 'construction');
  assert.deepEqual(loaded.grid[idx(church.x, church.y)].upgrades, ['lights']);
});
