// Screen 2 "Einrichten": input form with validation (names, category, number of spies, round time).
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, PrimaryButton, ScreenHeader, SectionLabel, Stepper } from '../components/ui';
import PlayerInputRow from '../components/PlayerInputRow';
import { loadPlayers, loadSettings, saveActiveGame, savePlayers, saveSettings } from '../lib/storage';
import {
  CATEGORIES, DEFAULT_SETTINGS, MAX_MINUTES, MAX_PLAYERS, MIN_MINUTES, MIN_PLAYERS, createGame, maxSpies,
} from '../lib/game';
import { validateSetup } from '../lib/validation';
import { getRandomWord } from '../lib/wordApi';
import { colors, font, sizes } from '../theme';

// Every row gets a stable id, so React keeps the right text field when a row in the middle is removed.
let nextId = 1;

/** Creates a form row. Prefilled names count as "touched", so their errors are shown right away. */
const createRow = (name = '') => ({ id: nextId++, name, touched: name !== '' });

export default function SetupScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputs = useRef({});

  // Prefill the names and settings of the last round, so a group can restart quickly.
  useEffect(() => {
    Promise.all([loadPlayers(), loadSettings()]).then(([players, saved]) => {
      const names = players.length > 0 ? players : Array(MIN_PLAYERS).fill('');
      setRows(names.map(createRow));
      setSettings(saved);
      setLoaded(true);
    });
  }, []);

  const names = rows.map((r) => r.name);
  const spyLimit = maxSpies(names.length);
  const result = validateSetup({ players: names, spies: settings.spies });

  // Lower the number of spies automatically when players are removed.
  useEffect(() => {
    if (rows.length > 0 && settings.spies > spyLimit) setSettings((s) => ({ ...s, spies: spyLimit }));
  }, [spyLimit, settings.spies, rows.length]);

  const updateRow = (id, changes) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const addRow = () => {
    const row = createRow();
    setRows((rs) => [...rs, row]);
    setTimeout(() => inputs.current[row.id]?.focus(), 50);
  };

  // Saves names and settings, creates the round and opens the first card.
  const distribute = async () => {
    setSubmitted(true);
    if (!result.valid || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const players = names.map((n) => n.trim());
      await Promise.all([savePlayers(players), saveSettings(settings)]);
      const word = await getRandomWord(settings.category);
      await saveActiveGame({ ...createGame({ players, ...settings }), word });
      navigation.navigate('Card');
    } catch (error) {
      console.warn('[setup] Saving failed', error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            title="Neue Runde"
            left={<IconButton symbol="‹" accessibilityLabel="Zurück zum Start" onPress={() => navigation.goBack()} />}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SectionLabel right={<View style={styles.count}><Text style={styles.countText}>{rows.length}</Text></View>}>
            Spieler
          </SectionLabel>

          {rows.map((row, index) => (
            <PlayerInputRow
              key={row.id}
              index={index}
              name={row.name}
              error={row.touched || submitted ? result.fieldErrors[index] : ''}
              inputRef={(el) => { inputs.current[row.id] = el; }}
              onChangeText={(name) => updateRow(row.id, { name })}
              onBlur={() => updateRow(row.id, { touched: true })}
              onRemove={() => removeRow(row.id)}
            />
          ))}

          {loaded && !!result.playersError && <Text style={[styles.errorText, { marginBottom: 8 }]}>{result.playersError}</Text>}

          <Pressable
            onPress={addRow}
            disabled={rows.length >= MAX_PLAYERS}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addButton, rows.length >= MAX_PLAYERS && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.addText}>+  Spieler hinzufügen</Text>
          </Pressable>

          <SectionLabel>Kategorie</SectionLabel>
          <View style={styles.categories}>
            {CATEGORIES.map((category) => {
              const selected = settings.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSetting('category', category)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.category, selected && styles.categorySelected]}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 20 }}>
            <Stepper label="Spione" value={settings.spies} min={1} max={spyLimit} onChange={(v) => setSetting('spies', v)} />
            <Stepper
              label="Zeit"
              value={settings.minutes}
              display={`${settings.minutes} min`}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              onChange={(v) => setSetting('minutes', v)}
            />
            {!!result.spiesError && <Text style={styles.errorText}>{result.spiesError}</Text>}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saveError && <Text style={styles.errorText}>Speichern fehlgeschlagen. Bitte versuche es erneut.</Text>}
          <PrimaryButton
            title="Karten verteilen"
            onPress={distribute}
            disabled={!loaded || !result.valid || saving}
            accessibilityHint="Bleibt grau, bis alle Felder stimmen"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: sizes.padding, paddingTop: 8 },
  content: { paddingHorizontal: sizes.padding, paddingBottom: 16 },
  count: { minWidth: 30, height: 26, borderRadius: 6, backgroundColor: colors.covered, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: font.small, color: colors.text },
  errorText: { color: colors.danger, fontSize: font.small, marginTop: 4 },
  addButton: {
    minHeight: sizes.touch + 4,
    borderWidth: 1,
    borderColor: colors.primaryStrong,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: colors.surface,
  },
  addText: { color: colors.primaryStrong, fontSize: font.body + 1 },
  categories: { flexDirection: 'row', gap: sizes.gap },
  category: {
    flex: 1,
    minHeight: sizes.touch + 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelected: { backgroundColor: colors.primary, borderColor: colors.primaryStrong },
  categoryText: { fontSize: font.body, color: colors.text },
  footer: { paddingHorizontal: sizes.padding, paddingBottom: 12, paddingTop: 8 },
});
