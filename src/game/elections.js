// Elections every term: campaign, opponent, vote, recount gamble and game over.

import { CONFIG } from '../config.js';
import { DISTRICTS } from './map.js';
import { characterName } from './citizens.js';
import { moodScore } from './stats.js';
import { clamp, pick } from './util.js';

export function monthsToElection(state) {
  return state.nextElectionAt - state.monthIndex;
}

/**
 * Called after every month change. Starts the campaign when it's time and
 * returns { campaignStarted, electionDue }.
 */
export function checkElectionCalendar(state) {
  const left = monthsToElection(state);
  let campaignStarted = false;
  if (!state.campaign && left <= CONFIG.elections.campaignMonths && left > 0) {
    state.campaign = true;
    // The unhappiest citizen decides to run against the mayor.
    const sorted = [...state.citizens].sort((a, b) => moodScore(a, state) - moodScore(b, state));
    state.opponentId = sorted[0].id;
    campaignStarted = true;
  }
  return { campaignStarted, electionDue: left <= 0 };
}

export function opponentLabel(state) {
  if (state.opponentId == null) return '';
  const c = state.citizens[state.opponentId];
  return `${c.name} (${characterName(c)})`;
}

/** Counts the votes. Returns per-district results and the total. */
export function runElection(state) {
  const thr = CONFIG.mood.supportThreshold;
  const low = CONFIG.mood.yellowAbove;
  const districts = DISTRICTS.map((d) => ({ name: d.name, mayor: 0, opponent: 0 }));
  for (const c of state.citizens) {
    let forMayor;
    if (c.id === state.opponentId) forMayor = false;
    else if (c.boughtVote) forMayor = true;
    else {
      const s = moodScore(c, state);
      if (s > thr) forMayor = true;
      // After a bribed withdrawal the unknown replacement doesn't convince even the angriest.
      else if (s < low) forMayor = state.opponentWithdrawn ? Math.random() < 0.5 : false;
      // Undecided voters lean towards the mayor the closer they are to supporting him.
      else forMayor = Math.random() < (s - low) / (thr - low);
    }
    districts[c.home][forMayor ? 'mayor' : 'opponent'] += 1;
  }
  const mayor = districts.reduce((n, d) => n + d.mayor, 0);
  const opponent = districts.reduce((n, d) => n + d.opponent, 0);
  return {
    districts,
    mayor,
    opponent,
    won: mayor >= CONFIG.elections.votesToWin,
    opponentName: opponentLabel(state),
    term: state.term,
  };
}

/** The mayor stays: a new, slightly harder term begins. */
export function startNewTerm(state) {
  state.term += 1;
  state.nextElectionAt = state.monthIndex + CONFIG.elections.termMonths;
  state.campaign = false;
  state.opponentId = null;
  state.extraEnvyDrift += CONFIG.elections.envyDriftPerTerm;
  // Campaign tricks are reset for the next campaign.
  state.votesBought = 0;
  state.bribeTried = false;
  state.opponentWithdrawn = false;
  for (const c of state.citizens) c.boughtVote = false;
}

/** Price of the next bought vote in this campaign. */
export function votePrice(state) {
  const e = CONFIG.elections;
  return e.voteBaseCost + e.voteCostStep * state.votesBought;
}

/** Can this citizen's vote be bought right now? Returns { ok, reason }. */
export function checkBuyVote(state, id) {
  const c = state.citizens[id];
  if (!state.campaign) return { ok: false, reason: 'Glasove se kupuje samo med kampanjo. Prej bi bilo sumljivo.' };
  if (id === state.opponentId) return { ok: false, reason: 'Protikandidata se ne da kupiti za en glas. Poskusi z večjo kuverto.' };
  if (c.boughtVote) return { ok: false, reason: `${c.name} je že kupljen${c.female ? 'a' : ''}. Dvakrat se ne plača.` };
  if (state.secret < votePrice(state)) return { ok: false, reason: 'Na skrivnem računu ni dovolj. Bratranec bo moral spet na razpis.' };
  return { ok: true };
}

export function buyVote(state, id) {
  const check = checkBuyVote(state, id);
  if (!check.ok) return check;
  const c = state.citizens[id];
  const price = votePrice(state);
  state.secret -= price;
  state.votesBought += 1;
  state.affair = clamp(state.affair + CONFIG.elections.voteAffair);
  c.boughtVote = true;
  return {
    ok: true,
    price,
    news: pick([
      `${c.name.split(' ')[0]} je dobil${c.female ? 'a' : ''} »darilni bon za gostilno«. Na volitvah bo vedel${c.female ? 'a' : ''}, kaj storiti.`,
      `Nekdo je ${c.name.split(' ')[0]} pustil kuverto v poštnem nabiralniku. Brez pošiljatelja. Z županovim nasmehom.`,
      `${c.name} je nenadoma postal${c.female ? 'a' : ''} velik${c.female ? 'a' : ''} podpornik${c.female ? 'ca' : ''} županove vizije.`,
    ]),
  };
}

export function checkBribe(state) {
  const e = CONFIG.elections;
  if (!state.campaign || state.opponentId == null) return { ok: false, reason: 'Protikandidata še ni. Počakaj na kampanjo.' };
  if (state.bribeTried) return { ok: false, reason: 'To ste v tej kampanji že poskusili. Drugič ne bo šlo.' };
  if (state.secret < e.bribeCost) return { ok: false, reason: 'Za tako kuverto na skrivnem računu ni dovolj denarja.' };
  return { ok: true };
}

/**
 * Offer the opponent money to withdraw. Expensive, may be refused (scandal),
 * and even a success may leak a month later.
 */
export function bribeOpponent(state) {
  const check = checkBribe(state);
  if (!check.ok) return check;
  const e = CONFIG.elections;
  const old = state.citizens[state.opponentId];
  state.secret -= e.bribeCost;
  state.bribeTried = true;

  if (Math.random() >= e.bribeChance) {
    state.affair = clamp(state.affair + e.bribeRefuseAffair);
    old.envy += 15;
    return {
      ok: true,
      success: false,
      news: `${old.name} je zavrnil${old.female ? 'a' : ''} kuverto in jo pokazal${old.female ? 'a' : ''} na televiziji. Denar je izginil, škandal pa ne.`,
    };
  }

  // The opponent withdraws; the next unhappiest citizen takes over the candidacy.
  const sorted = [...state.citizens].filter((c) => c.id !== old.id).sort((a, b) => moodScore(a, state) - moodScore(b, state));
  state.opponentId = sorted[0].id;
  state.opponentWithdrawn = true;
  old.boughtVote = true;
  state.scheduled.push({
    in: 1,
    chance: e.bribeLeakChance,
    effect: { affair: e.bribeLeakAffair },
    news: `Novinar je odkril, zakaj je ${old.name} odstopil${old.female ? 'a' : ''} od kandidature. »Zdravstveni razlogi« so imeli obliko kuverte.`,
    ctx: {},
  });
  return {
    ok: true,
    success: true,
    news: `${old.name} je odstopil${old.female ? 'a' : ''} od kandidature »iz zdravstvenih razlogov«. Kandidaturo je prevzel${state.citizens[state.opponentId].female ? 'a' : ''} ${state.citizens[state.opponentId].name}.`,
  };
}

export function canRecount(state) {
  return !state.recountUsed && state.secret >= CONFIG.elections.recountCost;
}

/** Recount gamble. Returns true if the mayor keeps the job. */
export function recount(state) {
  const e = CONFIG.elections;
  state.recountUsed = true;
  state.secret -= e.recountCost;
  state.affair = clamp(state.affair + e.recountAffair);
  return Math.random() < e.recountChance;
}

/** Final screen data: score and a funny epilogue depending on how the mayor ruled. */
export function epilogue(state) {
  const s = state.stats;
  const lines = [];
  if (state.secret >= 50000) lines.push('Bivši župan zdaj živi na Maldivih. Uradno je na »študijskem dopustu«.');
  if (s.roundabouts >= 3) lines.push('Zgornjim Žlampam zdaj svetuje pri gradnji krožišč. Zgradili so jih že sedem.');
  if (s.parties >= 3) lines.push('Vodi gasilski ansambel »Zadnja veselica«. Igrajo vsako soboto, tudi ko jih nihče ne povabi.');
  if (s.cousins >= 5) lines.push('Bratranec je postal direktor občinskega podjetja. Po naključju.');
  if (state.affair >= 60) lines.push('Komisija za preprečevanje korupcije ga je povabila na kavo. Kava traja že tretje leto.');
  if (s.burned >= 2) lines.push('Na mestu pogorišč stojijo spominske plošče. Na vseh piše »Saj ni bilo nič«.');
  if (lines.length < 2) {
    lines.push(
      pick([
        'Zdaj prodaja zavarovanja v Zgornjih Žlampah. Pravi, da je to »podobno delo, le bolj pošteno«.',
        'Napisal je memoare z naslovom »Vse sem naredil prav«. Prodali so tri izvode, vse bratrancu.',
        'Ob nedeljah sedi v gostilni in razlaga, kako bi bilo, če bi ga izvolili.',
      ]),
    );
  }
  return {
    years: Math.floor(state.monthIndex / 12),
    months: state.monthIndex % 12,
    terms: state.term,
    built: s.built,
    roundabouts: s.roundabouts,
    parties: s.parties,
    wishes: s.wishesFulfilled,
    secret: state.secret,
    lines,
  };
}
