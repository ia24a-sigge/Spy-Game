// Reine Spiel-Logik ohne React. Darum gut testbar (siehe __tests__/game.test.js).
import WORDS from '../data/words.json';

export const CATEGORIES = ['Essen', 'Tiere', 'Berufe', 'Andere'];
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 15;
export const HISTORY_LIMIT = 20;
export const DEFAULT_SETTINGS = { category: 'Essen', spies: 1, minutes: 8 };

// Mindestens zwei Personen müssen das Wort kennen, höchstens 3 Spione.
export function maxSpies(playerCount) {
  return Math.max(1, Math.min(3, playerCount - 2));
}

export function pickRandom(list, rand = Math.random) {
  return list[Math.floor(rand() * list.length)];
}

export function shuffle(list, rand = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function wordsFor(category) {
  return WORDS[category] || WORDS.Essen;
}

// Neue Runde: Wort, Spion(e) und Startperson werden zufällig gezogen.
export function createGame({ players, category, spies, minutes }, rand = Math.random, now = Date.now()) {
  const spyCount = Math.min(spies, maxSpies(players.length));
  const durationMs = minutes * 60 * 1000;
  return {
    id: String(now),
    createdAt: new Date(now).toISOString(),
    players: [...players],
    category,
    word: pickRandom(wordsFor(category), rand),
    spies: shuffle(players, rand).slice(0, spyCount),
    starter: pickRandom(players, rand),
    phase: 'cards', // cards -> round -> vote
    cardIndex: 0, // wie viele Karten schon gesehen wurden
    durationMs,
    remainingMs: durationMs,
    endTime: null, // gesetzt, solange der Timer läuft
    paused: true,
  };
}

export function isSpy(game, name) {
  return game.spies.includes(name);
}

// ----- Timer -----
// Gespeichert wird nicht jede Sekunde, sondern die Endzeit (läuft) oder die Restzeit (pausiert).
export function remainingMs(game, now = Date.now()) {
  if (game.paused || !game.endTime) return Math.max(0, game.remainingMs);
  return Math.max(0, game.endTime - now);
}

export function startTimer(game, now = Date.now()) {
  return { ...game, phase: 'round', paused: false, endTime: now + remainingMs(game, now) };
}

export function pauseTimer(game, now = Date.now()) {
  return { ...game, paused: true, remainingMs: remainingMs(game, now), endTime: null };
}

export function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ----- Auflösung -----
export function evaluateVote(game, votedNames) {
  const names = Array.isArray(votedNames) ? votedNames : [votedNames];
  const correct = names.filter((name) => isSpy(game, name));
  // Bei mehreren Spionen müssen alle gefunden werden.
  return {
    votedName: names[0],
    votedNames: names,
    correct,
    winner: game.spies.every((name) => names.includes(name)) ? 'group' : 'spy',
  };
}

// Das Wort wird bewusst nicht in den Verlauf übernommen.
export function historyEntry(game, winner, now = Date.now()) {
  return {
    id: game.id,
    date: new Date(now).toISOString(),
    category: game.category,
    playerCount: game.players.length,
    spies: game.spies,
    result: winner,
  };
}

export function trimHistory(list, limit = HISTORY_LIMIT) {
  return list.slice(0, limit);
}

// ----- Prüfen gespeicherter Daten -----
export function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const clamp = (v, min, max, fallback) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback);
  return {
    category: CATEGORIES.includes(s.category) ? s.category : DEFAULT_SETTINGS.category,
    spies: clamp(s.spies, 1, 3, DEFAULT_SETTINGS.spies),
    minutes: clamp(s.minutes, MIN_MINUTES, MAX_MINUTES, DEFAULT_SETTINGS.minutes),
  };
}

export function isValidGame(g) {
  return Boolean(
    g && typeof g === 'object' &&
    Array.isArray(g.players) && g.players.length >= MIN_PLAYERS &&
    Array.isArray(g.spies) && g.spies.length >= 1 &&
    typeof g.word === 'string' && typeof g.starter === 'string' &&
    ['cards', 'round', 'vote'].includes(g.phase) &&
    Number.isInteger(g.cardIndex) && g.cardIndex >= 0 && g.cardIndex <= g.players.length &&
    Number.isFinite(g.remainingMs)
  );
}

export function isValidHistoryEntry(e) {
  return Boolean(e && typeof e.date === 'string' && typeof e.category === 'string' && Array.isArray(e.spies) && ['group', 'spy'].includes(e.result));
}

// ----- Anzeige -----
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export function formatShortDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[d.getDay()]} ${dd}.${mm}.`;
}

export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}
