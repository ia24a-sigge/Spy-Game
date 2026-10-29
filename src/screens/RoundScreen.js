// Screen 4 "Runde": countdown, pause, vote and the dialog "Runde beenden?".
// When the time is up, a ringtone plays, the phone vibrates and the vote opens.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';

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
  // downloadFirst: iOS in Expo Go cannot play the file directly from the dev server (no file extension in the URL).
  const ring = useAudioPlayer(require('../../assets/ring.wav'), { downloadFirst: true });
  // Keep the screen on, otherwise the auto lock would pause the round and the time would never run out.
  useKeepAwake();

  // Play the ringtone even if the iPhone is set to silent.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Keeps state, ref and storage in sync. The ref is needed in listeners that would otherwise see old state.
  const update = useCallback(async (next) => {
    gameRef.current = next;
    setGame(next);
    await saveActiveGame(next);
  }, []);

  // Load the round from storage when the screen opens (also when coming back from the vote).
  // Coming back from the vote, the round continues paused.
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
      // The Android back button opens the confirmation instead of leaving the round.
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setConfirmVisible(true);
        return true;
      });
      return () => sub.remove();
    }, [navigation]),
  );

  // Countdown: the display is recalculated from the end time four times per second.
  useEffect(() => {
    if (!game || game.paused) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [game]);

  // App goes to the background (e.g. a phone call): pause the round and save the remaining time.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const g = gameRef.current;
      if (state !== 'active' && g && !g.paused && !leaving.current) update(pauseTimer(g));
    });
    return () => sub.remove();
  }, [update]);

  // `leaving` makes sure this only runs once, even if the timer and the button fire at the same time.
  const goToVote = useCallback(async () => {
    const g = gameRef.current;
    if (!g || leaving.current) return;
    leaving.current = true;
    await update({ ...pauseTimer(g), phase: 'vote' });
    navigation.navigate('Vote');
  }, [navigation, update]);

  const left = game ? remainingMs(game, now) : 0;

  // Time is up: ringtone, vibration and open the vote. No sound when the group taps "Abstimmen" itself.
  useEffect(() => {
    if (!game || game.paused || left > 0 || leaving.current) return;
    ring.seekTo(0);
    ring.play();
    Vibration.vibrate([0, 500, 200, 500]);
    goToVote();
  }, [game, left, goToVote, ring]);

  if (!game) return <SafeAreaView style={styles.safe} />;

  const togglePause = () => update(game.paused ? startTimer(game) : pauseTimer(game));

  // "Beenden" in the dialog: delete the round and go back to the start screen.
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
