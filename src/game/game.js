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
//   'unrest'      { level, prev } protests/riots started or ended
//   'time'        –               speed changed (pause / 1× / 2× / 3×)
//   'dilemma'     card            a dilemma card must be answered (game is paused)
//   'wishes'      –               the list of wishes changed
//   'campaign'    { opponent }    the election campaign started
//   'election'    result          votes are counted (game is paused)
//   'gameover'    epilogue        the mayor lost for good
//   'mapevent'    { phase: 'start' | 'end', ... }   a live event on the map started or finished
//   'ribbon'      { x, y, kind }  scaffolding gone / ribbon waiting / ribbon cut / opening missed
//   'party-after' { drunk, incident }  drunk citizens and maybe an incident after the party
//   'config'      –               CONFIG was edited (dev panel)

import { CONFIG } from '../config.js';
import { Emitter } from './events.js';
import { createGrid } from './map.js';
import { createCitizens, pickThought, tickThoughts } from './citizens.js';
import { performAction, forecast, checkAction } from './building.js';
import { useLever, checkLever } from './levers.js';
import { advanceMonth } from './month.js';
import { unrestLevel, assignProtesters, protesterCount } from './unrest.js';
import { drawDilemma, presentDilemma, resolveDilemma, dueYearlyEvent } from './dilemmas.js';
import { spawnWish, payWish, checkBuildWishes } from './wishes.js';
import {
  checkElectionCalendar,
  runElection,
  startNewTerm,
  canRecount,
  recount,
  epilogue,
  opponentLabel,
  buyVote,
  bribeOpponent,
} from './elections.js';
import { UNREST } from './texts.js';
import { giveEnvelope } from './envelopes.js';
import { setTaxRate } from './taxes.js';
import { afterParty, tickDrunk } from './partyIncidents.js';
import { tickConstruction, cutRibbon, pendingRibbons } from './construction.js';
import { buyUpgrade } from './upgrades.js';
import { shakeHands, listen } from './mayor.js';
import { spawnMapEvent, advanceMapEvent, clickMapEvent, describeMapEvent, nextMapEventDelay } from './mapEvents.js';
import { randFloat } from './util.js';

export const SPEEDS = [0, 1, 2, 3];

export function createState() {
  const state = {
    year: 2026,
    month: 3, // April (0-based)
    monthIndex: 0, // months since the start of the game
    budget: CONFIG.economy.startBudget,
    secret: 0,
    affair: CONFIG.start.affairRisk,
    propaganda: 0,
    grid: createGrid(),
    citizens: createCitizens(),
    leverMult: { praise: 1, neighbor: 1, party: 1, media: 1 },
    snow: false,
    party: null, // { x, y, remaining }
    unrest: 'calm', // 'calm' | 'protest' | 'riot'
    speed: 1, // 0 = paused
    lastSpeed: 1, // speed to return to when unpausing
    monthProgress: 0, // 0..1 of the current month

    // Dilemma cards
    dilemma: null, // card instance waiting for an answer
    dilemmaTimer: randFloat(0.4, 1), // game-months until the next card (first one comes early)
    usedDilemmas: [],
    yearlyDone: {}, // yearly event id -> year it was shown

    // Live map events
    mapEvent: null,
    mapEventTimer: randFloat(0.3, 0.6), // the first one comes early
    modifiers: [], // lasting effects: { key, label, months, monthlyBudget?, blockLever? }
    scheduled: [], // delayed consequences

    // Wishes
    wishes: [],
    usedWishes: [],
    wishTimer: 0.3,

    // Elections
    term: 1,
    nextElectionAt: CONFIG.elections.termMonths,
    campaign: false,
    opponentId: null,
    extraEnvyDrift: 0,
    recountUsed: false,
    votesBought: 0, // this campaign
    envelopesThisYear: 0,
    bribeTried: false, // this campaign
    opponentWithdrawn: false,
    election: null, // result waiting for the player
    over: false,

    taxRate: CONFIG.taxes.start, // € per house per month, set by the mayor
    lastTaxRate: CONFIG.taxes.start,

    stats: { built: 0, roundabouts: 0, parties: 0, cousins: 0, wishesFulfilled: 0, burned: 0 },
  };
  for (const c of state.citizens) c.thought = pickThought(c, state);
  return state;
}

export class Game extends Emitter {
  /** @param {object|null} state a loaded save, or null for a new game */
  constructor(state = null) {
    super();
    this.state = state || createState();
  }

  /** True while the player must answer something (card, election). */
  get blocked() {
    const s = this.state;
    return !!(s.dilemma || s.election || s.over);
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
    this.refreshUnrest();
    // Demolishing the firehouse that hosts the party ends the party.
    const p = this.state.party;
    if (p && p.x === x && p.y === y && res.removed === 'firehouse') this.endParty();
    this.emit('news', res.news);
    this.afterTilesChanged();
    this.emit('state');
    return res;
  }

  /** Building wishes are fulfilled as soon as the right building appears. */
  afterTilesChanged() {
    const news = checkBuildWishes(this.state);
    for (const n of news) this.emit('news', n);
    if (news.length) this.emit('wishes', { fulfilled: news });
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
    this.refreshUnrest();
    this.emit('state');
    return res;
  }

  endParty() {
    if (!this.state.party) return;
    this.state.party = null;
    this.emit('party-end');
    // Alcohol: drunk citizens, and maybe a brawl, a crashed tanker, a photo or a hangover.
    const after = afterParty(this.state);
    if (after.incident) {
      for (const t of after.incident.tiles) this.emit('tile', t);
      if (after.incident.tiles.length) this.afterTilesChanged();
      this.emit('news', after.incident.news);
      this.refreshUnrest();
    }
    this.emit('party-after', after);
    this.emit('state');
  }

  nextMonth() {
    if (this.blocked) return null;
    const s = this.state;
    const wasSnowing = s.snow;
    const report = advanceMonth(s);
    if (wasSnowing) this.emit('snow', false);
    if (report.damage) {
      if (report.damage.x != null) this.emit('tile', { x: report.damage.x, y: report.damage.y });
      this.emit('news', report.damage.news);
    }
    for (const ev of report.events) {
      for (const t of ev.tiles) this.emit('tile', t);
      if (ev.news) this.emit('news', ev.news);
    }
    for (const n of report.wishNews) this.emit('news', n);
    if (report.events.some((e) => e.tiles.length)) this.afterTilesChanged();
    if (report.wishNews.length) this.emit('wishes', {});
    this.refreshUnrest();

    // A yearly event (Christmas fair, summer festival) comes early in its month.
    if (dueYearlyEvent(s)) s.dilemmaTimer = Math.min(s.dilemmaTimer, 0.3);

    const cal = checkElectionCalendar(s);
    if (cal.campaignStarted) {
      const opponent = opponentLabel(s);
      this.emit('news', `Začela se je volilna kampanja. Proti županu kandidira ${opponent}.`);
      this.emit('campaign', { opponent });
    }
    this.emit('state');
    this.emit('month', report);
    if (cal.electionDue) this.holdElection();
    return report;
  }

  // --- Dilemma cards -------------------------------------------------------

  presentDilemma() {
    return this.state.dilemma ? presentDilemma(this.state.dilemma, this.state) : null;
  }

  chooseDilemma(optionIndex) {
    const s = this.state;
    if (!s.dilemma) return;
    const { news, tiles } = resolveDilemma(s, s.dilemma, optionIndex);
    s.dilemma = null;
    for (const t of tiles) this.emit('tile', t);
    if (tiles.length) this.afterTilesChanged();
    if (news) this.emit('news', news);
    this.refreshUnrest();
    this.emit('state');
  }

  // --- Buildings: ribbons and upgrades --------------------------------------

  pendingRibbons() {
    return pendingRibbons(this.state);
  }

  cutRibbon(x, y) {
    const res = cutRibbon(this.state, x, y);
    if (!res.ok) return res;
    this.emit('tile', { x, y });
    this.emit('news', res.news);
    this.emit('ribbon', { x, y, kind: 'cut', news: res.news });
    this.emit('state');
    return res;
  }

  buyUpgrade(x, y, id) {
    const res = buyUpgrade(this.state, x, y, id);
    if (!res.ok) return res;
    this.emit('tile', { x, y });
    this.emit('news', res.news);
    this.emit('state');
    return res;
  }

  // --- The mayor in person --------------------------------------------------

  shakeHands(citizenId) {
    const res = shakeHands(this.state, citizenId);
    this.emit('state');
    return res;
  }

  listen(citizenId) {
    const res = listen(this.state, citizenId);
    if (res.wish) this.emit('wishes', {});
    this.emit('state');
    return res;
  }

  // --- Taxes ---------------------------------------------------------------

  setTaxRate(rate) {
    setTaxRate(this.state, rate);
    this.emit('state');
    return this.state.taxRate;
  }

  // --- Live map events -----------------------------------------------------

  describeMapEvent() {
    return describeMapEvent(this.state);
  }

  /** The mayor clicked the event on the map. */
  clickMapEvent() {
    const res = clickMapEvent(this.state);
    if (res) this.finishMapEvent(res);
    return res;
  }

  finishMapEvent(res) {
    for (const t of res.tiles) this.emit('tile', t);
    if (res.tiles.length) this.afterTilesChanged();
    this.emit('news', res.news);
    this.refreshUnrest();
    this.emit('mapevent', { phase: 'end', clicked: res.clicked, news: res.news, type: res.event.type });
    this.emit('state');
  }

  /** Test/debug helper: start a specific event now. */
  startMapEvent(type) {
    if (this.state.mapEvent) return null;
    const ev = spawnMapEvent(this.state, type);
    if (ev) this.emit('mapevent', { phase: 'start', info: describeMapEvent(this.state), type });
    return ev;
  }

  // --- Wishes --------------------------------------------------------------

  payWish(uid, fromSecret = false) {
    const res = payWish(this.state, uid, fromSecret);
    if (!res.ok) return res;
    this.emit('news', res.news);
    this.emit('wishes', { fulfilled: [res.news] });
    this.refreshUnrest();
    this.emit('state');
    return res;
  }

  giveEnvelope(citizenId) {
    const res = giveEnvelope(this.state, citizenId);
    if (!res.ok) return res;
    this.emit('news', res.news);
    this.refreshUnrest();
    this.emit('state');
    return res;
  }

  // --- Elections -----------------------------------------------------------

  holdElection() {
    const s = this.state;
    s.election = runElection(s);
    s.election.canRecount = !s.election.won && canRecount(s);
    if (s.election.won) {
      startNewTerm(s);
      this.emit('news', `Župan je zmagal na volitvah s ${s.election.mayor} glasovi od ${s.citizens.length}. Začenja se ${s.term}. mandat.`);
    }
    this.emit('election', s.election);
    this.emit('state');
  }

  buyVote(citizenId) {
    const res = buyVote(this.state, citizenId);
    if (!res.ok) return res;
    this.emit('news', res.news);
    this.refreshUnrest();
    this.emit('state');
    return res;
  }

  bribeOpponent() {
    const res = bribeOpponent(this.state);
    if (!res.ok) return res;
    this.emit('news', res.news);
    if (res.success) this.emit('campaign', { opponent: opponentLabel(this.state), replaced: true });
    this.refreshUnrest();
    this.emit('state');
    return res;
  }

  /** Closes the election screen after a win. */
  acknowledgeElection() {
    if (!this.state.election?.won) return;
    this.state.election = null;
    this.emit('state');
  }

  /** Recount gamble after a lost election. Returns true if the mayor stays. */
  requestRecount() {
    const s = this.state;
    if (!s.election || s.election.won || !canRecount(s)) return false;
    const kept = recount(s);
    if (kept) {
      s.election = null;
      startNewTerm(s);
      this.emit('news', 'Ponovno štetje je pokazalo, da je župan vendarle zmagal. Nekaj glasovnic je bilo »pomotoma« v kleti.');
      this.refreshUnrest();
      this.emit('state');
    } else {
      this.emit('news', 'Ponovno štetje je potrdilo poraz. Plus nekaj glasov več za opozicijo.');
      this.gameOver();
    }
    return kept;
  }

  acceptDefeat() {
    if (this.state.election && !this.state.election.won) this.gameOver();
  }

  gameOver() {
    const s = this.state;
    s.over = true;
    s.election = null;
    s.speed = 0;
    this.emit('time');
    this.emit('gameover', epilogue(s));
  }

  // --- Time ----------------------------------------------------------------

  /** Re-checks the unrest level after anything that may have moved the affair risk. */
  refreshUnrest() {
    const s = this.state;
    const level = unrestLevel(s);
    if (level === s.unrest) return;
    const prev = s.unrest;
    s.unrest = level;
    assignProtesters(s);
    const key = prev === 'riot' && level === 'protest' ? 'cooling' : level;
    this.emit('unrest', { level, prev, count: protesterCount(s), toast: UNREST[key].toast });
    this.emit('news', UNREST[key].news);
  }

  setSpeed(speed) {
    const s = this.state;
    if (s.over) return;
    if (speed > 0) s.lastSpeed = speed;
    s.speed = speed;
    this.emit('time');
  }

  togglePause() {
    this.setSpeed(this.state.speed ? 0 : this.state.lastSpeed);
  }

  /** Real-time tick: advances the calendar, cards and wishes, rotates thoughts, runs the party timer. */
  tick(dt) {
    const s = this.state;
    if (s.speed > 0 && !this.blocked) {
      const months = (dt * s.speed) / CONFIG.time.secondsPerMonth;
      s.monthProgress += months;
      if (s.monthProgress >= 1) this.nextMonth();

      // A new dilemma card every 1–2 months.
      s.dilemmaTimer -= months;
      if (s.dilemmaTimer <= 0 && !this.blocked) {
        s.dilemmaTimer = randFloat(CONFIG.dilemmas.minMonths, CONFIG.dilemmas.maxMonths);
        s.dilemma = drawDilemma(s);
        if (s.dilemma) this.emit('dilemma', this.presentDilemma());
      }

      // Scaffolding comes down; ribbons wait for the mayor.
      for (const ch of tickConstruction(s, months)) {
        this.emit('tile', { x: ch.x, y: ch.y });
        if (ch.news) this.emit('news', ch.news);
        this.emit('ribbon', ch);
        if (ch.kind === 'missed') this.emit('state');
      }

      // Live events on the map: one at a time.
      if (s.mapEvent) {
        const res = advanceMapEvent(s, months);
        if (res) this.finishMapEvent(res);
      } else {
        s.mapEventTimer -= months;
        if (s.mapEventTimer <= 0 && !this.blocked) {
          s.mapEventTimer = nextMapEventDelay();
          if (spawnMapEvent(s)) this.emit('mapevent', { phase: 'start', info: describeMapEvent(s), type: s.mapEvent.type });
        }
      }

      // Now and then somebody wants something.
      s.wishTimer -= months;
      if (s.wishTimer <= 0) {
        s.wishTimer = CONFIG.wishes.everyMonths * randFloat(0.7, 1.3);
        if (spawnWish(s)) this.emit('wishes', {});
      }
    }

    // While paused (or waiting for a decision) the whole municipality holds still.
    if (this.paused) return;
    tickDrunk(s, dt);
    if (tickThoughts(s, dt)) this.emit('thoughts');
    const p = s.party;
    if (p) {
      p.remaining -= dt;
      if (p.remaining <= 0) this.endParty();
    }
  }

  /** True when time is stopped: pause button, or a card/election waiting for an answer. */
  get paused() {
    return this.state.speed === 0 || this.blocked;
  }

}
