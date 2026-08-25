// services/wordRank.ts
// Imported words carry ids like "c0347" where the number IS the exact
// frequency rank (1–6000) from the source Anki decks. This recovers
// that number for range-based filtering (the Statistics range slider).
// Custom user-added words (id "custom_<timestamp>") have no natural
// rank and return null — they're excluded from rank-range stats since
// there's no meaningful position for them on a 1–6000 scale.

import { VocabWord } from '../types';

export function getWordRank(word: VocabWord): number | null {
  const match = /^c(\d+)$/.exec(word.id);
  if (!match) return null;
  return parseInt(match[1], 10);
}
