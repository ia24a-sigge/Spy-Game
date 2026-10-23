// Wiederverwendbare Spielerzeile für die Abstimmung (CookMate: ListItem).
import { Pressable, StyleSheet, Text } from 'react-native';
import { Avatar } from './ui';
import { colors, font, sizes } from '../theme';

export default function VotePlayerRow({ name, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      <Avatar text={name[0].toUpperCase()} size={40} />
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: sizes.row, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: sizes.radius, backgroundColor: colors.surface,
    paddingHorizontal: 14, marginBottom: sizes.gap + 2 },
  selected: { backgroundColor: colors.primary, borderColor: colors.primaryStrong, borderWidth: 1.5 },
  name: { fontSize: font.body + 2, color: colors.text, marginLeft: 14 },
  pressed: { opacity: 0.7 },
});
