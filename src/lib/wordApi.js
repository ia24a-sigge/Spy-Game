import { pickRandom, wordsFor } from './game';

// Öffentliche Wikipedia-API (keine Anmeldung / kein API-Key nötig).
// Kategorien enthalten Seiten mit Begriffen; lokale Wörter bleiben Offline-Fallback.
const WIKI_CATEGORIES = {
  Essen: 'Kategorie:Speise',
  Tiere: 'Kategorie:Säugetier',
  Berufe: 'Kategorie:Beruf',
  Andere: 'Kategorie:Freizeitaktivität',
};

export async function getRandomWord(category, timeoutMs = 3500) {
  const fallback = () => pickRandom(wordsFor(category));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const params = new URLSearchParams({
      action: 'query', list: 'categorymembers', cmtitle: WIKI_CATEGORIES[category] || WIKI_CATEGORIES.Andere,
      cmtype: 'page', cmlimit: '100', format: 'json', origin: '*',
    });
    const response = await fetch(`https://de.wikipedia.org/w/api.php?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error('API nicht erreichbar');
    const data = await response.json();
    const words = (data?.query?.categorymembers || []).map((item) => item.title)
      .filter((title) => typeof title === 'string' && title.length >= 3 && title.length <= 22 && !title.includes(':') && !title.includes('('));
    if (!words.length) return fallback();
    return pickRandom(words);
  } catch {
    return fallback();
  } finally {
    clearTimeout(timeout);
  }
}
