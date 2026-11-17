// Mouse-following tooltip (citizen name/thought, construction forecast).

const el = () => document.getElementById('tooltip');

export function showTooltip(html, clientX, clientY) {
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

export function hideTooltip() {
  el().hidden = true;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
