// The house tax: money versus mood.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, FakeStorage } from './helpers.js';
import { CONFIG } from '../src/config.js';
import { monthlyIncome, countTiles } from '../src/game/stats.js';
import { taxHappiness, taxLevel } from '../src/game/taxes.js';
import { assignProtesters } from '../src/game/unrest.js';
import { saveGame, loadGame } from '../src/game/save.js';

afterEach(restoreRandom);

test('the tax sets the house income and stays within limits and steps', () => {
  const game = newGame();
  const s = game.state;
  const houses = countTiles(s, 'house');
  assert.equal(monthlyIncome(s).taxes, houses * CONFIG.taxes.start);
  game.setTaxRate(500);
  assert.equal(monthlyIncome(s).taxes, houses * 500);
  assert.equal(game.setTaxRate(5000), CONFIG.taxes.max);
  assert.equal(game.setTaxRate(-100), CONFIG.taxes.min);
  assert.equal(game.setTaxRate(333), 350);
});

test('higher tax makes citizens grumpier, lower tax happier', () => {
  assert.equal(taxHappiness(CONFIG.taxes.neutral), 0);
  assert.ok(taxHappiness(600) < 0 && taxHappiness(100) > 0);
  const happyAfterMonth = (rate) => {
    const game = newGame({ seed: 7 });
    game.setTaxRate(rate);
    game.nextMonth();
    return game.state.citizens.reduce((a, c) => a + c.happy, 0);
  };
  assert.ok(happyAfterMonth(700) < happyAfterMonth(300));
  assert.ok(happyAfterMonth(0) > happyAfterMonth(300));
});

test('changing the tax is in the news; a very high tax adds envy', () => {
  const game = newGame();
  const news = [];
  game.on('news', (n) => news.push(n));
  game.setTaxRate(700);
  const envyBefore = game.state.citizens.map((c) => c.envy);
  game.nextMonth();
  assert.ok(news.some((n) => n.includes('700')), 'news mentions the new rate');
  const extra = game.state.citizens.filter((c, i) => c.envy > Math.min(100, envyBefore[i] + CONFIG.month.envyDrift + 0.001));
  assert.ok(extra.length > 0, 'very high tax adds envy');
  assert.equal(taxLevel(700), 'veryHigh');
});

test('a very high tax brings more people to a protest', () => {
  const count = (rate) => {
    const game = newGame({ seed: 3 });
    const s = game.state;
    s.taxRate = rate;
    s.unrest = 'protest';
    assignProtesters(s);
    return s.citizens.filter((c) => c.protesting).length;
  };
  assert.ok(count(800) >= count(300));
});

test('the tax is saved with the game', () => {
  const game = newGame();
  game.setTaxRate(450);
  const storage = new FakeStorage();
  saveGame(storage, game.state);
  assert.equal(loadGame(storage).taxRate, 450);
});
