# Testkonzept Spy Game

## 1. Automatische Tests (Jest)

`npm test` führt die Unit-Tests in `__tests__/` aus. Sie prüfen die Logik ohne Handy:

| Bereich | Was wird geprüft |
|---|---|
| Spiel-Logik | Wort aus richtiger Kategorie, Spione verschieden, Anzahl Spione begrenzt |
| Timer | Endzeit, Pause/Weiter, nie negativ, Anzeige mm:ss |
| Auflösung | Gruppe gewinnt nur, wenn ein Spion gewählt wird |
| Verlauf | max. 20 Runden, kein Wort gespeichert |
| Validierung | leer, doppelt (auch Gross-/Kleinschreibung), zu lang, < 3 Spieler, zu viele Spione |
| Gespeicherte Daten | ungültige Einstellungen und activeGame werden erkannt |
| Sensor | Schwellen mit Hysterese |

## 2. Manuelle Tests auf dem Gerät (Expo Go)

Gerät: ______________________ · Betriebssystem: __________ · Datum: __________ · Tester/in: __________

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | OK? |
|---|---|---|---|---|
| T1 | Erster Start | App neu installieren und öffnen | «Noch keine Runden», nur «Neue Runde» | |
| T2 | Formular leer | Neue Runde, Feld leer lassen, antippen und verlassen | Rotes Feld, «Feld ausfüllen», «Karten verteilen» grau | |
| T3 | Doppelter Name | Zweimal «Alex» eingeben | «Name kommt doppelt vor» | |
| T4 | Zu wenige Spieler | Auf 2 Spieler löschen | «Mindestens 3 Spieler», Button grau | |
| T5 | Spione begrenzt | 3 Spieler, Spione erhöhen | «+» bleibt bei 1 deaktiviert | |
| T6 | Namen gespeichert | Runde starten, App schliessen, neue Runde | Namen und Einstellungen vorausgefüllt | |
| T7 | Karte verdeckt starten | Karten verteilen | Karte zeigt «Karte verdeckt», «Weitergeben» grau | |
| T8 | Sensor | Aufdecken, Handy mit Display nach unten hinlegen | Karte sofort verdeckt, «Weitergeben» aktiv | |
| T9 | Ohne Sensor | Aufdecken, «Karte verdecken» tippen | Karte verdeckt, «Weitergeben» aktiv | |
| T10 | Kein Zurück auf Karte | Auf Karte 2 Android-Zurück / iOS-Wischgeste | Nichts passiert | |
| T11 | Spion-Karte | Alle Karten durchgehen | Genau so viele «Spion»-Karten wie eingestellt | |
| T12 | Countdown | Runde starten, 10 s warten | Zeit läuft rückwärts | |
| T13 | Pause | «Pause», 10 s warten, «Weiter» | Zeit stand still und läuft weiter | |
| T14 | Anruf / Hintergrund | Während der Runde Home-Taste, App wieder öffnen | Runde ist pausiert, Restzeit stimmt | |
| T15 | Fortsetzen nach Neustart | Während der Runde App komplett schliessen und öffnen | Startscreen zeigt «Runde fortsetzen» mit Restzeit | |
| T16 | Beenden-Dialog | ✕, «Weiterspielen» | Dialog schliesst, Runde läuft weiter | |
| T17 | Runde beenden | ✕, «Beenden» | Startscreen, keine laufende Runde | |
| T18 | Zeit abgelaufen | Zeit 1 min, warten | Wechsel zur Abstimmung | |
| T19 | Abstimmen | Person wählen, «Aufdecken» | Ergebnis, Spion und Wort sichtbar | |
| T20 | Verlauf | Zum Start | Runde erscheint unter «Letzte Runden» mit Label | |
| T21 | Nochmal spielen | Nach dem Aufdecken «Nochmal spielen» | Einrichten mit gleichen Namen | |
| T22 | Verlauf max. 20 | 21 Runden spielen | Liste zeigt 20 Runden | |
| T23 | Offline | Flugmodus, ganze Runde spielen | Alles funktioniert | |
