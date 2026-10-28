// Screen 2 · Einrichten: Eingabeformular mit Validierung.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, IconButton, PrimaryButton, ScreenHeader, SectionLabel, Stepper } from '../components/ui';
import { loadPlayers, loadSettings, saveActiveGame, savePlayers, saveSettings } from '../lib/storage';
import {
  CATEGORIES, DEFAULT_SETTINGS, MAX_MINUTES, MAX_PLAYERS, MIN_MINUTES, MIN_PLAYERS, createGame, maxSpies,
} from '../lib/game';
import { MAX_NAME_LENGTH, validateSetup } from '../lib/validation';
import { getRandomWord } from '../lib/wordApi';
import { colors, font, sizes } from '../theme';

let nextId = 1;
const row = (name = '') => ({ id: nextId++, name, touched: name !== '' });

export default function SetupScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputs = useRef({});

  // Gespeicherte Namen und Einstellungen vorausfüllen (Aufgabenangemessenheit).
  useEffect(() => {
    Promise.all([loadPlayers(), loadSettings()]).then(([players, saved]) => {
      const names = players.length > 0 ? players : Array(MIN_PLAYERS).fill('');
      setRows(names.map((n) => row(n)));
      setSettings(saved);
      setLoaded(true);
    });
  }, []);

  const names = rows.map((r) => r.name);
  const spyLimit = maxSpies(names.length);

  // Anzahl Spione automatisch anpassen, wenn Spieler entfernt werden.
  useEffect(() => {
    if (rows.length > 0 && settings.spies > spyLimit) setSettings((s) => ({ ...s, spies: spyLimit }));
  }, [spyLimit, settings.spies, rows.length]);

  const result = validateSetup({ players: names, spies: settings.spies });

  const updateName = (id, name) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, name } : r)));
  const touch = (id) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, touched: true } : r)));
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => {
    const r = row();
    setRows((rs) => [...rs, r]);
    setTimeout(() => inputs.current[r.id]?.focus(), 50);
  };

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
      console.warn('[setup] Speichern fehlgeschlagen', error);
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

          {rows.map((r, index) => {
            const error = (r.touched || submitted) ? result.fieldErrors[index] : '';
            return (
              <View key={r.id} style={styles.playerBlock}>
                <View style={styles.playerRow}>
                  <View style={[styles.inputWrap, error && styles.inputError]}>
                    <Avatar text={String(index + 1)} size={26} fill={colors.primarySoft} />
                    <TextInput
                      ref={(el) => { inputs.current[r.id] = el; }}
                      style={styles.input}
                      value={r.name}
                      onChangeText={(t) => updateName(r.id, t)}
                      onBlur={() => touch(r.id)}
                      placeholder="Name eingeben"
                      placeholderTextColor={colors.muted}
                      maxLength={MAX_NAME_LENGTH + 5}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      accessibilityLabel={`Name Spieler ${index + 1}`}
                    />
                  </View>
                  <IconButton symbol="×" accessibilityLabel={`Spieler ${index + 1} entfernen`} onPress={() => removeRow(r.id)} style={{ marginLeft: sizes.gap, alignItems: 'center', justifyContent: 'center' }} />
                </View>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            );
          })}

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
            {CATEGORIES.map((c) => {
              const selected = settings.category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setSettings((s) => ({ ...s, category: c }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.category, selected && styles.categorySelected]}
                >
                  <Text style={styles.categoryText}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 20 }}>
            <Stepper label="Spione" value={settings.spies} min={1} max={spyLimit} onChange={(v) => setSettings((s) => ({ ...s, spies: v }))} />
            <Stepper
              label="Zeit"
              value={settings.minutes}
              display={`${settings.minutes} min`}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              onChange={(v) => setSettings((s) => ({ ...s, minutes: v }))}
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
  playerBlock: { marginBottom: sizes.gap },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: {
    flex: 1,
    minHeight: sizes.touch + 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingLeft: 10,
  },
  inputError: { borderColor: colors.danger, borderWidth: 1.5 },
  input: { flex: 1, minHeight: sizes.touch, fontSize: font.body + 1, color: colors.text, paddingHorizontal: 10 },
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
