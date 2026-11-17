// Shared modal dialog in #modal. Only one is shown at a time.

export function openModal(html, { className = '' } = {}) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="report ${className}" role="dialog" aria-modal="true">${html}</div>`;
  modal.hidden = false;
  const close = () => {
    modal.hidden = true;
    modal.innerHTML = '';
  };
  return { el: modal.firstElementChild, close };
}

export function modalOpen() {
  return !document.getElementById('modal').hidden;
}
