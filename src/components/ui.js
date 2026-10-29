// Shared UI building blocks. Using the same blocks on every screen keeps the app consistent ("Erwartungskonformität").
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, sizes } from '../theme';

// Makes small buttons a bit easier to hit without changing their look.
const HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

/**
 * Large button at the bottom of a screen (56 dp high).
 * @param {{ title: string, onPress: () => void, disabled?: boolean, variant?: 'primary' | 'secondary' | 'danger', style?: object, accessibilityHint?: string }} props
 */
export function PrimaryButton({ title, onPress, disabled = false, variant = 'primary', style, accessibilityHint }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'danger' && { color: colors.danger }, disabled && { color: colors.muted }]}>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * Square button with a symbol (e.g. back arrow, close, + and -), at least 48 x 48 dp.
 * @param {{ symbol: string, onPress: () => void, accessibilityLabel: string, disabled?: boolean, style?: object }} props
 */
export function IconButton({ symbol, onPress, accessibilityLabel, disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.icon, disabled && styles.iconDisabled, pressed && !disabled && styles.pressed, style]}
    >
      <Text style={[styles.iconText, symbol === '×' && styles.closeIconText, disabled && { color: colors.borderLight }]}>{symbol}</Text>
    </Pressable>
  );
}

/**
 * Header with an optional button on the left (back or close) and the title in the middle.
 * An empty view on the right keeps the title centered.
 */
export function ScreenHeader({ title, left }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{left}</View>
      <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>{title}</Text>
      <View style={styles.headerSide} />
    </View>
  );
}

/**
 * "- value +" control for numbers (spies, minutes). The buttons turn grey at the limits.
 * @param {{ label: string, value: number, display?: string, onChange: (v: number) => void, min: number, max: number }} props
 */
export function Stepper({ label, value, display, onChange, min, max }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <IconButton symbol="–" accessibilityLabel={`${label} verringern`} disabled={value <= min} onPress={() => onChange(value - 1)} />
        <Text style={styles.stepperValue} accessibilityLabel={`${label}: ${display ?? value}`}>{display ?? value}</Text>
        <IconButton symbol="+" accessibilityLabel={`${label} erhöhen`} disabled={value >= max} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

/** Round circle with an initial or a number. */
export function Avatar({ text, size = 32, fill = colors.covered }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: fill }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.45 }]}>{text}</Text>
    </View>
  );
}

/**
 * Small label like "Gruppe" or "Spion". It always contains text, the meaning never depends on color alone.
 * @param {{ text: string, tone?: 'hint' | 'spy' | 'neutral' }} props
 */
export function Badge({ text, tone = 'hint' }) {
  const map = {
    hint: [colors.hint, colors.hintBorder],
    spy: [colors.spy, colors.spyBorder],
    neutral: [colors.covered, colors.borderLight],
  };
  const [bg, border] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

/**
 * Info box that cannot be tapped.
 * @param {{ tone?: 'hint' | 'warning' }} props green hint or yellow warning
 */
export function Notice({ children, tone = 'hint', style }) {
  const bg = tone === 'warning' ? colors.warning : colors.hint;
  const border = tone === 'warning' ? colors.warningBorder : colors.hintBorder;
  return (
    <View style={[styles.notice, { backgroundColor: bg, borderColor: border }, style]} accessibilityRole="text">
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

/** Small uppercase section title with optional content on the right (e.g. the player count). */
export function SectionLabel({ children, right }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.button,
    borderRadius: sizes.radius,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonSecondary: { backgroundColor: colors.covered, borderColor: colors.borderLight },
  buttonDanger: { backgroundColor: colors.surface, borderColor: colors.danger },
  buttonDisabled: { backgroundColor: colors.covered, borderColor: colors.borderLight },
  buttonText: { fontSize: font.body + 1, color: colors.text, fontWeight: '500' },
  pressed: { opacity: 0.7 },
  icon: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: { borderColor: colors.borderLight },
  iconText: { fontSize: 22, color: colors.text, lineHeight: 26, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  closeIconText: { fontSize: 28, lineHeight: 32 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touch, marginBottom: 12 },
  headerSide: { width: sizes.touch },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: font.heading, color: colors.text },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: sizes.touch, marginBottom: sizes.gap * 2 },
  stepperLabel: { fontSize: font.body + 1, color: colors.text },
  stepperControls: { flexDirection: 'row', alignItems: 'center' },
  stepperValue: { minWidth: 70, textAlign: 'center', fontSize: font.body + 1, color: colors.text },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText: { color: colors.text },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: font.small, color: colors.text },
  notice: { borderWidth: 1, borderRadius: sizes.radius, padding: 14 },
  noticeText: { fontSize: font.small + 1, color: colors.text, lineHeight: 21 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionLabel: { fontSize: font.label + 1, color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
});
