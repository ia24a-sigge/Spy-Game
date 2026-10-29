// Loads the secret word from the public German Wikipedia API (no login, no API key).
// If there is no internet, a timeout or no usable result, the offline word list is used instead.
import { pickRandom, wordsFor } from './game';

const WIKI_CATEGORIES = {
  Essen: 'Kategorie:Speise',
  Tiere: 'Kategorie:Säugetier',
  Berufe: 'Kategorie:Beruf',
  Andere: 'Kategorie:Freizeitaktivität',
};

/**
 * Returns a random word for the category. Never throws: every error ends in the offline fallback.
 * @param {string} category
 * @param {number} [timeoutMs] the request is aborted after this time
 * @returns {Promise<string>}
 */
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
    if (!response.ok) throw new Error('API not reachable');
    const data = await response.json();
    // Page titles with ":" or "(" are not simple words (e.g. "Liste:..." or "Bank (Möbel)"), very long ones don't fit the card.
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
