// Pure game logic without React, so it can be unit tested (see __tests__/game.test.js).
import WORDS from '../data/words.json';

export const CATEGORIES = ['Essen', 'Tiere', 'Berufe', 'Andere'];
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 15;
export const HISTORY_LIMIT = 20;
export const DEFAULT_SETTINGS = { category: 'Essen', spies: 1, minutes: 8 };

/**
 * Highest allowed number of spies: at least two players must know the word, never more than 3 spies.
 * @param {number} playerCount
 * @returns {number}
 */
export function maxSpies(playerCount) {
  return Math.max(1, Math.min(3, playerCount - 2));
}

/**
 * Returns a random element. `rand` can be replaced in tests to get predictable results.
 * @template T
 * @param {T[]} list
 * @param {() => number} [rand]
 * @returns {T}
 */
export function pickRandom(list, rand = Math.random) {
  return list[Math.floor(rand() * list.length)];
}

/** Fisher-Yates shuffle on a copy, the original list stays untouched. */
function shuffle(list, rand = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Offline word list of a category, falls back to "Essen" for unknown categories. */
export function wordsFor(category) {
  return WORDS[category] || WORDS.Essen;
}

/**
 * Creates a new round: word, spies and the starting player are drawn at random.
 * The timer starts paused and only runs once every player has seen their card.
 * @param {{ players: string[], category: string, spies: number, minutes: number }} settings
 * @param {() => number} [rand]
 * @param {number} [now] timestamp in ms, used as round id
 */
export function createGame({ players, category, spies, minutes }, rand = Math.random, now = Date.now()) {
  const spyCount = Math.min(spies, maxSpies(players.length));
  const durationMs = minutes * 60 * 1000;
  return {
    id: String(now),
    players: [...players],
    category,
    word: pickRandom(wordsFor(category), rand),
    spies: shuffle(players, rand).slice(0, spyCount),
    starter: pickRandom(players, rand),
    phase: 'cards', // cards -> round -> vote
    cardIndex: 0, // number of cards already seen
    durationMs,
    remainingMs: durationMs,
    endTime: null, // only set while the timer is running
    paused: true,
  };
}

/** True if the given player is one of the spies of this round. */
export function isSpy(game, name) {
  return game.spies.includes(name);
}

// ----- Timer -----
// We never store every second. A running timer stores its end time, a paused timer its remaining time.
// That way the countdown is still correct after the app was closed.

/** Milliseconds left in the round, never negative. */
export function remainingMs(game, now = Date.now()) {
  if (game.paused || !game.endTime) return Math.max(0, game.remainingMs);
  return Math.max(0, game.endTime - now);
}

/** Starts or resumes the timer by turning the remaining time into an end time. */
export function startTimer(game, now = Date.now()) {
  return { ...game, phase: 'round', paused: false, endTime: now + remainingMs(game, now) };
}

/** Pauses the timer and freezes the remaining time. */
export function pauseTimer(game, now = Date.now()) {
  return { ...game, paused: true, remainingMs: remainingMs(game, now), endTime: null };
}

/**
 * Screen where a stored round continues: the cards if not everyone has seen theirs,
 * the vote if it is open or the time is already over, otherwise the round.
 * @returns {'Card' | 'Round' | 'Vote'}
 */
export function resumeScreen(game, now = Date.now()) {
  if (game.phase === 'cards') return 'Card';
  if (game.phase === 'vote' || remainingMs(game, now) <= 0) return 'Vote';
  return 'Round';
}

/** Formats milliseconds as mm:ss, rounding up so "00:00" only shows when the time is really over. */
export function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ----- Vote and result -----

/**
 * Evaluates the vote. With several spies the group only wins if it found all of them.
 * @param {object} game
 * @param {string | string[]} votedNames
 * @returns {{ votedNames: string[], winner: 'group' | 'spy' }}
 */
export function evaluateVote(game, votedNames) {
  const names = Array.isArray(votedNames) ? votedNames : [votedNames];
  return {
    votedNames: names,
    winner: game.spies.every((name) => names.includes(name)) ? 'group' : 'spy',
  };
}

/** Entry for the history list. The secret word is deliberately not stored. */
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

/** Keeps only the newest rounds (the list is sorted newest first). */
export function trimHistory(list, limit = HISTORY_LIMIT) {
  return list.slice(0, limit);
}

// ----- Validation of stored data -----
// Stored data could be broken (old app version, manual changes). These checks keep the app from crashing.

/** Returns valid settings: unknown values are replaced, numbers are clamped to the allowed range. */
export function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const clamp = (v, min, max, fallback) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback);
  return {
    category: CATEGORIES.includes(s.category) ? s.category : DEFAULT_SETTINGS.category,
    spies: clamp(s.spies, 1, 3, DEFAULT_SETTINGS.spies),
    minutes: clamp(s.minutes, MIN_MINUTES, MAX_MINUTES, DEFAULT_SETTINGS.minutes),
  };
}

/** True if a stored round has every field the screens need. */
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

/** True if a stored history entry can be shown on the start screen. */
export function isValidHistoryEntry(e) {
  return Boolean(e && typeof e.date === 'string' && typeof e.category === 'string' && Array.isArray(e.spies) && ['group', 'spy'].includes(e.result));
}

// ----- Display helpers -----

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Short German date for the history, e.g. "Mo 27.10.". */
export function formatShortDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[d.getDay()]} ${dd}.${mm}.`;
}

/** Joins names in German, e.g. ["Noah", "Mia", "Luca"] -> "Noah, Mia und Luca". */
export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}
