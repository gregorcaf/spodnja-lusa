// Scrolling news ticker: shuffled local news, with triggered news jumping the queue.

import { NewsDeck } from '../game/newsDeck.js';

const SPEED = 75; // px per second

export class NewsTicker {
  /** @param season () => current season key, so seasonal stories appear in their season */
  constructor(root, { season, format = (t) => t } = {}) {
    this.format = format;
    this.viewport = root.querySelector('.news-viewport');
    this.track = root.querySelector('.news-track');
    this.queue = [];
    this.deck = new NewsDeck(season);
    this.x = this.viewport.clientWidth * 0.3;
    this.items = []; // { el, width }
    this.width = 0;
  }

  push(text) {
    this.queue.push(text);
  }

  next() {
    if (this.queue.length) return { text: this.queue.shift(), hot: true };
    return { text: this.format(this.deck.next()), hot: false };
  }

  append() {
    const { text, hot } = this.next();
    const el = document.createElement('span');
    el.className = `news-item${hot ? ' hot' : ''}`;
    el.textContent = hot ? `NOVO: ${text}` : text;
    this.track.appendChild(el);
    const item = { el, width: el.offsetWidth };
    this.items.push(item);
    this.width += item.width;
  }

  update(dt) {
    this.x -= SPEED * dt;
    // Drop items that have scrolled out on the left.
    while (this.items.length && this.x + this.items[0].width < 0) {
      const first = this.items.shift();
      this.x += first.width;
      this.width -= first.width;
      first.el.remove();
    }
    // Keep the strip filled just past the right edge, so queued news appears soon.
    const view = this.viewport.clientWidth;
    let guard = 0;
    while (this.x + this.width < view + 40 && guard++ < 10) this.append();
    this.track.style.transform = `translateX(${this.x.toFixed(1)}px)`;
  }
}
