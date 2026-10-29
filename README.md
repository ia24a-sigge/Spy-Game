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
- Klingelton und Vibration, sobald die Zeit abgelaufen ist (Ton auch im Lautlos-Modus auf dem iPhone)
- Bildschirm bleibt während der Runde an, damit die Zeit nicht durch die automatische Sperre pausiert
- Abstimmung und Auflösung, auch mit mehreren Spionen
- Laufende Runde wird gespeichert und kann fortgesetzt werden
- Verlauf der letzten 20 Runden
- Wörter von der Wikipedia-API, offline mit eigener Wortliste als Fallback

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, JavaScript |
| Navigation | React Navigation 7 (Native Stack) |
| Persistenz | AsyncStorage |
| Sensor | `expo-sensors` (Accelerometer) |
| Sound | `expo-audio`, Klingelton in `assets/ring.wav` |
| Bildschirm an | `expo-keep-awake` (während der Runde) |
| Tests | Jest (`jest-expo`) |

## Starten

Voraussetzungen: Node.js 22 oder neuer und auf dem Handy die aktuelle App **Expo Go** (SDK 58).

```bash
npm install
npx expo start
```

QR-Code mit der Kamera (iOS) oder in Expo Go (Android) scannen. Handy und Computer müssen im selben WLAN sein,
sonst `npx expo start --tunnel`.

### Fehler beim Starten

**Expo Go meldet eine falsche SDK-Version** (z. B. «Project is incompatible with this version of Expo Go»):

```bash
npm install expo@^58.0.0
npx expo install --fix
npx expo start --clear
```

Immer beide Befehle ausführen. `npm install expo@^58.0.0` aktualisiert nur Expo selbst, `npx expo install --fix`
bringt danach React Native und alle anderen Pakete auf die passende Version.

**«Unable to resolve module react-native/unstable-internals-do-not-use»** oder viele Warnungen
«invalid package.json configuration»: Expo und React Native passen nicht zusammen, meistens weil nach
`npm install expo@...` der zweite Befehl gefehlt hat.

```bash
npx expo install --fix
npx expo start --clear
```

Hilft das nicht, `node_modules` löschen und neu installieren (Windows PowerShell, auf macOS `rm -rf node_modules`):

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

**«Port 8081 is being used by another process»:** Mit `y` einen anderen Port nehmen oder das alte Terminal mit
`npx expo start` schliessen.

**Kein Klingelton:** Medienlautstärke am Handy hochdrehen (nicht nur den Klingelton) und prüfen, ob Bluetooth-Kopfhörer verbunden sind. Das Handy vibriert trotzdem.

Prüfen, ob alles zusammenpasst: `npx expo-doctor`

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
    RoundScreen.js         Runde (Countdown, Pause, Klingelton)
    VoteScreen.js          Auflösung (Abstimmen, Ergebnis)
  components/
    ui.js                  Basis-Bausteine: PrimaryButton, IconButton, Stepper, Header, Badge, Notice
    ConfirmDialog.js       Bestätigungsdialog (Start und Runde)
    HistoryRow.js          Zeile im Verlauf
    PlayerInputRow.js      Namensfeld im Formular (Einrichten)
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

## Erweiterung: Klingelton am Rundenende

Neu hinzugefügt: Sobald der Countdown auf 0 ist, ertönt ein Klingelton, das Handy vibriert und die Abstimmung
öffnet sich automatisch. So merkt die Gruppe das Rundenende auch, wenn niemand aufs Display schaut.

1. Runde starten, der Countdown läuft.
2. Zeit läuft ab: Klingelton (2.4 s) und Vibration.
3. Die Abstimmung öffnet sich automatisch.

- Wer selbst auf «Abstimmen» tippt, hört keinen Ton. Er kommt nur, wenn die Zeit abläuft.
- Der Ton kommt auch im Lautlos-Modus auf dem iPhone (`playsInSilentMode`). Lauter oder leiser stellt man ihn mit der
  Medienlautstärke.
- Während der Runde bleibt der Bildschirm an (`expo-keep-awake`). Sonst würde sich das Handy automatisch sperren, die
  Runde würde pausieren und die Zeit nie ablaufen.
- Der Ton liegt in `assets/ring.wav` und wird mit `expo-audio` abgespielt. Er wird zuerst lokal aufs Handy geladen
  (`downloadFirst`), weil das iPhone in Expo Go die Datei vom Dev-Server sonst nicht abspielt.
- Umgesetzt in `src/screens/RoundScreen.js`, Testfälle T18, T19 und T24 in `docs/TESTKONZEPT.md`.

## Bewusst weggelassen

Online-Multiplayer, Ranglisten, eigene Wortlisten, Statistiken.
