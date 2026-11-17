// All Slovenian content: every card, wish and thought fills its placeholders.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreRandom, findTile } from './helpers.js';
import { DILEMMAS } from '../src/game/content/dilemmas.js';
import { WISHES } from '../src/game/content/wishes.js';
import { THOUGHTS } from '../src/game/texts.js';
import { presentDilemma, resolveDilemma, drawDilemma } from '../src/game/dilemmas.js';
import { fillTemplate } from '../src/game/util.js';

afterEach(restoreRandom);

const unfilled = (text) => /[{}]/.test(text);

test('ids are unique', () => {
  assert.equal(new Set(DILEMMAS.map((d) => d.id)).size, DILEMMAS.length);
  assert.equal(new Set(WISHES.map((w) => w.id)).size, WISHES.length);
});

test('every dilemma card shows and resolves cleanly for both options', () => {
  for (const card of DILEMMAS) {
    card.options.forEach((_, i) => {
      const game = newGame();
      const s = game.state;
      // Give every building type a home so cards that need one can resolve.
      for (const type of ['factory', 'inn', 'hall', 'firehouse']) {
        const g = findTile(s, 'grass');
        game.act(type, g.x, g.y);
      }
      const inst = { id: card.id, ctx: { district: 1, citizenId: 3 } };
      const shown = presentDilemma(inst, s);
      assert.ok(!unfilled(shown.text), `${card.id} text: ${shown.text}`);
      const { news } = resolveDilemma(s, inst, i);
      if (news) assert.ok(!unfilled(news), `${card.id} news: ${news}`);
      for (const sch of s.scheduled) {
        for (const t of [sch.news, sch.elseNews]) if (t) assert.ok(!unfilled(t), `${card.id} later: ${t}`);
      }
    });
  }
});

test('cards do not repeat until the pool is used up', () => {
  const game = newGame();
  const s = game.state;
  const seen = [];
  for (let i = 0; i < 12; i++) seen.push(drawDilemma(s).id);
  assert.equal(new Set(seen).size, seen.length);
});

test('every wish and thought fills its placeholders for both genders', () => {
  for (const female of [false, true]) {
    for (const w of WISHES) {
      const text = fillTemplate(w.text, { loc: 'v Spodnji vasi', Loc: 'V Spodnji vasi' }, female);
      assert.ok(!unfilled(text), `${w.id}: ${text}`);
    }
  }
  const game = newGame();
  const s = game.state;
  s.campaign = true;
  s.opponentId = 0;
  s.affair = 90;
  game.refreshUnrest();
  for (let i = 0; i < 400; i++) {
    for (const c of s.citizens) {
      c.thoughtTimer = 0;
    }
    game.tick(0.01);
    for (const c of s.citizens) assert.ok(!unfilled(c.thought), c.thought);
  }
});
