import { solarSystemData } from './data';

export function simpleSearch(query: string) {
  const lowerQuery = query.toLowerCase();

  const results = solarSystemData.planets
    .filter(p => p.name.toLowerCase().includes(lowerQuery))
    .map(p => ({
      id: p.id,
      name: p.name,
      score: p.name.toLowerCase() === lowerQuery ? 1.0 : 0.5
    }));

  if ('sun'.includes(lowerQuery)) {
    results.unshift({ id: 'sun', name: 'Sun', score: 1.0 });
  }

  const issKeywords = ['iss', 'space station', 'international space station', 'station'];
  if (issKeywords.some(kw => lowerQuery.includes(kw) || kw.includes(lowerQuery))) {
    results.unshift({
      id: 'iss',
      name: 'International Space Station',
      score: 1.0
    });
  }

  return results.sort((a, b) => b.score - a.score);
}