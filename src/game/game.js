// Game facade: owns the state and exposes actions. No rendering or DOM here.
//
// Events:
//   'tile'        { x, y }        a tile changed
//   'state'       –               numbers changed (budget, moods, ...)
//   'thoughts'    –               some citizen thoughts changed
//   'news'        string          a news item for the ticker
//   'snow'        boolean         snow started/ended
//   'party-start' { x, y }
//   'party-end'   –
//   'month'       report
//   'config'      –               CONFIG was edited (dev panel)

import { CONFIG } from '../config.js';
import { Emitter } from './events.js';
import { createGrid } from './map.js';
import { createCitizens, pickThought, tickThoughts } from './citizens.js';
import { performAction, forecast, checkAction } from './building.js';
import { useLever, checkLever } from './levers.js';
import { advanceMonth } from './month.js';

export function createState() {
  const state = {
    year: 2026,
    month: 3, // April (0-based)
    budget: CONFIG.economy.startBudget,
    secret: 0,
    affair: CONFIG.start.affairRisk,
    propaganda: 0,
    grid: createGrid(),
    citizens: createCitizens(),
    leverMult: { praise: 1, neighbor: 1, party: 1 },
    snow: false,
    party: null, // { x, y, remaining }
  };
  for (const c of state.citizens) c.thought = pickThought(c, state);
  return state;
}

export class Game extends Emitter {
  constructor() {
    super();
    this.state = createState();
  }

  forecast(tool, x, y) {
    return forecast(this.state, tool, x, y);
  }

  canAct(tool, x, y) {
    return checkAction(this.state, tool, x, y);
  }

  act(tool, x, y) {
    const res = performAction(this.state, tool, x, y);
    if (!res.ok) return res;
    this.emit('tile', { x, y });
    // Demolishing the firehouse that hosts the party ends the party.
    const p = this.state.party;
    if (p && p.x === x && p.y === y && res.removed === 'firehouse') this.endParty();
    this.emit('news', res.news);
    this.emit('state');
    return res;
  }

  canUseLever(id) {
    return checkLever(this.state, id);
  }

  useLever(id) {
    const res = useLever(this.state, id);
    if (!res.ok) return res;
    if (id === 'snow') this.emit('snow', true);
    if (id === 'party') this.emit('party-start', { x: this.state.party.x, y: this.state.party.y });
    this.emit('news', res.news);
    this.emit('state');
    return res;
  }

  endParty() {
    if (!this.state.party) return;
    this.state.party = null;
    this.emit('party-end');
    this.emit('state');
  }

  nextMonth() {
    const wasSnowing = this.state.snow;
    const report = advanceMonth(this.state);
    if (wasSnowing) this.emit('snow', false);
    this.emit('state');
    this.emit('month', report);
    return report;
  }

  /** Real-time tick: rotates thoughts and runs the party timer. */
  tick(dt) {
    if (tickThoughts(this.state, dt)) this.emit('thoughts');
    const p = this.state.party;
    if (p) {
      p.remaining -= dt;
      if (p.remaining <= 0) this.endParty();
    }
  }

  configChanged() {
    this.emit('config');
    this.emit('state');
  }
}
