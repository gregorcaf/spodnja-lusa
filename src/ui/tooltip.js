// Mouse-following tooltip (citizen name/thought, construction forecast).

const el = () => document.getElementById('tooltip');

// Who currently shows the tooltip ('map' or 'help'), so one source doesn't hide the other's.
let owner = null;

export function showTooltip(html, clientX, clientY, by = 'map') {
  owner = by;
  const t = el();
  t.innerHTML = html;
  t.hidden = false;
  const pad = 16;
  const rect = t.getBoundingClientRect();
  let x = clientX + pad;
  let y = clientY + pad;
  if (x + rect.width > window.innerWidth - 8) x = clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 8) y = clientY - rect.height - pad;
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
}

/** Hides the tooltip; with `by` only if that source is showing it. */
export function hideTooltip(by = null) {
  if (by && owner !== by) return;
  el().hidden = true;
  owner = null;
}

/** Shows rich help on hover over `target`; `getHtml` is called on every move so it stays current. */
export function attachHelp(target, getHtml) {
  const show = (e) => {
    const html = getHtml(e);
    if (html) showTooltip(html, e.clientX, e.clientY, 'help');
    else hideTooltip('help');
  };
  target.addEventListener('mouseenter', show);
  target.addEventListener('mousemove', show);
  target.addEventListener('mouseleave', () => hideTooltip('help'));
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
