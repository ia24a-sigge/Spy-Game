// Pure sensor logic without expo-sensors, so it can be unit tested.
// Values are in g (gravity). Display facing up: z is about -1, display facing down: z is about +1
// (expo-sensors uses the same direction on iOS and Android).
// Two thresholds (hysteresis) keep the state from flickering while the phone is being tilted.
// If a device behaves differently, adjust the thresholds here.
const FACE_DOWN_THRESHOLD = 0.75;
const FACE_UP_THRESHOLD = 0.4;

/**
 * Calculates the new "face down" state from the previous state and the current z value.
 * Between the two thresholds the previous state is kept.
 * @param {boolean} previous
 * @param {number} z acceleration on the z axis in g
 * @returns {boolean} true if the display faces down
 */
export function nextFaceDown(previous, z) {
  if (!previous && z > FACE_DOWN_THRESHOLD) return true;
  if (previous && z < FACE_UP_THRESHOLD) return false;
  return previous;
}
