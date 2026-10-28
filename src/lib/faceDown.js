// Reine Logik zum Sensor (ohne expo-sensors, darum testbar).
// Werte in g. Liegt das Handy mit dem Display nach oben, ist z etwa -1,
// mit dem Display nach unten etwa +1 (expo-sensors liefert auf iOS und Android dieselbe Richtung).
// Zwei Schwellen (Hysterese), damit der Zustand beim Kippen nicht flackert.
// Falls ein Gerät anders reagiert: hier die Schwellen anpassen.
const FACE_DOWN_THRESHOLD = 0.75;
const FACE_UP_THRESHOLD = 0.4;

export function nextFaceDown(previous, z) {
  if (!previous && z > FACE_DOWN_THRESHOLD) return true;
  if (previous && z < FACE_UP_THRESHOLD) return false;
  return previous;
}
