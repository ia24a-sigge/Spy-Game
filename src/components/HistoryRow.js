import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge } from './ui';
import { formatShortDate, joinNames } from '../lib/game';
import { colors, font, sizes } from '../theme';

export default function HistoryRow({ entry }) {
  const groupWins = entry.result === 'group';
  return (
    <View style={styles.row}>
      <Avatar text={entry.category[0]} size={40} />
      <View style={styles.text}>
        <Text style={styles.title}>{entry.category} · {entry.playerCount} Spieler</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatShortDate(entry.date)} · {entry.spies.length > 1 ? 'Spione' : 'Spion'}: {joinNames(entry.spies)}
        </Text>
      </View>
      <Badge text={groupWins ? 'Gruppe' : 'Spion'} tone={groupWins ? 'hint' : 'spy'} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: 72, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: sizes.radius, paddingHorizontal: 14, marginBottom: sizes.gap + 2,
  },
  text: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: font.body + 1, color: colors.text },
  meta: { fontSize: font.small, color: colors.muted, marginTop: 2 },
});
