// services/srsEngine.ts
// Modified Leitner-box SRS, now also tracking a consecutive-correct
// streak and a manual "I know this" override — together these define
// whether a word counts as "known" (see isWordKnown below), which
// feeds both the Progress screen's percentage-known graph and the
// study-queue weighting that makes known words show up less often.

import { LeitnerBox, SRSData, SRSStore, VocabWord } from '../types';

const BOX_INTERVALS_DAYS: Record<LeitnerBox, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 16,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const KNOWN_STREAK_THRESHOLD = 10;

export function createInitialSRSData(wordId: string): SRSData {
  return {
    wordId,
    box: 1,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    manuallyKnown: false,
    lastReviewed: null,
    nextReview: Date.now(),
  };
}

export function updateAfterAnswer(existing: SRSData, wasCorrect: boolean): SRSData {
  const now = Date.now();
  const nextBox: LeitnerBox = wasCorrect ? (Math.min(existing.box + 1, 5) as LeitnerBox) : 1;
  const nextStreak = wasCorrect ? existing.streak + 1 : 0;

  return {
    ...existing,
    box: nextBox,
    streak: nextStreak,
    correctCount: existing.correctCount + (wasCorrect ? 1 : 0),
    incorrectCount: existing.incorrectCount + (wasCorrect ? 0 : 1),
    lastReviewed: now,
    nextReview: now + BOX_INTERVALS_DAYS[nextBox] * DAY_MS,
  };
}

export function markWordKnownManually(data: SRSData): SRSData {
  return { ...data, manuallyKnown: true };
}

export function unmarkWordKnown(data: SRSData): SRSData {
  return { ...data, manuallyKnown: false, streak: 0 };
}

/** A word counts as "known" once answered correctly 10 times in a row, or the user marked it manually. */
export function isWordKnown(data: SRSData | undefined): boolean {
  if (!data) return false;
  return data.manuallyKnown || data.streak >= KNOWN_STREAK_THRESHOLD;
}

export function isDue(data: SRSData, now: number = Date.now()): boolean {
  return now >= data.nextReview;
}

export function getOrCreateSRSData(srsStore: SRSStore, wordId: string): SRSData {
  return srsStore[wordId] ?? createInitialSRSData(wordId);
}

/**
 * Builds a prioritized, weighted study queue.
 *   1. Overdue words (previously forgotten/scheduled) — always included, most-overdue first.
 *   2. Brand-new words — always included.
 *   3. Not-yet-due words — included with a probability that DROPS as mastery
 *      goes up, so words the user already knows well surface far less often:
 *        - known (streak 10+ or manually marked): 12% chance
 *        - box 4 (nearly mastered): 35% chance
 *        - box 2-3: 70% chance
 *        - box 1 / no real progress yet: always included
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

  const weightedNotYetDue: VocabWord[] = [];
  for (const word of notYetDue) {
    const data = srsStore[word.id];
    const inclusionChance = getInclusionChance(data);
    if (Math.random() < inclusionChance) {
      weightedNotYetDue.push(word);
    }
  }
  shuffleInPlace(weightedNotYetDue);

  return [...overdue.map((o) => o.word), ...brandNew, ...weightedNotYetDue];
}

function getInclusionChance(data: SRSData | undefined): number {
  if (!data) return 1;
  if (isWordKnown(data)) return 0.12;
  if (data.box >= 4) return 0.35;
  if (data.box >= 2) return 0.7;
  return 1;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
