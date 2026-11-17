// Minimal event emitter used to notify render/UI layers about game changes.

export class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) for (const fn of set) fn(payload);
  }
}
