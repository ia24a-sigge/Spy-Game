// Persistence with AsyncStorage: 4 keys, each stored as JSON text.
// No server, no database, no login (KISS).
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS, isValidGame, isValidHistoryEntry, sanitizeSettings, trimHistory,
} from './game';

const KEYS = {
  players: 'players', // list of player names
  settings: 'settings', // category, number of spies, round time
  activeGame: 'activeGame', // running round incl. word, spies and remaining time
  history: 'history', // last 20 rounds
};

// Broken data must not crash the app: the key is reset and the start screen shows a warning.
let corruptedKeys = [];

/** Returns the keys that were reset since the last call and clears the list. */
export function takeStorageWarnings() {
  const keys = corruptedKeys;
  corruptedKeys = [];
  return keys;
}

/**
 * Reads and parses a key. Returns `fallback` if the key is empty, unreadable or fails `isValid`.
 * @param {string} key
 * @param {*} fallback
 * @param {(value: *) => boolean} [isValid]
 */
async function readJson(key, fallback, isValid = () => true) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    if (!isValid(value)) throw new Error(`Invalid content in ${key}`);
    return value;
  } catch (error) {
    console.warn('[storage]', key, error);
    corruptedKeys.push(key);
    await AsyncStorage.removeItem(key).catch(() => {});
    return fallback;
  }
}

/** Writes a value as JSON. Errors are passed on so the screen can show a message. */
async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[storage] Write failed', key, error);
    throw error;
  }
}

// ----- players -----

/** @returns {Promise<string[]>} names of the last round, empty on first start */
export function loadPlayers() {
  return readJson(KEYS.players, [], (v) => Array.isArray(v) && v.every((n) => typeof n === 'string'));
}

export function savePlayers(players) {
  return writeJson(KEYS.players, players);
}

// ----- settings -----

/** @returns {Promise<{ category: string, spies: number, minutes: number }>} always valid settings */
export async function loadSettings() {
  const raw = await readJson(KEYS.settings, DEFAULT_SETTINGS, (v) => v && typeof v === 'object');
  return sanitizeSettings(raw);
}

export function saveSettings(settings) {
  return writeJson(KEYS.settings, sanitizeSettings(settings));
}

// ----- activeGame -----

/** @returns {Promise<object | null>} the running round, or null if there is none */
export function loadActiveGame() {
  return readJson(KEYS.activeGame, null, isValidGame);
}

export function saveActiveGame(game) {
  return writeJson(KEYS.activeGame, game);
}

/** Deletes the running round (after the result or when the round is ended). */
export function clearActiveGame() {
  return AsyncStorage.removeItem(KEYS.activeGame).catch(() => {});
}

// ----- history -----

/** @returns {Promise<object[]>} last rounds, newest first */
export function loadHistory() {
  return readJson(KEYS.history, [], (v) => Array.isArray(v) && v.every(isValidHistoryEntry));
}

/** Adds a round at the top of the history and keeps at most 20 entries. */
export async function addToHistory(entry) {
  const list = await loadHistory();
  const next = trimHistory([entry, ...list.filter((e) => e.id !== entry.id)]);
  await writeJson(KEYS.history, next);
  return next;
}
