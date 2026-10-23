import { MESSAGES, validateSetup } from '../src/lib/validation';
import { nextFaceDown } from '../src/lib/faceDown';

describe('validateSetup (Screen 2)', () => {
  test('gültige Eingabe', () => {
    const r = validateSetup({ players: ['Alex', 'Noah', 'Mia'], spies: 1 });
    expect(r.valid).toBe(true);
    expect(r.fieldErrors).toEqual(['', '', '']);
  });

  test('leeres Feld', () => {
    const r = validateSetup({ players: ['Alex', '  ', 'Mia'], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.fieldErrors[1]).toBe(MESSAGES.empty);
  });

  test('doppelter Name, auch mit anderer Gross-/Kleinschreibung', () => {
    const r = validateSetup({ players: ['Alex', 'Noah', 'alex '], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.fieldErrors[0]).toBe('');
    expect(r.fieldErrors[2]).toBe(MESSAGES.duplicate);
  });

  test('zu langer Name', () => {
    const r = validateSetup({ players: ['A'.repeat(21), 'Noah', 'Mia'], spies: 1 });
    expect(r.fieldErrors[0]).toBe(MESSAGES.tooLong);
  });

  test('mindestens 3 Spieler', () => {
    const r = validateSetup({ players: ['Alex', 'Noah'], spies: 1 });
    expect(r.valid).toBe(false);
    expect(r.playersError).toBe(MESSAGES.minPlayers);
  });

  test('zu viele Spione', () => {
    const r = validateSetup({ players: ['Alex', 'Noah', 'Mia'], spies: 2 });
    expect(r.valid).toBe(false);
    expect(r.spiesError).toBe(MESSAGES.tooManySpies);
  });
});

describe('Sensor: Display nach unten erkennen', () => {
  test('Hysterese verhindert Flackern', () => {
    let state = false;
    state = nextFaceDown(state, -1); // Display oben
    expect(state).toBe(false);
    state = nextFaceDown(state, 0.6); // gekippt, aber noch nicht unten
    expect(state).toBe(false);
    state = nextFaceDown(state, 0.95); // Display unten
    expect(state).toBe(true);
    state = nextFaceDown(state, 0.6); // leicht angehoben: bleibt verdeckt
    expect(state).toBe(true);
    state = nextFaceDown(state, -0.2); // wieder umgedreht
    expect(state).toBe(false);
  });
});
