// Persistenz mit AsyncStorage: 4 Schlüssel, jeweils als JSON-Text.
// Kein Server, keine Datenbank, kein Login (KISS).
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS, isValidGame, isValidHistoryEntry, sanitizeSettings, trimHistory,
} from './game';

export const KEYS = {
  players: 'players', // Liste der Spielernamen
  settings: 'settings', // Kategorie, Anzahl Spione, Zeit
  activeGame: 'activeGame', // laufende Runde inkl. Wort, Spion, Restzeit
  history: 'history', // letzte 20 Runden
};

// Fehlerhafte Daten führen nicht zum Absturz: der Schlüssel wird zurückgesetzt
// und der Startscreen zeigt einen Hinweis.
let corruptedKeys = [];
export function takeStorageWarnings() {
  const keys = corruptedKeys;
  corruptedKeys = [];
  return keys;
}

async function readJson(key, fallback, isValid = () => true) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    if (!isValid(value)) throw new Error(`Ungültiger Inhalt in ${key}`);
    return value;
  } catch (error) {
    console.warn('[storage]', key, error);
    corruptedKeys.push(key);
    await AsyncStorage.removeItem(key).catch(() => {});
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[storage] Schreiben fehlgeschlagen', key, error);
    throw error;
  }
}

// ----- players -----
export function loadPlayers() {
  return readJson(KEYS.players, [], (v) => Array.isArray(v) && v.every((n) => typeof n === 'string'));
}
export function savePlayers(players) {
  return writeJson(KEYS.players, players);
}

// ----- settings -----
export async function loadSettings() {
  const raw = await readJson(KEYS.settings, DEFAULT_SETTINGS, (v) => v && typeof v === 'object');
  return sanitizeSettings(raw);
}
export function saveSettings(settings) {
  return writeJson(KEYS.settings, sanitizeSettings(settings));
}

// ----- activeGame -----
export function loadActiveGame() {
  return readJson(KEYS.activeGame, null, isValidGame);
}
export function saveActiveGame(game) {
  return writeJson(KEYS.activeGame, game);
}
export function clearActiveGame() {
  return AsyncStorage.removeItem(KEYS.activeGame).catch(() => {});
}

// ----- history -----
export function loadHistory() {
  return readJson(KEYS.history, [], (v) => Array.isArray(v) && v.every(isValidHistoryEntry));
}
export async function addToHistory(entry) {
  const list = await loadHistory();
  const next = trimHistory([entry, ...list.filter((e) => e.id !== entry.id)]);
  await writeJson(KEYS.history, next);
  return next;
}
