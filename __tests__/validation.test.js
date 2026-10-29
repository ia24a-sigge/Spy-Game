import { MESSAGES, validateSetup } from '../src/lib/validation';
import { nextFaceDown } from '../src/lib/faceDown';

describe('validateSetup (screen 2)', () => {
  test('valid input', () => {
    const r = validateSetup({ players: ['Lena', 'Noah', 'Mia'], spies: 1 });
    expect(r.valid).toBe(true);
    expect(r.fieldErrors).toEqual(['', '', '']);
  });

  test('empty field', () => {
    const r = validateSetup({ players: ['Lena', '  ', 'Mia'], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.fieldErrors[1]).toBe(MESSAGES.empty);
  });

  test('duplicate name, also with different upper/lower case', () => {
    const r = validateSetup({ players: ['Lena', 'Noah', 'lena '], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.fieldErrors[0]).toBe('');
    expect(r.fieldErrors[2]).toBe(MESSAGES.duplicate);
  });

  test('name too long', () => {
    const r = validateSetup({ players: ['A'.repeat(21), 'Noah', 'Mia'], spies: 1 });
    expect(r.fieldErrors[0]).toBe(MESSAGES.tooLong);
  });

  test('at least 3 players', () => {
    const r = validateSetup({ players: ['Lena', 'Noah'], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.playersError).toBe(MESSAGES.minPlayers);
  });

  test('too many spies', () => {
    const r = validateSetup({ players: ['Lena', 'Noah', 'Mia'], spies: 2 });
    expect(r.valid).toBe(false);
    expect(r.spiesError).toBe(MESSAGES.tooManySpies);
  });
});

describe('sensor: detect display facing down', () => {
  test('hysteresis prevents flickering', () => {
    let state = false;
    state = nextFaceDown(state, -1); // display up
    expect(state).toBe(false);
    state = nextFaceDown(state, 0.6); // tilted, but not face down yet
    expect(state).toBe(false);
    state = nextFaceDown(state, 0.95); // display down
    expect(state).toBe(true);
    state = nextFaceDown(state, 0.6); // slightly lifted: stays covered
    expect(state).toBe(true);
    state = nextFaceDown(state, -0.2); // turned back up
    expect(state).toBe(false);
  });
});
