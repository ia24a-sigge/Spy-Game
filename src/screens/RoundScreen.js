// Screen 4 · Runde: Countdown, Pause, Abstimmen und Dialog «Runde beenden?».
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { IconButton, PrimaryButton, ScreenHeader } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatTime, pauseTimer, remainingMs, startTimer } from '../lib/game';
import { clearActiveGame, loadActiveGame, saveActiveGame } from '../lib/storage';
import { colors, font, sizes } from '../theme';

export default function RoundScreen({ navigation }) {
  const [game, setGame] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const gameRef = useRef(null);
  const leaving = useRef(false);

  const update = useCallback(async (next) => {
    gameRef.current = next;
    setGame(next);
    await saveActiveGame(next);
  }, []);

  // Beim Öffnen (auch zurück aus der Abstimmung) Runde aus dem Speicher laden.
  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
      loadActiveGame().then((g) => {
        if (!g) {
          navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
          return;
        }
        const next = g.phase === 'round' ? g : { ...g, phase: 'round', paused: true, endTime: null };
        gameRef.current = next;
        setGame(next);
        if (next !== g) saveActiveGame(next);
      });
      // Android-Zurücktaste öffnet die Rückfrage statt die Runde zu verlassen.
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setConfirmVisible(true);
        return true;
      });
      return () => sub.remove();
    }, [navigation]),
  );

  // Countdown: Anzeige wird jede Viertelsekunde aus der Endzeit berechnet.
  useEffect(() => {
    if (!game || game.paused) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [game]);

  // App geht in den Hintergrund (z. B. Anruf): Runde pausieren und Restzeit speichern.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const g = gameRef.current;
      if (state !== 'active' && g && !g.paused && !leaving.current) update(pauseTimer(g));
    });
    return () => sub.remove();
  }, [update]);

  const goToVote = useCallback(async () => {
    const g = gameRef.current;
    if (!g || leaving.current) return;
    leaving.current = true;
    await update({ ...pauseTimer(g), phase: 'vote' });
    navigation.navigate('Vote');
  }, [navigation, update]);

  const left = game ? remainingMs(game, now) : 0;

  // Zeit abgelaufen: automatisch zur Abstimmung.
  useEffect(() => {
    if (game && !game.paused && left <= 0) goToVote();
  }, [game, left, goToVote]);

  if (!game) return <SafeAreaView style={styles.safe} />;

  const togglePause = () => update(game.paused ? startTimer(game) : pauseTimer(game));

  const endRound = async () => {
    leaving.current = true;
    setConfirmVisible(false);
    await clearActiveGame();
    navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScreenHeader
          title={game.paused ? 'Pausiert' : 'Runde läuft'}
          left={<IconButton symbol="✕" accessibilityLabel="Runde beenden" onPress={() => setConfirmVisible(true)} />}
        />

        <View style={styles.timerWrap}>
          <View style={[styles.timer, game.paused && styles.timerPaused]} accessibilityLabel={`Noch ${formatTime(left)} Minuten`}>
            <Text style={styles.time}>{formatTime(left)}</Text>
            <Text style={styles.timeLabel}>{game.paused ? 'pausiert' : 'verbleibend'}</Text>
          </View>
        </View>

        <View style={styles.starter}>
          <Text style={styles.starterLabel}>Es beginnt</Text>
          <Text style={styles.starterName}>{game.starter}</Text>
          <Text style={styles.starterHint}>Stelle Fragen zum Wort.</Text>
        </View>

        <PrimaryButton title={game.paused ? '▶  Weiter' : '❚❚  Pause'} variant="secondary" onPress={togglePause} style={{ marginTop: 24 }} />
        <PrimaryButton title="Abstimmen" onPress={goToVote} style={{ marginTop: sizes.gap * 2 }} />
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Runde beenden?"
        message="Die laufende Runde geht verloren."
        cancelTitle="Weiterspielen"
        confirmTitle="Beenden"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={endRound}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: sizes.padding, paddingTop: 8 },
  timerWrap: { alignItems: 'center', marginVertical: 16 },
  timer: {
    width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: colors.primaryStrong,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  timerPaused: { borderColor: colors.borderLight, borderStyle: 'dashed' },
  time: { fontSize: 64, color: colors.text, fontVariant: ['tabular-nums'] },
  timeLabel: { fontSize: font.body, color: colors.muted, marginTop: 4 },
  starter: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', paddingVertical: 14,
  },
  starterLabel: { fontSize: font.small + 1, color: colors.muted },
  starterName: { fontSize: font.title, color: colors.text, marginVertical: 2 },
  starterHint: { fontSize: font.small + 1, color: colors.muted },
});
