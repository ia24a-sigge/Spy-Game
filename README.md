# Spy Game

Partyspiel-App für M335 (Mobile Applikationen realisieren). Mehrere Personen spielen mit **einem** Handy:
Alle bekommen dasselbe geheime Wort, ausser dem Spion. In der Fragerunde versucht die Gruppe herauszufinden,
wer der Spion ist.

Team: Kaija Bolliger, Elin Sigg · Expo SDK 58 · React Native · JavaScript

## Starten

Voraussetzungen: Node.js 20 oder neuer, auf dem Handy die App **Expo Go** (aktuelle Version, SDK 57).

```bash
npm install
npx expo install --fix   # gleicht alle Paketversionen an das installierte Expo SDK an
npx expo start
```

Dann den QR-Code mit der Kamera (iOS) oder in Expo Go (Android) scannen. Handy und Computer müssen im selben WLAN sein,
sonst `npx expo start --tunnel`.

Tests: `npm test`

> Falls Expo Go meldet, dass das Projekt eine andere SDK-Version braucht: `npx expo install expo@latest` und danach
> `npx expo install --fix`.

## Mindestanforderungen

| Anforderung                     | Umsetzung                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eingabeformular mit Validierung | Screen 2 · Einrichten: Namen, Kategorie, Spione, Zeit. Prüft leere und doppelte Namen, max. 20 Zeichen, mind. 3 Spieler, gültige Anzahl Spione. «Karten verteilen» bleibt grau, bis alles stimmt. |
| Persistenz                      | AsyncStorage mit 4 Schlüsseln (siehe unten)                                                                                                                                                       |
| 4–5 Screens                     | Start, Einrichten, Karte, Runde, Auflösung + Dialog «Runde beenden?»                                                                                                                              |
| Sensor                          | Beschleunigungssensor (`expo-sensors`): Handy umdrehen verdeckt die Karte                                                                                                                         |

## Aufbau

```
App.js                     Navigation (Native Stack, keine Tab Bar)
src/
  screens/
    StartScreen.js         Screen 1 · Start (Runde fortsetzen, letzte Runden, Leerzustand)
    SetupScreen.js         Screen 2 · Einrichten (Eingabeformular)
    CardScreen.js          Screen 3 · Karte (Special Feature: Sensor)
    RoundScreen.js         Screen 4 · Runde (Countdown, Pause, Dialog «Runde beenden?»)
    VoteScreen.js          Screen 5 · Auflösung (Abstimmen, Ergebnis)
  components/ui.js         gemeinsame Bausteine: PrimaryButton (56 pt), IconButton (44 pt), Stepper, Header …
  lib/
    game.js                Spiel-Logik ohne React (Wort/Spion ziehen, Timer, Auswertung)
    validation.js          Validierung von Screen 2
    storage.js             AsyncStorage: players, settings, activeGame, history
    faceDown.js            Schwellwerte für «Display nach unten»
    useFaceDown.js         Hook für den Beschleunigungssensor
  data/words.json          Wortlisten (4 Kategorien × 20 Wörter), offline
  theme.js                 Farben und Masse aus den Mockups
__tests__/                 Unit-Tests (Jest)
docs/TESTKONZEPT.md        manuelle Testfälle auf dem Gerät
```

## Navigation (wie im Workflow-Diagramm)

| Von        | Aktion                           | Nach                                             | Typ                |
| ---------- | -------------------------------- | ------------------------------------------------ | ------------------ |
| Start      | «Neue Runde»                     | Einrichten                                       | push               |
| Start      | «Runde fortsetzen»               | Runde (oder Karte, falls noch Karten offen sind) | push               |
| Einrichten | Zurück-Pfeil                     | Start                                            | pop                |
| Einrichten | «Karten verteilen»               | Karte                                            | push               |
| Karte      | «Weitergeben»                    | nächste Karte                                    | replace            |
| Karte      | «Runde starten» (letzte Person)  | Runde                                            | replace            |
| Runde      | ✕                                | Dialog «Runde beenden?»                          | Modal              |
| Dialog     | «Weiterspielen» / «Beenden»      | Runde / Start                                    | schliessen / reset |
| Runde      | «Abstimmen» oder Zeit abgelaufen | Auflösung                                        | push               |
| Auflösung  | Zurück-Pfeil (vor dem Aufdecken) | Runde                                            | pop                |
| Auflösung  | «Nochmal spielen» / «Zum Start»  | Einrichten / Start                               | reset              |

Screen 3 hat keinen Zurück-Weg (auch keine Geste und keine Android-Zurücktaste), damit niemand die Karte einer
anderen Person sieht. Auf Screen 4 öffnet die Android-Zurücktaste den Dialog.

## Persistenz

Gespeichert wird lokal mit **AsyncStorage** (Key-Value, als JSON). Kein Server, keine Datenbank, kein Login.

| Schlüssel    | Inhalt                                                                              | Wann gelöscht                             |
| ------------ | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| `players`    | Liste der Spielernamen                                                              | nie, nur wenn ein Name entfernt wird      |
| `settings`   | Kategorie, Anzahl Spione, Zeit                                                      | nie                                       |
| `activeGame` | Wort, Spion(e), Startperson, gesehene Karten, Phase, Restzeit/Endzeit, Pausenstatus | nach dem Aufdecken oder bei «Beenden»     |
| `history`    | letzte 20 Runden: Datum, Kategorie, Anzahl Spieler, Spion, Ergebnis                 | älteste Runde, sobald mehr als 20 da sind |

- Bei «Karten verteilen» werden `players` und `settings` gespeichert und `activeGame` angelegt.
- `activeGame` wird bei jedem «Weitergeben», bei Pause/Weiter und beim Wechsel in den Hintergrund aktualisiert.
  Geht die App in den Hintergrund (z. B. Anruf), wird die Runde automatisch pausiert.
- Der Countdown speichert nicht jede Sekunde, sondern die Endzeit (läuft) bzw. die Restzeit (pausiert).
- Nicht gespeichert: angezeigte Sekunde, Auswahl bei der Abstimmung, Sensorwerte, Wort einer beendeten Runde.
- Fehlerhafte Daten führen nicht zum Absturz: Der Schlüssel wird zurückgesetzt und der Startscreen zeigt einen Hinweis.

## Special Feature: Beschleunigungssensor

1. Die Karte startet verdeckt. Die Person tippt «Aufdecken» und liest ihr Wort oder «Spion».
2. Handy umdrehen (Display nach unten): Die Karte wird sofort verdeckt.
3. «Weitergeben» ist erst aktiv, wenn die Karte angeschaut und wieder verdeckt wurde.
4. Ohne Sensor erscheint ein Hinweis, der Button «Karte verdecken» funktioniert immer.

Der Sensor läuft nur, solange eine Karte offen ist (spart Akku). Erkennung: `z > 0.75 g` = Display unten,
zurück bei `z < 0.4 g` (Hysterese gegen Flackern). Schwellen in `src/lib/faceDown.js`.

## Bewusst weggelassen (KISS)

Online-Multiplayer, Ranglisten, eigene Wortlisten, Statistiken (dafür wäre SQLite sinnvoll).
