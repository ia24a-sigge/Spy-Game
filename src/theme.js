// Farben und Masse aus den Mockups. Jede Farbe hat überall dieselbe Bedeutung.
export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1F1F24',
  muted: '#5F6470',
  border: '#2A2A2E',
  borderLight: '#C9CCD3',
  primary: '#CFC4FF', // Hauptaktion und Auswahl (lila)
  primarySoft: '#E6DFFF',
  primaryStrong: '#6D4AE0',
  covered: '#DFE1E6', // verdeckt / inaktiv (grau)
  spy: '#F8C6DA', // Spion (rosa)
  spyBorder: '#E0435E',
  hint: '#D3F5D9', // Hinweis / Gruppe gewinnt (grün)
  hintBorder: '#3BA55C',
  warning: '#FFF1C2', // Warnung (gelb)
  warningBorder: '#D8A100',
  danger: '#D92D20', // Fehler / gefährliche Aktion (rot)
  overlay: 'rgba(20, 20, 30, 0.45)',
};

export const sizes = {
  touch: 48, // Mindestgrösse laut Dozenten-Vorgabe: 48 dp
  button: 56, // Hauptbutton unten
  row: 60, // Spielerzeilen bei der Abstimmung
  gap: 8, // Mindestabstand zwischen Touch-Targets
  padding: 20,
  radius: 14,
};

export const font = {
  title: 30,
  heading: 20,
  body: 17,
  small: 14,
  label: 13,
};
