// Screen 1 "Start": start a new round, continue a running round, see the last rounds.
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Avatar, Notice, PrimaryButton, SectionLabel } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import HistoryRow from '../components/HistoryRow';
import { clearActiveGame, loadActiveGame, loadHistory, takeStorageWarnings } from '../lib/storage';
import { formatTime, remainingMs, resumeScreen } from '../lib/game';
import { colors, font, sizes } from '../theme';

/** Short status of the running round for the "Runde fortsetzen" card. */
function resumeMeta(game) {
  const screen = resumeScreen(game);
  if (screen === 'Card') return `Karte ${game.cardIndex + 1} von ${game.players.length}`;
  if (screen === 'Vote') return 'Abstimmung offen';
  return `noch ${formatTime(remainingMs(game))}`;
}

export default function StartScreen({ navigation }) {
  const [activeGame, setActiveGame] = useState(null);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Reload every time the screen is shown, e.g. after a round was finished.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadActiveGame(), loadHistory()]).then(([game, list]) => {
        if (!active) return;
        setActiveGame(game);
        setHistory(list);
        setLoaded(true);
        if (takeStorageWarnings().length > 0) setStorageWarning(true);
      });
      return () => { active = false; };
    }, []),
  );

  // Continue exactly where the round stopped: cards, round or vote.
  const resume = () => navigation.navigate(resumeScreen(activeGame));

  // A running round would be lost, so ask first.
  const newRound = () => {
    if (activeGame) setConfirmVisible(true);
    else navigation.navigate('Setup');
  };

  const confirmNewRound = async () => {
    setConfirmVisible(false);
    await clearActiveGame();
    setActiveGame(null);
    navigation.navigate('Setup');
  };

  const isEmpty = loaded && !activeGame && history.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Avatar text="S" size={40} fill={colors.primary} />
          <Text style={styles.brandText}>Spy Game</Text>
        </View>

        <Text style={styles.title} accessibilityRole="header">Wer ist der Spion?</Text>
        <Text style={styles.subtitle}>Ein Handy, eine Gruppe, ein geheimes Wort.</Text>

        {storageWarning && (
          <Notice tone="warning" style={{ marginBottom: 16 }}>
            Gespeicherte Daten waren fehlerhaft und wurden zurückgesetzt. Du kannst normal weiterspielen.
          </Notice>
        )}

        {activeGame && (
          <Pressable
            onPress={resume}
            accessibilityRole="button"
            accessibilityLabel="Laufende Runde fortsetzen"
            style={({ pressed }) => [styles.resume, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeLabel}>LAUFENDE RUNDE</Text>
              <Text style={styles.resumeTitle}>Runde fortsetzen</Text>
              <Text style={styles.resumeMeta}>
                {activeGame.players.length} Spieler · {activeGame.category} ·{' '}
                {resumeMeta(activeGame)}
              </Text>
            </View>
            <Text style={styles.play}>▶</Text>
          </Pressable>
        )}

        {isEmpty && (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyQ}>?</Text></View>
            <Text style={styles.emptyTitle}>Noch keine Runden</Text>
            <Text style={styles.emptyText}>Starte die erste Runde.</Text>
          </View>
        )}

        {history.length > 0 && (
          <>
            <SectionLabel>Letzte Runden</SectionLabel>
            {history.map((entry) => <HistoryRow key={entry.id + entry.date} entry={entry} />)}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="+  Neue Runde" onPress={newRound} disabled={!loaded} />
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Neue Runde starten?"
        message="Die laufende Runde geht verloren."
        cancelTitle="Abbrechen"
        confirmTitle="Neue Runde"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={confirmNewRound}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: sizes.padding, paddingBottom: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  brandText: { fontSize: font.heading, color: colors.text },
  title: { fontSize: font.title + 4, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: font.body, color: colors.muted, marginBottom: 28 },
  resume: {
    minHeight: 88, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.primaryStrong,
    borderWidth: 1, borderRadius: sizes.radius, padding: 16, marginBottom: 20,
  },
  resumeLabel: { fontSize: font.label, color: colors.primaryStrong, letterSpacing: 0.5 },
  resumeTitle: { fontSize: font.heading + 1, color: colors.text, marginVertical: 2 },
  resumeMeta: { fontSize: font.small + 1, color: colors.muted },
  play: { fontSize: 22, color: colors.text, marginLeft: 12 },
  empty: { alignItems: 'center', marginTop: 32 },
  emptyCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: colors.covered, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyQ: { fontSize: 40, color: colors.muted },
  emptyTitle: { fontSize: font.heading + 2, color: colors.text, marginBottom: 6 },
  emptyText: { fontSize: font.body, color: colors.muted },
  footer: { paddingHorizontal: sizes.padding, paddingBottom: 12, paddingTop: 8 },
});
