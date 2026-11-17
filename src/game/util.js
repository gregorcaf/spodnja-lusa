// Small shared helpers for game logic.

export const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

export const randFloat = (min, max) => min + Math.random() * (max - min);

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Groups thousands with dots, also for 4-digit numbers (Intl skips those for sl-SI). */
export function groupThousands(n) {
  return String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Formats euros the Slovenian way, e.g. "60.000 €" or "−1.200 €". */
export function formatEuro(n, { sign = false } = {}) {
  const abs = groupThousands(n);
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : '';
  return `${prefix}${abs} €`;
}

/** Formats a signed number with a proper minus sign, e.g. "+12" or "−3". */
export function formatSigned(n, digits = 0) {
  const r = Number(n.toFixed(digits));
  if (r === 0) return '0';
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toLocaleString('sl-SI', { maximumFractionDigits: digits })}`;
}

/**
 * Fills a text template. Replaces {key} tokens from `vars` and resolves
 * gender alternatives written as {male|female}.
 */
export function fillTemplate(text, vars = {}, female = false) {
  return text
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (female ? f : m))
    .replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}
