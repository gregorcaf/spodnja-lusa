// The municipality's name: chosen at the start, used in news, saved with the game.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, FakeStorage } from './helpers.js';
import { cleanName, withMunicipality, municipalityTitle, NAME_SUGGESTIONS, MAX_NAME_LENGTH } from '../src/game/municipality.js';
import { saveGame, loadGame } from '../src/game/save.js';
import { FIXED_NEWS } from '../src/game/texts.js';

afterEach(restoreRandom);

test('names are tidied up', () => {
  assert.equal(cleanName('  spodnja   luša '), 'Spodnja Luša');
  assert.equal(cleanName('kozja gorica pri tovarni'), 'Kozja Gorica pri Tovarni');
  assert.equal(cleanName('McŽlampe'), 'McŽlampe', 'what the player capitalised stays');
  assert.equal(cleanName('   '), '');
  assert.equal(cleanName('x'.repeat(50)).length, MAX_NAME_LENGTH);
  assert.ok(NAME_SUGGESTIONS.every((n) => cleanName(n) === n));
});

test('texts say »občina X« and never decline the name itself', () => {
  const state = { municipality: 'Spodnja Luša' };
  assert.equal(withMunicipality('Turisti so odkrili {obcino}.', state), 'Turisti so odkrili občino Spodnja Luša.');
  assert.equal(withMunicipality('Minister je bil v {obcini}.', state), 'Minister je bil v občini Spodnja Luša.');
  assert.equal(withMunicipality('{Obcina} je najlepša.', state), 'Občina Spodnja Luša je najlepša.');
  assert.equal(municipalityTitle(state), 'Občina Spodnja Luša');
  // Old saves without a name.
  assert.equal(withMunicipality('Turisti so odkrili {obcino}.', {}), 'Turisti so odkrili našo občino.');
  assert.equal(municipalityTitle({}), 'Naša občina');
});

test('the game fills the name into every news item', () => {
  const game = newGame();
  game.setMunicipality('  mala fovšija ');
  assert.equal(game.state.municipality, 'Mala Fovšija');
  const news = [];
  game.on('news', (n) => news.push(n));
  game.emit('news', 'Na tablo ob vstopu v {obcino} je nekdo dopisal »Še.«');
  assert.equal(news[0], 'Na tablo ob vstopu v občino Mala Fovšija je nekdo dopisal »Še.«');
});

test('the name is saved with the game', () => {
  const game = newGame();
  game.setMunicipality('Sveti Bratranec');
  const storage = new FakeStorage();
  saveGame(storage, game.state);
  assert.equal(loadGame(storage).municipality, 'Sveti Bratranec');
});

test('local news with a placeholder read well both with and without a name', () => {
  for (const state of [{ municipality: 'Nova Kuverta' }, {}]) {
    for (const n of FIXED_NEWS) assert.ok(!/[{}]/.test(withMunicipality(n, state)), n);
  }
});
