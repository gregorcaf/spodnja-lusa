// Short, self-dismissing notifications over the map.

const MAX_TOASTS = 3;

export function toast(message, kind = 'info', duration = 3600) {
  const root = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  root.appendChild(el);
  while (root.children.length > MAX_TOASTS) root.firstChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, duration);
}
