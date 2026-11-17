// One shared Web Audio context for music and sound effects (browsers limit how many a page may open).

let ctx = null;

export function getAudioContext() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function hasAudioContext() {
  return ctx !== null;
}

// Silence everything while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend();
  else ctx.resume();
});
