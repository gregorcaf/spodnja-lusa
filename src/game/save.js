// Saving and loading the game. The whole state is plain JSON, so a save is just a snapshot.
// Storage is passed in (localStorage in the browser, a fake in tests).

import { createState } from './game.js';

export const SAVE_KEY = 'nasa-obcina-save';
export const SAVE_VERSION = 1;

export function serialize(state) {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), state });
}

/**
 * Turns a saved snapshot back into a state. Fields added in newer versions of the game
 * get their default values, so older saves keep working. Returns null for unusable data.
 */
export function deserialize(text) {
  try {
    const data = JSON.parse(text);
    if (!data || data.version !== SAVE_VERSION || !data.state?.grid || !data.state?.citizens) return null;
    const defaults = createState();
    const state = { ...defaults, ...data.state };
    state.stats = { ...defaults.stats, ...data.state.stats };
    state.leverMult = { ...defaults.leverMult, ...data.state.leverMult };
    return state;
  } catch {
    return null;
  }
}

export function saveGame(storage, state) {
  try {
    storage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false; // storage full or unavailable: the game simply isn't saved
  }
}

export function loadGame(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    return text ? deserialize(text) : null;
  } catch {
    return null;
  }
}

export function clearSave(storage) {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}

/** Short description of a save for the start screen, e.g. "maj 2028 · 1. mandat". */
export function describeSave(state, monthNames) {
  return `${monthNames[state.month]} ${state.year} · ${state.term}. mandat`;
}
