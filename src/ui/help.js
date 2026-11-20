// Hover help for build tools, levers and top-bar values (Slovenian player-facing text).
// Numbers come from CONFIG, so the help always matches the current settings.

import { CONFIG } from '../config.js';
import { TOOL_INFO, LEVER_TEXTS } from '../game/texts.js';
import { formatEuro, formatSigned } from '../game/util.js';
import { escapeHtml } from './tooltip.js';
import { taxRate, taxHappiness } from '../game/taxes.js';
import { population, households, householdsPer } from '../game/population.js';
import { NEEDS_ROAD } from '../game/roads.js';
import { findFirehouses, mostEnviousDistrict } from '../game/levers.js';
import { DISTRICTS } from '../game/map.js';
import { EDU_TIERS, educationLevel } from '../game/education.js';

// One short sentence each; the numbers below it do the explaining.
const BUILDING_DESC = {
  road: 'Brez ceste ni sprehoda – in ni opravljanja sosedov.',
  house: 'Novi prebivalci in davek. In nove pritožbe.',
  roundabout: 'Ponos vsakega konca, s kipom na sredini.',
  firehouse: 'Dom gasilcev in veselic.',
  hall: 'Velika, draga in brez jasnega namena.',
  inn: 'Denar in dobra volja.',
  factory: 'Največ denarja v občini. In smradu.',
  clinic: 'Vsi ga potrebujejo, zato ni fovšije.',
  police: 'Kjer je policija, nič ne zgori.',
  shop: 'Kruh, mleko in vse novice.',
  vineyard: 'Jeseni trgatev, vse leto degustacije.',
  cemetery: 'Nihče ga ne želi pred hišo.',
  flats: 'Pet gospodinjstev na enem kupu.',
  tower: 'Dvanajst gospodinjstev in senca za ves konec.',
  kindergarten: 'Prva stopnica do pametnejše občine.',
  school: 'Pismeni krajani pišejo daljše pritožbe.',
  highschool: 'Mladina ostane doma, vsaj do mature.',
  faculty: 'Doktorji znanosti in najvišja dodana vrednost.',
};

const LEVER_DESC = {
  cousin: 'Posel za bratranca, del denarja nazaj v žep.',
  praise: 'Glasilo hvali župana. Nergači so jezni.',
  neighbor: 'V Zgornjih Žlampah je še slabše!',
  snow: 'Mediji fotografirajo sneg namesto afer.',
  party: 'Vsi gredo plesat k gasilskemu domu.',
  media: 'Mediji pišejo samo še o bučah.',
  minister: 'Drago kosilo in upanje na denar.',
  holiday: 'Enkrat na leto vsi praznujejo skupaj.',
  contest: 'Tekma z Žlampami: jeza gre čez mejo.',
  assembly: 'Župan posluša najbolj fovšljiv konec.',
};

const line = (label, value, cls = '') => `<div class="tt-line ${cls}"><span>${label}</span><span>${value}</span></div>`;
const pct = (m) => `${Math.round(m * 100)} %`;

/** Help for a build tool. */
export function toolHelp(id, game) {
  const info = TOOL_INFO[id];
  if (id === 'inspect') {
    return `<div class="tt-title">${info.icon} ${info.name}</div><div class="tt-desc">Klikni občana, stavbo ali cesto.</div>`;
  }
  if (id === 'demolish') {
    return `<div class="tt-title">${info.icon} ${info.name}</div><div class="tt-desc">Podre, kar klikneš. Cerkve ne.</div>${line('Cena', formatEuro(CONFIG.demolish.cost))}`;
  }
  const b = CONFIG.buildings[id];
  const monthly = b.income
    ? line('Prihodek', `${formatEuro(b.income, { sign: true })}/mes`, 'good')
    : householdsPer(id)
      ? line('Davek', `${formatEuro(taxRate(game.state) * householdsPer(id), { sign: true })}/mes`, 'good')
      : b.upkeep
          ? line('Vzdrževanje', `${formatEuro(-b.upkeep)}/mes`)
          : '';
  const where = id === 'road' ? 'Povleci z miško.' : id === 'roundabout' ? 'Na cesto.' : NEEDS_ROAD.has(id) ? 'Ob cesti.' : '';
  return `<div class="tt-title">${info.icon} ${info.name}</div>
    <div class="tt-desc">${BUILDING_DESC[id]}</div>
    ${line('Cena', formatEuro(b.cost))}
    ${monthly}
    ${b.homeHappy ? line('😊 tukaj', formatSigned(b.homeHappy), b.homeHappy > 0 ? 'good' : 'bad') : ''}
    ${b.envyElse ? line('😒 drugod', formatSigned(b.envyElse), b.envyElse > 0 ? 'bad' : 'good') : ''}
    ${b.allHappy ? line('😊 vsi', formatSigned(b.allHappy), b.allHappy > 0 ? 'good' : 'bad') : ''}
    ${householdsPer(id) ? line('👥', `+${householdsPer(id) * CONFIG.population.perHousehold}`, 'good') : ''}
    ${id === 'factory' ? line('Pogoj', `👥 ${CONFIG.population.factoryMin}`, population(game.state) >= CONFIG.population.factoryMin ? 'good' : 'bad') : ''}
    ${serviceLines(id, game)}
    ${where ? `<div class="tt-muted">${where}</div>` : ''}`;
}

/** Extra rules of the public buildings (services.js), as short lines. */
function serviceLines(id, game) {
  const s = CONFIG.services;
  const pop = population(game.state);
  switch (id) {
    case 'clinic':
      return line('Pogoj', `👥 ${s.clinicMin}`, pop >= s.clinicMin ? 'good' : 'bad') + line('😊 vsi', `${formatSigned(s.clinicMonthlyHappy)}/mes`, 'good');
    case 'police':
      return line('Neredi', 'tu nič ne zgori', 'good');
    case 'shop':
      return line('😊 tukaj', `${formatSigned(s.shopMonthlyHappy)}/mes`, 'good');
    case 'vineyard':
      return line('Trgatev', formatEuro(s.vineyardHarvest, { sign: true }), 'good') + line('Veselica', 'boljša', 'good');
    case 'cemetery':
      return line('Brez njega', `od 👥 ${s.cemeteryNeededAt}: 😊 vsi ${formatSigned(s.cemeteryMissingHappy)}/mes`, 'bad');
    default:
      return eduLines(id, game, pop);
  }
}

/** Education ladder: condition and the € per household this step unlocks. */
function eduLines(id, game, pop) {
  const tier = EDU_TIERS.indexOf(id);
  if (tier < 0) return '';
  const e = CONFIG.education;
  const prev = EDU_TIERS[tier - 1];
  const level = educationLevel(game.state);
  return (
    line('Pogoj', `👥 ${e.minPop[id]}`, pop >= e.minPop[id] ? 'good' : 'bad') +
    (prev ? line('Pred tem', `${TOOL_INFO[prev].icon} ${TOOL_INFO[prev].name}`, level >= tier ? 'good' : 'bad') : '') +
    line('💶', `${formatEuro(e.perHousehold[tier + 1], { sign: true })}/gospodinjstvo/mes`, 'good')
  );
}

/** Help for a mayor's lever: what it does, in numbers, and why it's greyed out (if it is). */
export function leverHelp(id, game) {
  const t = LEVER_TEXTS[id];
  const c = CONFIG.levers[id];
  const s = game.state;
  const m = s.leverMult[id];
  const n = (v) => (v * (m ?? 1)).toFixed(1).replace('.', ',').replace(',0', '');
  const lines = [line('Cena', `${t.fromSecret ? '🤫 ' : ''}${formatEuro(c.cost)}`)];
  switch (id) {
    case 'cousin':
      lines.push(line('🤫', `+${formatEuro(c.secretMin * (m ?? 1))} do ${formatEuro(c.secretMax * (m ?? 1))}`, 'good'));
      lines.push(line('Ta mesec', `${s.cousinThisMonth || 0} / ${c.perMonth}`, (s.cousinThisMonth || 0) >= c.perMonth ? 'bad' : ''));
      lines.push(line('🕵️', `+${c.affairMin} do +${c.affairMax}`, 'bad'));
      break;
    case 'praise':
      lines.push(line('👍', `+${n(c.propaganda)}`, 'good'));
      lines.push(line('😒 nergači', `+${c.grumblerEnvy}`, 'bad'));
      break;
    case 'neighbor':
      lines.push(line('😒 vsi', `−${n(c.envyReduction)}`, 'good'));
      break;
    case 'snow':
      lines.push(line('😊 vsi', formatSigned(c.happiness), 'bad'));
      lines.push(line('🤫', formatEuro(c.secret, { sign: true }), 'good'));
      lines.push(line('🕵️', formatSigned(c.affair), 'good'));
      break;
    case 'party':
      lines.push(line('😒 vsi', `−${n(c.envyReduction)}`, 'good'));
      lines.push(line('😊 vsi', `+${n(c.happiness)}`, 'good'));
      lines.push(line('🕵️', formatSigned(c.affair), 'good'));
      break;
    case 'media':
      lines.push(line('🕵️', `−${n(-c.affair)}`, 'good'));
      break;
    case 'holiday':
      lines.push(line('😒 vsi', `−${c.envyReduction}`, 'good'));
      lines.push(line('😊 vsi', `+${c.happiness}`, 'good'));
      lines.push(line('👍', `+${c.propaganda}`, 'good'));
      lines.push(line('Znova', `čez ${c.cooldown} mes.`));
      break;
    case 'contest': {
      const win = Math.min(c.winMax, c.winBase + Math.max(0, findFirehouses(s).length - 1) * c.winPerFirehouse);
      lines.push(line('😒 vsi', `−${n(c.envyReduction)}`, 'good'));
      lines.push(line('Zmaga', `${pct(win)} · 😊 +${c.winHappy}`, 'good'));
      lines.push(line('Pretep', `${pct(c.brawlChance)} · 🕵️ +${c.brawlAffair}`, 'bad'));
      break;
    }
    case 'assembly': {
      const d = DISTRICTS[mostEnviousDistrict(s)];
      lines.push(line(`😒 ${d.name}`, `−${c.envyReduction}`, 'good'));
      lines.push(line('Želja', 'izpolni, sicer jeza nazaj', 'bad'));
      break;
    }
    case 'minister':
      lines.push(line(`Čez ${c.delay} mes.`, `${pct(c.chance)} za ${formatEuro(c.payout, { sign: true })}`, 'good'));
      break;
    default:
      break;
  }
  // Repeated use wears a lever out: only worth mentioning once it has.
  if (m !== undefined && m < 0.999) lines.push(line('Moč', pct(m), 'bad'));
  const check = game.canUseLever(id);
  const unavailable = check.ok ? '' : `<div class="tt-bad">${escapeHtml(check.reason)}</div>`;
  return `<div class="tt-title">${t.icon} ${t.name}</div><div class="tt-desc">${LEVER_DESC[id]}</div>${lines.join('')}${unavailable}`;
}

const STAT_HELP = {
  date: ['📅 Datum', 'Preslednica ustavi čas.'],
  budget: ['💰 Proračun', 'V oklepaju je mesečni izid.'],
  secret: ['🤫 Skrivni račun', 'Denar »za vsak primer«.'],
  affair: ['🕵️ Tveganje afere', () => `Od ${CONFIG.unrest.protestAt} % protesti, od ${CONFIG.unrest.riotAt} % neredi.`],
  happy: ['😊 Povprečna sreča', 'Kako zadovoljni so občani.'],
  envy: ['😒 Povprečna fovšija', 'Kako zavidajo drugim koncem.'],
  population: ['👥 Prebivalci', 'Več prebivalcev, več davka.'],
  support: ['👍 Podpora županu', 'Na volitvah potrebuješ več kot polovico.'],
  election: ['🗳️ Volitve', 'Vsaka 4 leta.'],
};

export function statHelp(key) {
  const h = STAT_HELP[key];
  if (!h) return null;
  const text = typeof h[1] === 'function' ? h[1]() : h[1];
  return `<div class="tt-title">${h[0]}</div><div class="tt-desc">${text}</div>`;
}

/** Help for the tax control. */
export function taxHelp(game) {
  const rate = taxRate(game.state);
  const happy = taxHappiness(rate);
  return `<div class="tt-title">💶 Davek na gospodinjstvo</div>
    <div class="tt-desc">Več davka, več denarja – in bolj sitni občani.</div>
    ${line('Zdaj', `${formatEuro(rate)} · ${formatEuro(rate * households(game.state), { sign: true })}/mes`)}
    ${line('😊 vsi', `${formatSigned(happy, 1)}/mes`, happy < -0.05 ? 'bad' : happy > 0.05 ? 'good' : '')}`;
}
