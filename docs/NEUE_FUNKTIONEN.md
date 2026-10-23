# Verbesserungen

1. **Sensor:** Karte aufdecken, Display nach unten drehen (Karte wird verdeckt), danach wieder nach oben drehen: automatisch nächste Person bzw. Rundenstart. Buttons bleiben als Fallback. Auf einem echten Smartphone testen; Sensorausrichtung ist geräteabhängig.
2. **X-Button:** Zentrierung der Lösch-Schaltfläche in der Spielerzeile verbessert.
3. **Abstimmung:** Genau so viele Personen auswählen wie Spione vorhanden sind. Die Gruppe gewinnt nur, wenn alle Spione getroffen wurden.
4. **API:** Beim Start einer Runde werden Begriffe über die öffentliche deutschsprachige Wikipedia-MediaWiki-API aus thematischen Kategorien geladen. Bei Offline-Modus, Timeout oder leerem Ergebnis nutzt die App weiterhin die vorhandene `src/data/words.json`. Die API liefert Wikipedia-Seitentitel, daher können Begriffe von der kuratierten Offline-Liste abweichen.

## Starten
`npm install` und `npx expo start --clear`. Kein API-Key erforderlich.
