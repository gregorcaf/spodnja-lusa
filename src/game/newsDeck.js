// Filler news for the ticker, dealt like a shuffled deck: every story comes once per
// round in random order, the season's own stories are mixed in, and the last story of
// one round never opens the next one.

import { FIXED_NEWS, SEASON_NEWS } from './texts.js';
import { shuffle } from './util.js';

export class NewsDeck {
  /** @param season () => 'winter' | 'spring' | 'summer' | 'autumn' */
  constructor(season = () => null) {
    this.season = season;
    this.cards = [];
    this.last = null;
  }

  next() {
    if (!this.cards.length) this.deal();
    this.last = this.cards.pop();
    return this.last;
  }

  /** A fresh round; the season is read now, so seasonal stories follow the calendar. */
  deal() {
    this.cards = shuffle([...FIXED_NEWS, ...(SEASON_NEWS[this.season()] || [])]);
    // Cards are taken from the end: don't start the round with the story just shown.
    const top = this.cards.length - 1;
    if (top > 0 && this.cards[top] === this.last) [this.cards[0], this.cards[top]] = [this.cards[top], this.cards[0]];
  }
}
