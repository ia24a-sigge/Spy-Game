// Screen 1 · Start: neue Runde starten oder laufende Runde fortsetzen.
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import {
  Avatar,
  Badge,
  Notice,
  PrimaryButton,
  SectionLabel,
} from "../components/ui";

import {
  clearActiveGame,
  loadActiveGame,
  loadHistory,
  takeStorageWarnings,
} from "../lib/storage";

import {
  formatShortDate,
  formatTime,
  joinNames,
  remainingMs,
} from "../lib/game";

import { colors, font, sizes } from "../theme";

export default function StartScreen({ navigation }) {
  const [activeGame, setActiveGame] = useState(null);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  // NEU: Eigenes Popup
  const [showNewRoundModal, setShowNewRoundModal] = useState(false);
  const [isStartingNewRound, setIsStartingNewRound] = useState(false);

  // Bei jedem Öffnen des Screens neu laden.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([loadActiveGame(), loadHistory()]).then(([game, list]) => {
        if (!active) return;

        setActiveGame(game);
        setHistory(list);
        setLoaded(true);

        if (takeStorageWarnings().length > 0) {
          setStorageWarning(true);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  // Laufende Runde fortsetzen
  const resume = () => {
    if (!activeGame) return;

    navigation.navigate(activeGame.phase === "cards" ? "Card" : "Round");
  };

  // Neue Runde starten
  const newRound = () => {
    if (!loaded || isStartingNewRound) return;

    // Keine laufende Runde vorhanden
    if (!activeGame) {
      navigation.navigate("Setup");
      return;
    }

    // NEU: Eigenes Popup öffnen
    setShowNewRoundModal(true);
  };

  // NEU: Popup schliessen
  const cancelNewRound = () => {
    if (isStartingNewRound) return;

    setShowNewRoundModal(false);
  };

  // NEU: Neue Runde bestätigen
  const confirmNewRound = async () => {
    if (isStartingNewRound) return;

    setIsStartingNewRound(true);

    try {
      await clearActiveGame();

      setActiveGame(null);
      setShowNewRoundModal(false);

      navigation.navigate("Setup");
    } catch (error) {
      console.error("Neue Runde konnte nicht gestartet werden:", error);
      setStorageWarning(true);
    } finally {
      setIsStartingNewRound(false);
    }
  };

  const isEmpty = loaded && !activeGame && history.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.brand}>
          <Avatar text="S" size={40} fill={colors.primary} />

          <Text style={styles.brandText}>Spy Game</Text>
        </View>

        {/* Titel */}
        <Text style={styles.title} accessibilityRole="header">
          Wer ist der Spion?
        </Text>

        <Text style={styles.subtitle}>
          Ein Handy, eine Gruppe, ein geheimes Wort.
        </Text>

        {/* Speicherwarnung */}
        {storageWarning && (
          <Notice tone="warning" style={{ marginBottom: 16 }}>
            Gespeicherte Daten waren fehlerhaft und wurden zurückgesetzt. Du
            kannst normal weiterspielen.
          </Notice>
        )}

        {/* Laufende Runde */}
        {activeGame && (
          <Pressable
            onPress={resume}
            accessibilityRole="button"
            accessibilityLabel="Laufende Runde fortsetzen"
            style={({ pressed }) => [
              styles.resume,
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeLabel}>LAUFENDE RUNDE</Text>

              <Text style={styles.resumeTitle}>Runde fortsetzen</Text>

              <Text style={styles.resumeMeta}>
                {activeGame.players.length} Spieler
                {" · "}
                {activeGame.category}
                {" · "}
                {activeGame.phase === "cards"
                  ? `Karte ${activeGame.cardIndex + 1} von ${activeGame.players.length}`
                  : `noch ${formatTime(remainingMs(activeGame))}`}
              </Text>
            </View>

            <Text style={styles.play}>▶</Text>
          </Pressable>
        )}

        {/* Leerer Verlauf */}
        {isEmpty ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyQ}>?</Text>
            </View>

            <Text style={styles.emptyTitle}>Noch keine Runden</Text>

            <Text style={styles.emptyText}>Starte die erste Runde.</Text>
          </View>
        ) : (
          history.length > 0 && (
            <>
              <SectionLabel>Letzte Runden</SectionLabel>

              {history.map((entry) => (
                <View key={entry.id + entry.date} style={styles.historyRow}>
                  <Avatar text={entry.category[0]} size={40} />

                  <View style={styles.historyText}>
                    <Text style={styles.historyTitle}>
                      {entry.category}
                      {" · "}
                      {entry.playerCount} Spieler
                    </Text>

                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {formatShortDate(entry.date)}
                      {" · "}
                      {entry.spies.length > 1 ? "Spione" : "Spion"}:{" "}
                      {joinNames(entry.spies)}
                    </Text>
                  </View>

                  <Badge
                    text={entry.result === "group" ? "Gruppe" : "Spion"}
                    tone={entry.result === "group" ? "hint" : "spy"}
                  />
                </View>
              ))}
            </>
          )
        )}
      </ScrollView>

      {/* Neue Runde */}
      <View style={styles.footer}>
        <PrimaryButton
          title="+  Neue Runde"
          onPress={newRound}
          disabled={!loaded || isStartingNewRound}
        />
      </View>

      {/* ===================================== */}
      {/* NEU: EIGENES BESTÄTIGUNGS-POPUP       */}
      {/* ===================================== */}

      <Modal
        visible={showNewRoundModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelNewRound}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          {/* Hintergrund anklickbar */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={cancelNewRound}
            accessibilityLabel="Popup schliessen"
          />

          {/* Popup-Karte */}
          <View style={styles.modalCard}>
            {/* Symbol */}
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>?</Text>
            </View>

            {/* Titel */}
            <Text style={styles.modalTitle}>Neue Runde starten?</Text>

            {/* Beschreibung */}
            <Text style={styles.modalDescription}>
              Du hast noch eine laufende Runde.
              {"\n\n"}
              Wenn du eine neue Runde startest, geht dein aktueller
              Spielfortschritt verloren.
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              {/* Abbrechen */}
              <Pressable
                onPress={cancelNewRound}
                disabled={isStartingNewRound}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </Pressable>

              {/* Neue Runde */}
              <Pressable
                onPress={confirmNewRound}
                disabled={isStartingNewRound}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.buttonPressed,
                  isStartingNewRound && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.confirmButtonText}>
                  {isStartingNewRound ? "Bitte warten..." : "Neue Runde"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // =====================================
  // BESTEHENDES DESIGN
  // =====================================

  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: sizes.padding,
    paddingBottom: 8,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },

  brandText: {
    fontSize: font.heading,
    color: colors.text,
  },

  title: {
    fontSize: font.title + 4,
    color: colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: font.body,
    color: colors.muted,
    marginBottom: 28,
  },

  resume: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.primaryStrong,
    borderWidth: 1,
    borderRadius: sizes.radius,
    padding: 16,
    marginBottom: 20,
  },

  resumeLabel: {
    fontSize: font.label,
    color: colors.primaryStrong,
    letterSpacing: 0.5,
  },

  resumeTitle: {
    fontSize: font.heading + 1,
    color: colors.text,
    marginVertical: 2,
  },

  resumeMeta: {
    fontSize: font.small + 1,
    color: colors.muted,
  },

  play: {
    fontSize: 22,
    color: colors.text,
    marginLeft: 12,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius,
    paddingHorizontal: 14,
    marginBottom: sizes.gap + 2,
  },

  historyText: {
    flex: 1,
    marginHorizontal: 12,
  },

  historyTitle: {
    fontSize: font.body + 1,
    color: colors.text,
  },

  historyMeta: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: 2,
  },

  empty: {
    alignItems: "center",
    marginTop: 32,
  },

  emptyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.covered,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyQ: {
    fontSize: 40,
    color: colors.muted,
  },

  emptyTitle: {
    fontSize: font.heading + 2,
    color: colors.text,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: font.body,
    color: colors.muted,
  },

  footer: {
    paddingHorizontal: sizes.padding,
    paddingBottom: 12,
    paddingTop: 8,
  },

  // =====================================
  // NEU: EIGENES POPUP-DESIGN
  // =====================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryStrong,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  modalIconText: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text,
  },

  modalTitle: {
    fontSize: font.heading + 3,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },

  modalDescription: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
  },

  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  cancelButtonText: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },

  confirmButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryStrong,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  confirmButtonText: {
    fontSize: font.body,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
