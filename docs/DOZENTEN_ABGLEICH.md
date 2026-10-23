# Abgleich mit den Unterlagen des Dozenten (23.10.2026)

## Basis
- JavaScript / Expo SDK 57 / React Navigation 7: `package.json`, `App.js`.
- Gemeinsame UI-Bausteine und Styles: `src/components/ui.js`, `src/theme.js`.
- Eingabe und `useState`: `SetupScreen.js`.
- Sensor mit Verfügbarkeitsprüfung und Cleanup: `src/lib/useFaceDown.js`.
- Mindestgrösse 48 dp: `sizes.touch` in `src/theme.js` (übrige Touch-Flächen separat prüfen).

## Kern
- Formular mit `KeyboardAvoidingView` und Validierung: `SetupScreen.js`, `src/lib/validation.js`.
- AsyncStorage mit vier Schlüsseln: `src/lib/storage.js`.
- Stack-Navigation: `App.js`; `replace` bei Rollenwechsel: `CardScreen.js`.
- `FlatList` für Abstimmung: `VoteScreen.js`; Spielerzeile ausgelagert in `src/components/VotePlayerRow.js`.
- Sensor: `src/lib/faceDown.js`, `src/lib/useFaceDown.js`.
- Countdown mit Cleanup: `RoundScreen.js`.
- Tests für Spiellogik und Validierung: `__tests__/`.

## Bewusste Abweichungen / noch zu prüfen
- **Farben**: Die Dozentenunterlagen nennen #003D52 und #FF671C; diese Version behält bewusst eure bestehenden Mockup-Farben, weil das UI unverändert bleiben soll. Vor Abgabe mit dem Dozenten klären.
- **Bottom Tabs**: Das Beispiel fordert Tabs (Spielen/Verlauf/Einstellungen). Euer festgelegter fünfstufiger Spielablauf verwendet weiterhin Stack-Navigation. Tabs würden die bestehende Bedienung verändern; deshalb nicht stillschweigend eingebaut.
- **FlatList**: Abstimmung ist umgestellt. Die editierbare Spielerliste im Formular und der kurze Verlauf (max. 20) nutzen weiterhin ihre bestehende Darstellung, um Eingabefokus und Layout nicht zu verändern.
- **API**: Eure bestehende Wikipedia-Anbindung mit Offline-Fallback bleibt erhalten. Der Dozent empfiehlt eine bewusst offline funktionierende App ohne externe API; die Anbindung ist für den Kern nicht nötig. Im Unterricht klären, ob sie entfernt werden soll.
- **Kann / EherNicht**: Keine zusätzlichen Nice-to-have-Features eingebaut; Fokus auf stabilen Kern.

## Testen
1. `npm install` und `npm test -- --runInBand`.
2. `npx expo start --clear`, auf echtem Handy Sensorfolge (aufdecken, umdrehen, zurückdrehen) testen.
3. Spieler hinzufügen/entfernen, doppelte Namen, mehrere Spione und Abstimmung testen.
4. Laufende Runde fortsetzen und neues Popup testen.

Hinweis: Die Codeänderungen wurden statisch geprüft; ein Test auf einem echten iPhone war hier nicht möglich.
