// Validation of the input form (screen 2, "Einrichten"). The messages are shown in the app, so they stay German.
import { MIN_PLAYERS, maxSpies } from './game';

export const MAX_NAME_LENGTH = 20;

export const MESSAGES = {
  empty: 'Feld ausfüllen',
  duplicate: 'Name kommt doppelt vor',
  tooLong: `Maximal ${MAX_NAME_LENGTH} Zeichen`,
  minPlayers: `Mindestens ${MIN_PLAYERS} Spieler`,
  tooManySpies: 'Zu viele Spione für diese Gruppe',
};

/**
 * Checks the whole form at once. Names are compared trimmed and case-insensitive,
 * so "Lena" and "lena " count as duplicates. Only the second occurrence is marked.
 * @param {{ players: string[], spies: number }} input
 * @returns {{ fieldErrors: string[], playersError: string, spiesError: string, valid: boolean }}
 *   one error per name field (empty string = ok), plus errors for the whole list and the spies
 */
export function validateSetup({ players, spies }) {
  const normalized = players.map((p) => p.trim().toLowerCase());
  const fieldErrors = players.map((name, i) => {
    const trimmed = name.trim();
    if (!trimmed) return MESSAGES.empty;
    if (trimmed.length > MAX_NAME_LENGTH) return MESSAGES.tooLong;
    if (normalized.indexOf(normalized[i]) !== i) return MESSAGES.duplicate;
    return '';
  });
  const playersError = players.length < MIN_PLAYERS ? MESSAGES.minPlayers : '';
  const spiesError = spies > maxSpies(players.length) || spies < 1 ? MESSAGES.tooManySpies : '';
  const valid = !playersError && !spiesError && fieldErrors.every((e) => !e);
  return { fieldErrors, playersError, spiesError, valid };
}
