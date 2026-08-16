// services/srsEngine.ts
// A modified Leitner-box spaced repetition system.
// Box 1 = just missed / brand new, Box 5 = well known.
// Each box maps to a review interval; correct answers advance a box,
// incorrect answers drop a word straight back to Box 1.

import { LeitnerBox, SRSData, SRSStore, VocabWord } from '../types';

// Interval (in days) before a word in a given box is due again.
const BOX_INTERVALS_DAYS: Record<LeitnerBox, number> = {
  1: 0, // due immediately / same session
  2: 1,
  3: 3,
  4: 7,
  5: 16,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function createInitialSRSData(wordId: string): SRSData {
  return {
    wordId,
    box: 1,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null,
    nextReview: Date.now(), // brand-new words are immediately due
  };
}

export function updateAfterAnswer(existing: SRSData, wasCorrect: boolean): SRSData {
  const now = Date.now();
  let nextBox: LeitnerBox;

  if (wasCorrect) {
    nextBox = Math.min(existing.box + 1, 5) as LeitnerBox;
  } else {
    nextBox = 1;
  }

  return {
    ...existing,
    box: nextBox,
    correctCount: existing.correctCount + (wasCorrect ? 1 : 0),
    incorrectCount: existing.incorrectCount + (wasCorrect ? 0 : 1),
    lastReviewed: now,
    nextReview: now + BOX_INTERVALS_DAYS[nextBox] * DAY_MS,
  };
}

export function isDue(data: SRSData, now: number = Date.now()): boolean {
  return now >= data.nextReview;
}

/**
 * Builds a prioritized study queue from a pool of candidate words.
 * Priority order:
 *   1. Words that are overdue, most-overdue first (previously forgotten
 *      or scheduled words surface at the front of the queue).
 *   2. Brand-new words with no SRS history yet.
 *   3. Words not yet due, shuffled, appended at the tail as filler.
 */
export function buildStudyQueue(words: VocabWord[], srsStore: SRSStore): VocabWord[] {
  const now = Date.now();

  const overdue: { word: VocabWord; overdueBy: number }[] = [];
  const brandNew: VocabWord[] = [];
  const notYetDue: VocabWord[] = [];

  for (const word of words) {
    const data = srsStore[word.id];
    if (!data) {
      brandNew.push(word);
      continue;
    }
    if (isDue(data, now)) {
      overdue.push({ word, overdueBy: now - data.nextReview });
    } else {
      notYetDue.push(word);
    }
  }

  overdue.sort((a, b) => b.overdueBy - a.overdueBy);
  shuffleInPlace(brandNew);
  shuffleInPlace(notYetDue);

  return [...overdue.map((o) => o.word), ...brandNew, ...notYetDue];
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function getOrCreateSRSData(srsStore: SRSStore, wordId: string): SRSData {
  return srsStore[wordId] ?? createInitialSRSData(wordId);
}
