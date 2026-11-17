// Hover help for build tools, levers and top-bar values (Slovenian player-facing text).
// Numbers come from CONFIG, so the help always matches the current settings.

import { CONFIG } from '../config.js';
import { TOOL_INFO, LEVER_TEXTS } from '../game/texts.js';
import { formatEuro, formatSigned } from '../game/util.js';
import { escapeHtml } from './tooltip.js';
import { taxRate, taxHappiness } from '../game/taxes.js';

const BUILDING_DESC = {
  road: 'Po cestah se sprehajajo občani. Brez ceste ni sprehoda, brez sprehoda ni opravljanja sosedov.',
  house: 'Nova hiša prinaša davek. Občanov ne pride več, pritožb pa.',
  roundabout: 'Ponos vsakega konca, s kipom na sredini. Postaviš ga lahko samo na obstoječo cesto.',
  firehouse: 'Dom gasilcev. Brez njega ni gasilske veselice.',
  hall: 'Velika, draga in brez jasnega namena. Domači so ponosni, vsi ostali zelo fovšni.',
  inn: 'Prinaša denar in dobro voljo. Sosedje jo obožujejo, ostali so fovšni.',
  factory: 'Največ denarja v občini, a smrdi. Domači so nesrečni, ostali fovšni zaradi delovnih mest.',
};

const LEVER_DESC = {
  cousin:
    'Občinski posel dobi bratrančevo podjetje, del denarja pa se »vrne« na skrivni račun. Z njim lahko kasneje kupuješ naklonjenost, glasove ali kosilo z ministrom.',
  praise: 'Občinsko glasilo na 24 straneh hvali župana. Propaganda dvigne podporo, nergači pa se razjezijo.',
  neighbor: 'Glasilo pokaže, da je v Zgornjih Žlampah še slabše. Fovšija vseh pade in se preusmeri na sosede.',
  snow: 'Sneg sredi pomladi. Občani so slabe volje, zimska služba zasluži, mediji pa namesto afer fotografirajo sneg.',
  party: 'Vsi gredo plesat k gasilskemu domu. Fovšija pade, sreča zraste, na afere vsi pozabijo.',
  media: 'Lokalni mediji nenadoma pišejo samo še o rekordnih bučah. Plačaš iz skrivnega računa.',
  minister: 'Ministra pelješ na drago kosilo. Plačaš iz skrivnega računa in upaš, da se spomni na našo občino.',
};

const line = (label, value, cls = '') => `<div class="tt-line ${cls}"><span>${label}</span><span>${value}</span></div>`;
const pct = (m) => `${Math.round(m * 100)} %`;

/** Help for a build tool. */
export function toolHelp(id, game) {
  const info = TOOL_INFO[id];
  if (id === 'inspect') {
    return `<div class="tt-title">${info.icon} ${info.name}</div>
      <div class="tt-desc">Župan gre med ljudi. Klikni občana (kaj misli, kaj si želi, rokovanje), stavbo (izboljšave, otvoritev) ali cesto, da se župan sprehodi tja. Po vsaki gradnji se igra samodejno vrne sem.</div>`;
  }
  if (id === 'demolish') {
    return `<div class="tt-title">${info.icon} ${info.name}</div>
      <div class="tt-desc">Podre objekt na izbranem polju. Učinek je odvisen od tega, kaj podreš: podrta hiša razžalosti sosede, podrta tovarna pa jih razveseli. Cerkve ni mogoče podreti.</div>
      ${line('Cena', formatEuro(CONFIG.demolish.cost))}`;
  }
  const b = CONFIG.buildings[id];
  const monthly = b.income
    ? line('Prihodek', `${formatEuro(b.income, { sign: true })}/mes`, 'good')
    : id === 'house'
      ? line('Davek', `${formatEuro(taxRate(game.state), { sign: true })}/mes`, 'good')
      : line('Vzdrževanje', `${formatEuro(-b.upkeep)}/mes`);
  return `<div class="tt-title">${info.icon} ${info.name}</div>
    <div class="tt-desc">${BUILDING_DESC[id]}</div>
    ${line('Cena', formatEuro(b.cost))}
    ${monthly}
    ${b.homeHappy ? line('Sreča v tem koncu', formatSigned(b.homeHappy)) : ''}
    ${b.envyElse ? line('Fovšija drugod', `${formatSigned(b.envyElse)} (nasprotni konec ×${String(CONFIG.envy.oppositeMultiplier).replace('.', ',')})`) : ''}
    ${b.allHappy ? line('Sreča vseh', formatSigned(b.allHappy)) : ''}
    <div class="tt-muted">${id === 'roundabout' ? 'Samo na obstoječo cesto.' : 'Gradi se na travnik.'}</div>`;
}

/** Help for a mayor's lever, including its current strength and availability. */
export function leverHelp(id, game) {
  const t = LEVER_TEXTS[id];
  const c = CONFIG.levers[id];
  const s = game.state;
  const m = s.leverMult[id];
  const lines = [];
  const from = t.fromSecret ? ' (skrivni račun)' : '';
  lines.push(line('Cena', `${formatEuro(c.cost)}${from}`));

  switch (id) {
    case 'cousin':
      lines.push(line('Skrivni račun', `+${formatEuro(c.secretMin)} do ${formatEuro(c.secretMax)}`, 'good'));
      lines.push(line('Tveganje afere', `+${c.affairMin} do +${c.affairMax}`, 'bad'));
      break;
    case 'praise':
      lines.push(line('Propaganda', `+${(c.propaganda * m).toFixed(1).replace('.', ',')}${s.campaign ? ` ×${CONFIG.elections.campaignPraiseBoost} (kampanja)` : ''}`, 'good'));
      lines.push(line('Fovšija nergačev', `+${c.grumblerEnvy}`, 'bad'));
      break;
    case 'neighbor':
      lines.push(line('Fovšija vseh', `−${(c.envyReduction * m).toFixed(1).replace('.', ',')}`, 'good'));
      break;
    case 'snow':
      lines.push(line('Sreča vseh', formatSigned(c.happiness), 'bad'));
      lines.push(line('Skrivni račun', formatEuro(c.secret, { sign: true }), 'good'));
      lines.push(line('Tveganje afere', formatSigned(c.affair), 'good'));
      lines.push(line('Trajanje', 'do konca meseca, občani hodijo počasi'));
      lines.push('<div class="tt-muted">Pozimi sneg nikogar ne preseneti: nič na skrivni račun, tveganje afere ostane, sreča pade le za polovico.</div>');
      break;
    case 'party':
      lines.push(line('Fovšija vseh', `−${(c.envyReduction * m).toFixed(1).replace('.', ',')}`, 'good'));
      lines.push(line('Sreča vseh', `+${(c.happiness * m).toFixed(1).replace('.', ',')}`, 'good'));
      lines.push(line('Tveganje afere', formatSigned(c.affair), 'good'));
      lines.push(line('Pogoj', 'vsaj en gasilski dom'));
      break;
    case 'media':
      lines.push(line('Tveganje afere', `−${(-c.affair * m).toFixed(1).replace('.', ',')}`, 'good'));
      break;
    case 'minister':
      lines.push(line(`Čez ${c.delay} mes.`, `${pct(c.chance)} možnosti za ${formatEuro(c.payout, { sign: true })}`, 'good'));
      break;
    default:
      break;
  }

  // Strength that wears off with repeated use.
  if (m !== undefined && c.decay) {
    const recovery = c.recovery ? `, obnovi se za ${pct(c.recovery)} na mesec` : ', ne obnovi se';
    lines.push(`<div class="tt-muted">Trenutna moč ${pct(m)}. Vsaka uporaba jo zmanjša na ${pct(c.decay)}${recovery}.</div>`);
  }
  if (id === 'cousin') {
    lines.push(`<div class="tt-muted">Pri ${CONFIG.unrest.protestAt} % tveganja se začnejo protesti, pri ${CONFIG.unrest.riotAt} % neredi.</div>`);
  }

  const check = game.canUseLever(id);
  const unavailable = check.ok ? '' : `<div class="tt-bad">${escapeHtml(check.reason)}</div>`;
  return `<div class="tt-title">${t.icon} ${t.name}</div><div class="tt-desc">${LEVER_DESC[id]}</div>${lines.join('')}${unavailable}`;
}

const STAT_HELP = {
  date: ['Datum', 'Čas teče sam. Gumbi ⏸ 1× 2× 3× uravnavajo hitrost, preslednica ustavi igro.'],
  budget: ['Proračun', 'Občinski denar za gradnjo in vzvode. V oklepaju je pričakovani mesečni saldo: prihodki (osnova, davki, gostilne, tovarne) minus stroški (uprava, vzdrževanje).'],
  secret: ['Skrivni račun', 'Denar »za vsak primer«. Polni ga razpis za bratranca. Porabiš ga za kuverte, želje »iz žepa«, utišanje medijev, kosilo z ministrom, med kampanjo pa za nakup glasov.'],
  affair: ['Tveganje afere', 'Kako blizu je škandal. Narašča z razpisi za bratranca in kuvertami. Od 50 % protesti, od 80 % neredi. Zniža ga čas, sneg, veselica in utišanje medijev.'],
  happy: ['Povprečna sreča', () => `Kako zadovoljni so občani. Gradnja v njihovem koncu jo dvigne, s časom pa se sama vrača proti ${CONFIG.month.happinessTarget}.`],
  envy: ['Povprečna fovšija', () => `Kako zavidajo drugim koncem. Raste z gradnjo drugod in sama od sebe za ${String(CONFIG.month.envyDrift).replace('.', ',')} na mesec (»vedno kaj najdejo«).`],
  support: ['Podpora županu', 'Število občanov, pri katerih je sreča − 0,7 × fovšija + propaganda več kot 25. Zvesti občani (izpolnjena želja, kuverta) štejejo še dodatno. Na volitvah potrebuješ 13 glasov.'],
  election: ['Volitve', 'Vsaka 4 leta. Tri mesece prej se začne kampanja: protikandidat je najbolj nezadovoljen občan, glasilo deluje bolje, glasove je mogoče kupiti.'],
};

export function statHelp(key) {
  const h = STAT_HELP[key];
  if (!h) return null;
  const text = typeof h[1] === 'function' ? h[1]() : h[1];
  return `<div class="tt-title">${h[0]}</div><div class="tt-desc">${text}</div>`;
}

/** Help for the tax control in the sidebar. */
export function taxHelp(game) {
  const t = CONFIG.taxes;
  const rate = taxRate(game.state);
  return `<div class="tt-title">🏠 Davek na hišo</div>
    <div class="tt-desc">Koliko vsaka hiša mesečno plača občini. Več davka pomeni več denarja, a tudi bolj sitne občane.</div>
    ${line('Zdaj', `${formatEuro(rate)} na hišo`)}
    ${line('Vpliv na srečo', `${formatSigned(taxHappiness(rate), 1)} na mesec`, taxHappiness(rate) < 0 ? 'bad' : 'good')}
    <div class="tt-muted">Pri ${formatEuro(t.neutral)} je davek »normalen«. Vsakih 100 € več vzame ${String(t.happyPer100).replace('.', ',')} sreče na mesec, manj jo doda.</div>
    <div class="tt-muted">Od ${formatEuro(t.highAt)} občani godrnjajo, od ${formatEuro(t.veryHighAt)} besnijo: dodatna fovšija in več ljudi na protestih.</div>`;
}
