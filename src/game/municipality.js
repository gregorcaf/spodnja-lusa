// The municipality's name, chosen by the player at the start of a new game.
// Slovenian names decline, so texts never put the name itself in another case: they always
// say »občina X« / »v občini X« / »občine X« and only »občina« changes – the way official
// texts do it. Templates use the placeholders below; old saves without a name read »naša občina«.

/** Made-up names offered at the start (🎲 picks another). */
export const NAME_SUGGESTIONS = [
  'Spodnja Luša',
  'Zgornje Žabje Blato',
  'Mala Fovšija',
  'Velike Mlakuže',
  'Dolnje Prepirje',
  'Sveti Bratranec',
  'Nova Kuverta',
  'Kozja Gorica pri Tovarni',
  'Spodnje Krtince',
  'Gornja Čakalnica',
  'Zgornja Birokracija',
  'Velika Afera',
  'Spodnje Podkupnine',
  'Mala Žlahta',
  'Dolnji Razpis',
  'Sveti Žig',
  'Velike Obljube',
  'Mali Proračun',
  'Gornje Govorice',
  'Spodnja Kavica',
  'Nova Pritožba',
  'Stara Klobasa',
  'Zgornje Krožišče',
  'Mala Veselica',
  'Dolnje Opravljanje',
  'Velika Kuverta pri Občini',
  'Spodnji Sklep',
  'Zgornja Seja',
  'Sveti Bager',
  'Mlakuže ob Asfaltu',
  'Gornji Vrtiček',
  'Spodnje Hruške pri Sosedu',
  'Velike Koline',
  'Dolnji Zapisnik',
  'Mala Ograja',
];

export const MAX_NAME_LENGTH = 32;

export function randomName(except = null) {
  const pool = NAME_SUGGESTIONS.filter((n) => n !== except);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Small words that stay lower case inside a place name (»Kozja Gorica pri Tovarni«).
const LOWER = new Set(['pri', 'na', 'ob', 'v', 'nad', 'pod', 'in', 'za', 'od', 'do', 's', 'z']);

/**
 * Tidies what the player typed: trimmed, single spaces, not too long, and capitalised like a
 * place name (»spodnja luša« → »Spodnja Luša«). Words typed with capitals stay as they are.
 */
export function cleanName(text) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  return t
    .split(' ')
    .filter(Boolean)
    .map((w, i) => (w !== w.toLowerCase() || (i > 0 && LOWER.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** All the ways texts refer to the municipality. */
export function municipalityForms(state) {
  const n = state?.municipality;
  if (!n) {
    return { obcina: 'naša občina', Obcina: 'Naša občina', obcine: 'naše občine', obcini: 'naši občini', obcino: 'našo občino', ime: 'Naša občina' };
  }
  return { obcina: `občina ${n}`, Obcina: `Občina ${n}`, obcine: `občine ${n}`, obcini: `občini ${n}`, obcino: `občino ${n}`, ime: n };
}

const PLACEHOLDER = /\{(obcina|Obcina|obcine|obcini|obcino|ime)\}/g;

/** Fills {obcina}, {Obcina}, {obcine}, {obcini}, {obcino} and {ime} in a text. */
export function withMunicipality(text, state) {
  if (typeof text !== 'string' || !text.includes('{')) return text;
  const forms = municipalityForms(state);
  return text.replace(PLACEHOLDER, (_, key) => forms[key]);
}

/** Title for the top bar and the browser tab, e.g. »Občina Spodnja Luša«. */
export function municipalityTitle(state) {
  return municipalityForms(state).Obcina;
}
