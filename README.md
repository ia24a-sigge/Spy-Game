# Spy Game

Partyspiel-App für das Modul M335 (Mobile Applikationen realisieren). Eine Gruppe spielt mit **einem** Handy:
Alle bekommen dasselbe geheime Wort, ausser dem Spion. In der Fragerunde versucht die Gruppe herauszufinden,
wer der Spion ist, und der Spion versucht, nicht aufzufliegen.

**Team:** Kaija Bolliger, Elin Sigg

## Features

- Spieler, Kategorie, Anzahl Spione und Rundenzeit einstellen (mit Validierung)
- Karten reihum verteilen, jede Person sieht nur ihre eigene Karte
- Handy umdrehen verdeckt die Karte (Beschleunigungssensor)
- Countdown mit Pause, pausiert automatisch, wenn die App in den Hintergrund geht
- Abstimmung und Auflösung, auch mit mehreren Spionen
- Laufende Runde wird gespeichert und kann fortgesetzt werden
- Verlauf der letzten 20 Runden
- Wörter von der Wikipedia-API, offline mit eigener Wortliste als Fallback

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, JavaScript |
| Navigation | React Navigation 7 (Native Stack) |
| Persistenz | AsyncStorage |
| Sensor | `expo-sensors` (Accelerometer) |
| Tests | Jest (`jest-expo`) |

## Starten

Voraussetzungen: Node.js 20 oder neuer und auf dem Handy die App **Expo Go** (SDK 57).

```bash
npm install
npx expo start
```

QR-Code mit der Kamera (iOS) oder in Expo Go (Android) scannen. Handy und Computer müssen im selben WLAN sein,
sonst `npx expo start --tunnel`.

Meldet Expo Go eine falsche SDK-Version: `npx expo install --fix`.

| Befehl | Was es macht |
|---|---|
| `npm start` | Dev-Server starten |
| `npm run android` / `npm run ios` | Direkt auf Emulator oder Simulator öffnen |
| `npm test` | Unit-Tests ausführen |

## Mindestanforderungen

| Anforderung | Umsetzung |
|---|---|
| Eingabeformular mit Validierung | Einrichten: leere und doppelte Namen, max. 20 Zeichen, mind. 3 Spieler, gültige Anzahl Spione. «Karten verteilen» bleibt grau, bis alles stimmt. |
| Persistenz | AsyncStorage mit 4 Schlüsseln (siehe unten) |
| 4–5 Screens | Start, Einrichten, Karte, Runde, Auflösung |
| Sensor | Beschleunigungssensor: Handy umdrehen verdeckt die Karte |

## Aufbau

```
App.js                     Navigation (Native Stack)
src/
  screens/
    StartScreen.js         Start: Runde fortsetzen, Verlauf, neue Runde
    SetupScreen.js         Einrichten (Eingabeformular)
    CardScreen.js          Karte (Sensor)
    RoundScreen.js         Runde (Countdown, Pause)
    VoteScreen.js          Auflösung (Abstimmen, Ergebnis)
  components/
    ui.js                  Basis-Bausteine: PrimaryButton, IconButton, Stepper, Header, Badge, Notice
    ConfirmDialog.js       Bestätigungsdialog (Start und Runde)
    HistoryRow.js          Zeile im Verlauf
    VotePlayerRow.js       Spielerzeile bei der Abstimmung
  lib/
    game.js                Spiel-Logik ohne React (Wort/Spion ziehen, Timer, Auswertung)
    validation.js          Validierung des Formulars
    storage.js             AsyncStorage: players, settings, activeGame, history
    wordApi.js             Wörter von der Wikipedia-API mit Offline-Fallback
    faceDown.js            Schwellwerte für «Display nach unten»
    useFaceDown.js         Hook für den Beschleunigungssensor
  data/words.json          Offline-Wortlisten (4 Kategorien × 20 Wörter)
  theme.js                 Farben, Grössen, Schriftgrössen
__tests__/                 Unit-Tests (Jest)
docs/TESTKONZEPT.md        Manuelle Testfälle auf dem Gerät
```

## Navigation

| Von | Aktion | Nach |
|---|---|---|
| Start | «Neue Runde» | Einrichten (bei laufender Runde zuerst Bestätigung) |
| Start | «Runde fortsetzen» | Runde oder Karte, falls noch Karten offen sind |
| Einrichten | «Karten verteilen» | Karte |
| Karte | «Weitergeben» | nächste Karte (replace) |
| Karte | «Runde starten» (letzte Person) | Runde (replace) |
| Runde | ✕ oder Android-Zurück | Dialog «Runde beenden?» |
| Runde | «Abstimmen» oder Zeit abgelaufen | Auflösung |
| Auflösung | «Nochmal spielen» / «Zum Start» | Einrichten / Start |

Auf dem Karten-Screen gibt es keinen Zurück-Weg (keine Geste, keine Android-Zurücktaste), damit niemand die Karte
einer anderen Person sieht.

## Persistenz

Lokal mit **AsyncStorage**, jeweils als JSON. Kein Server, kein Login.

| Schlüssel | Inhalt | Gelöscht |
|---|---|---|
| `players` | Spielernamen | nie, wird beim nächsten Verteilen überschrieben |
| `settings` | Kategorie, Anzahl Spione, Zeit | nie |
| `activeGame` | Wort, Spione, Startperson, aktuelle Karte, Phase, Restzeit/Endzeit, Pause | nach der Auflösung oder bei «Beenden» |
| `history` | letzte 20 Runden: Datum, Kategorie, Anzahl Spieler, Spione, Ergebnis | älteste Runde ab 21 Einträgen |

- Der Countdown speichert nicht jede Sekunde, sondern die Endzeit (läuft) bzw. die Restzeit (pausiert).
- Das Wort wird nicht in den Verlauf übernommen.
- Fehlerhafte Daten führen nicht zum Absturz: Der Schlüssel wird zurückgesetzt und der Startscreen zeigt einen Hinweis.

## Special Feature: Beschleunigungssensor

1. Die Karte startet verdeckt. Die Person tippt «Aufdecken» und liest ihr Wort oder «Spion».
2. Handy umdrehen (Display nach unten): Die Karte wird sofort verdeckt.
3. Wieder umdrehen: Es geht automatisch zur nächsten Person.
4. Ohne Sensor erscheint ein Hinweis, die Buttons funktionieren immer.

Der Sensor läuft nur, solange er gebraucht wird. Erkennung: `z > 0.75 g` = Display unten, zurück bei `z < 0.4 g`
(Hysterese gegen Flackern). Schwellen in `src/lib/faceDown.js`.

## Bewusst weggelassen

Online-Multiplayer, Ranglisten, eigene Wortlisten, Statistiken.
