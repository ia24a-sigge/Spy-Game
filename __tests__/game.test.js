import {
  createGame, evaluateVote, formatTime, historyEntry, isValidGame, maxSpies, pauseTimer,
  remainingMs, sanitizeSettings, startTimer, trimHistory, wordsFor, HISTORY_LIMIT,
} from '../src/lib/game';

// Predictable "random" numbers for tests
const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };
const PLAYERS = ['Lena', 'Noah', 'Mia', 'Luca', 'Anna'];

describe('createGame', () => {
  test('draws the word from the category, spy and starter from the group', () => {
    const g = createGame({ players: PLAYERS, category: 'Tiere', spies: 1, minutes: 8 });
    expect(wordsFor('Tiere')).toContain(g.word);
    expect(g.spies).toHaveLength(1);
    expect(PLAYERS).toContain(g.spies[0]);
    expect(PLAYERS).toContain(g.starter);
    expect(g.phase).toBe('cards');
    expect(g.cardIndex).toBe(0);
    expect(g.remainingMs).toBe(8 * 60 * 1000);
    expect(isValidGame(g)).toBe(true);
  });

  test('several spies are different people', () => {
    for (let n = 0; n < 50; n += 1) {
      const g = createGame({ players: PLAYERS, category: 'Essen', spies: 3, minutes: 5 });
      expect(new Set(g.spies).size).toBe(3);
    }
  });

  test('number of spies is limited to what is allowed', () => {
    const g = createGame({ players: ['A', 'B', 'C'], category: 'Essen', spies: 3, minutes: 5 }, seq(0.1, 0.5, 0.9));
    expect(g.spies).toHaveLength(1);
  });
});

describe('maxSpies', () => {
  test('at least two players know the word, at most 3 spies', () => {
    expect(maxSpies(3)).toBe(1);
    expect(maxSpies(4)).toBe(2);
    expect(maxSpies(5)).toBe(3);
    expect(maxSpies(12)).toBe(3);
  });
});

describe('Timer', () => {
  const base = createGame({ players: PLAYERS, category: 'Essen', spies: 1, minutes: 2 }, Math.random, 0);

  test('runs on the stored end time', () => {
    const running = startTimer(base, 1000);
    expect(running.endTime).toBe(1000 + 120000);
    expect(remainingMs(running, 31000)).toBe(90000);
  });

  test('pause freezes the remaining time, resume continues from there', () => {
    const paused = pauseTimer(startTimer(base, 0), 30000);
    expect(paused.paused).toBe(true);
    expect(remainingMs(paused, 999999)).toBe(90000);
    const resumed = startTimer(paused, 500000);
    expect(remainingMs(resumed, 510000)).toBe(80000);
  });

  test('never negative', () => {
    expect(remainingMs(startTimer(base, 0), 10 ** 9)).toBe(0);
  });

  test('formatTime', () => {
    expect(formatTime(372000)).toBe('06:12');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59001)).toBe('01:00');
  });
});

describe('vote and history', () => {
  const g = { ...createGame({ players: PLAYERS, category: 'Essen', spies: 1, minutes: 8 }), spies: ['Mia'] };

  test('group wins if it votes for the spy', () => {
    expect(evaluateVote(g, 'Mia').winner).toBe('group');
    expect(evaluateVote(g, 'Noah').winner).toBe('spy');
  });

  test('with several spies the group must find all of them', () => {
    const two = { ...g, spies: ['Mia', 'Luca'] };
    expect(evaluateVote(two, ['Mia', 'Luca']).winner).toBe('group');
    expect(evaluateVote(two, ['Luca', 'Mia']).winner).toBe('group');
    expect(evaluateVote(two, ['Mia', 'Noah']).winner).toBe('spy');
  });

  test('history does not store the word', () => {
    const e = historyEntry(g, 'group');
    expect(e).toMatchObject({ category: 'Essen', playerCount: 5, spies: ['Mia'], result: 'group' });
    expect(e.word).toBeUndefined();
  });

  test('history keeps at most 20 rounds', () => {
    const list = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }));
    expect(trimHistory(list)).toHaveLength(HISTORY_LIMIT);
    expect(trimHistory(list)[0].id).toBe('0');
  });
});

describe('validation of stored data', () => {
  test('invalid settings fall back to defaults', () => {
    expect(sanitizeSettings({ category: 'Autos', spies: 9, minutes: -3 })).toEqual({ category: 'Essen', spies: 3, minutes: 1 });
    expect(sanitizeSettings(null)).toEqual({ category: 'Essen', spies: 1, minutes: 8 });
  });

  test('broken activeGame is detected', () => {
    expect(isValidGame(null)).toBe(false);
    expect(isValidGame({ players: ['A'] })).toBe(false);
  });
});
