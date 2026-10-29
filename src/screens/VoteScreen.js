// Screen 5 "Auflösung": vote, reveal the spies and the word, play again.
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, IconButton, PrimaryButton, ScreenHeader } from '../components/ui';
import { evaluateVote, historyEntry, joinNames, remainingMs } from '../lib/game';
import { addToHistory, clearActiveGame, loadActiveGame } from '../lib/storage';
import { colors, font, sizes } from '../theme';
import VotePlayerRow from '../components/VotePlayerRow';

export default function VoteScreen({ navigation }) {
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState([]); // deliberately not stored
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadActiveGame().then((g) => {
      if (!g) navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
      else setGame(g);
    });
  }, [navigation]);

  // Going back to the round only makes sense while there is time left and nothing is revealed yet.
  // Otherwise back arrow, swipe and the Android back button are all disabled.
  const canGoBack = Boolean(game) && !result && remainingMs(game) > 0;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: canGoBack });
  }, [navigation, canGoBack]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => !canGoBack);
      return () => sub.remove();
    }, [canGoBack]),
  );

  if (!game) return <SafeAreaView style={styles.safe} />;

  // Saves the round in the history, deletes the running round and shows the result.
  const reveal = async () => {
    if (selected.length !== game.spies.length) return;
    const outcome = evaluateVote(game, selected);
    await addToHistory(historyEntry(game, outcome.winner));
    await clearActiveGame();
    setResult(outcome);
  };

  // Tap again to unselect. At most as many people as there are spies can be selected.
  const toggle = (name) => setSelected((current) => {
    if (current.includes(name)) return current.filter((n) => n !== name);
    return current.length < game.spies.length ? [...current, name] : current;
  });

  // "Nochmal spielen" keeps the start screen below, so the back arrow in the setup still works.
  const playAgain = () => navigation.reset({ index: 1, routes: [{ name: 'Start' }, { name: 'Setup' }] });
  const toStart = () => navigation.reset({ index: 0, routes: [{ name: 'Start' }] });

  if (result) {
    const many = game.spies.length > 1;
    const groupWins = result.winner === 'group';
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Badge text={groupWins ? 'Gruppe gewinnt' : many ? 'Spione gewinnen' : 'Spion gewinnt'} tone={groupWins ? 'hint' : 'spy'} />
            <Text style={styles.votedText}>Ihr habt {joinNames(result.votedNames)} gewählt.</Text>
          </View>
          <View style={styles.resultCard} accessibilityLiveRegion="polite">
            <Text style={styles.resultLabel}>{many ? 'Die Spione waren' : 'Der Spion war'}</Text>
            <Text style={styles.resultValue} adjustsFontSizeToFit numberOfLines={2}>{joinNames(game.spies)}</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Das Wort war</Text>
            <Text style={styles.resultValue} adjustsFontSizeToFit numberOfLines={1}>{game.word}</Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton title="Nochmal spielen" onPress={playAgain} />
          <PrimaryButton title="Zum Start" variant="secondary" onPress={toStart} style={{ marginTop: sizes.gap }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Abstimmen"
          left={canGoBack ? <IconButton symbol="‹" accessibilityLabel="Zurück zur Runde" onPress={() => navigation.goBack()} /> : null}
        />
      </View>
      <FlatList
        data={game.players}
        keyExtractor={(name, index) => `${name}-${index}`}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title} accessibilityRole="header">Wer ist der Spion?</Text>
            <Text style={styles.subtitle}>
              Wählt genau {game.spies.length} {game.spies.length === 1 ? 'Person' : 'Personen'}. Alle Spione müssen gefunden werden. ({selected.length}/{game.spies.length})
            </Text>
          </>
        }
        renderItem={({ item: name }) => (
          <VotePlayerRow
            name={name}
            selected={selected.includes(name)}
            onPress={() => toggle(name)}
          />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton title="Aufdecken" onPress={reveal} disabled={selected.length !== game.spies.length} accessibilityHint="Genau so viele Personen wählen, wie es Spione gibt" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: sizes.padding, paddingTop: 8 },
  content: { paddingHorizontal: sizes.padding, paddingBottom: 16 },
  title: { fontSize: font.title + 2, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: font.body, color: colors.muted, marginBottom: 20, lineHeight: 23 },
  resultContent: { padding: sizes.padding, paddingTop: 32 },
  votedText: { fontSize: font.small + 1, color: colors.muted, marginTop: 10 },
  resultCard: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.surface,
    alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16, marginBottom: 16,
  },
  resultLabel: { fontSize: font.body, color: colors.muted },
  resultValue: { fontSize: 52, color: colors.text, textAlign: 'center' },
  footer: { paddingHorizontal: sizes.padding, paddingBottom: 12, paddingTop: 8 },
});
