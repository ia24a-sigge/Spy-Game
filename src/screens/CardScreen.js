// Screen 3 · Karte (Special Feature: Beschleunigungssensor).
// Ablauf pro Person: verdeckt -> «Aufdecken» -> Wort lesen -> Handy umdrehen oder
// «Karte verdecken» -> «Weitergeben» (erst jetzt aktiv).
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Notice, PrimaryButton } from '../components/ui';
import { isSpy, startTimer } from '../lib/game';
import { loadActiveGame, saveActiveGame } from '../lib/storage';
import { useFaceDown } from '../lib/useFaceDown';
import { colors, font, sizes } from '../theme';

export default function CardScreen({ navigation }) {
  const [game, setGame] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [sensorCovered, setSensorCovered] = useState(false);
  const passing = useRef(false);

  useEffect(() => {
    loadActiveGame().then((g) => {
      if (!g) navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
      else setGame(g);
    });
  }, [navigation]);

  // Kein Zurück (auch nicht mit der Android-Taste): sonst sähe man die vorherige Karte.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const cover = useCallback(() => { setRevealed(false); setSensorCovered(false); }, []);
  const sensorDown = useCallback(() => { setRevealed(false); setSensorCovered(true); }, []);
  const sensorUp = useCallback(() => {
    // Erst nach echtem Umdrehen nach unten darf das Aufrichten weitergeben.
    if (sensorCovered) passOn();
  }, [sensorCovered, game]);
  // Nach dem Aufdecken bleibt der Sensor aktiv, auch wenn die Karte verdeckt ist.
  const { available: sensorAvailable } = useFaceDown(viewed, sensorDown, sensorUp);

  if (!game) return <SafeAreaView style={styles.safe} />;

  const index = game.cardIndex;
  const total = game.players.length;
  const name = game.players[index];
  const spy = isSpy(game, name);
  const isLast = index === total - 1;

  const reveal = () => {
    setRevealed(true);
    setViewed(true);
    setSensorCovered(false);
  };

  const passOn = async () => {
    if (passing.current || !game || !viewed) return;
    passing.current = true;
    if (isLast) {
      const next = startTimer({ ...game, cardIndex: total });
      await saveActiveGame(next);
      navigation.replace('Round');
    } else {
      await saveActiveGame({ ...game, cardIndex: index + 1 });
      navigation.replace('Card'); // neuer Screen, neuer Zustand: nächste Karte startet verdeckt
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.counter} accessibilityLabel={`Karte ${index + 1} von ${total}`}>Karte {index + 1} von {total}</Text>
        <View style={styles.progress}>
          {game.players.map((p, i) => (
            <View key={p + i} style={[styles.segment, i <= index && styles.segmentDone]} />
          ))}
        </View>

        <Text style={styles.name}>{name}</Text>

        {revealed ? (
          <View style={[styles.card, spy ? styles.cardSpy : styles.cardWord]} accessibilityLiveRegion="polite">
            {spy ? (
              <>
                <Text style={styles.word}>Spion</Text>
                <Text style={styles.cardHint}>Du kennst das Wort nicht. Finde heraus, worum es geht.</Text>
              </>
            ) : (
              <>
                <View style={styles.categoryTag}><Text style={styles.categoryText}>KATEGORIE {game.category.toUpperCase()}</Text></View>
                <Text style={styles.word} adjustsFontSizeToFit numberOfLines={1}>{game.word}</Text>
              </>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.cardCovered]}>
            <Text style={styles.coveredText}>Karte verdeckt</Text>
            {!viewed && <Text style={styles.cardHint}>Nur {name} schaut aufs Display.</Text>}
          </View>
        )}

        <View style={styles.noticeArea}>
          {revealed && (
            <Notice>
              {sensorAvailable === false
                ? 'Tippe «Karte verdecken» und gib das Handy an die nächste Person weiter.'
                : 'Drehe das Display nach unten und wieder nach oben: Die nächste Person kommt automatisch. Alternativ die Buttons verwenden.'}
            </Notice>
          )}
          {!revealed && viewed && (
            <Notice>Karte verdeckt. {sensorCovered ? "Drehe das Handy wieder nach oben – es geht automatisch weiter." : `Tippe «${isLast ? "Runde starten" : "Weitergeben"}».`}</Notice>
          )}
          {sensorAvailable === false && !revealed && !viewed && (
            <Notice tone="warning">Sensor nicht verfügbar. Die Karte lässt sich mit dem Button verdecken.</Notice>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {revealed ? (
          <PrimaryButton title="Karte verdecken" onPress={cover} />
        ) : (
          <>
            <PrimaryButton title="Aufdecken" onPress={reveal} variant={viewed ? 'secondary' : 'primary'} />
            <PrimaryButton
              title={isLast ? 'Runde starten' : 'Weitergeben'}
              onPress={passOn}
              disabled={!viewed}
              style={{ marginTop: sizes.gap }}
              accessibilityHint="Erst aktiv, wenn du deine Karte angeschaut und verdeckt hast"
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: sizes.padding, paddingTop: 16 },
  counter: { textAlign: 'center', fontSize: font.heading, color: colors.text },
  progress: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 20 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.covered, borderWidth: 0.5, borderColor: colors.borderLight },
  segmentDone: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  name: { textAlign: 'center', fontSize: font.title + 4, color: colors.text, marginBottom: 20 },
  card: {
    flex: 1,
    maxHeight: 360,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardWord: { backgroundColor: colors.primarySoft, borderColor: colors.primaryStrong },
  cardSpy: { backgroundColor: colors.spy, borderColor: colors.spyBorder },
  cardCovered: { backgroundColor: colors.covered, borderColor: colors.border },
  categoryTag: { backgroundColor: colors.primary, borderColor: colors.primaryStrong, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  categoryText: { fontSize: font.label, color: colors.text, letterSpacing: 0.5 },
  word: { fontSize: 56, color: colors.text, textAlign: 'center' },
  coveredText: { fontSize: 32, color: colors.text },
  cardHint: { fontSize: font.small + 1, color: colors.muted, textAlign: 'center', marginTop: 12 },
  noticeArea: { marginTop: 20, minHeight: 80 },
  footer: { paddingHorizontal: sizes.padding, paddingBottom: 12, paddingTop: 8 },
});
