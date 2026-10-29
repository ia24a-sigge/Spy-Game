// Colors and sizes from the mockups. Every color has the same meaning on every screen.
export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1F1F24',
  muted: '#5F6470',
  border: '#2A2A2E',
  borderLight: '#C9CCD3',
  primary: '#CFC4FF', // main action and selection (purple)
  primarySoft: '#E6DFFF',
  primaryStrong: '#6D4AE0',
  covered: '#DFE1E6', // covered card / disabled (grey)
  spy: '#F8C6DA', // spy (pink)
  spyBorder: '#E0435E',
  hint: '#D3F5D9', // hint / group wins (green)
  hintBorder: '#3BA55C',
  warning: '#FFF1C2', // warning (yellow)
  warningBorder: '#D8A100',
  danger: '#D92D20', // error / destructive action (red)
  overlay: 'rgba(20, 20, 30, 0.45)',
};

export const sizes = {
  touch: 48, // minimum touch size required by the teacher: 48 dp
  button: 56, // main button at the bottom
  row: 60, // player rows in the vote
  gap: 8, // minimum distance between touch targets
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
