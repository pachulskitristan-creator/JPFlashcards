// types.ts
// Central type definitions shared across the app.

// A "Vocabulary Range" is a 500-word frequency band. Tier 1 = the 500
// most common words, tier 2 = the next 500, and so on up to tier 12
// (word #5501–6000).
export type FrequencyTier = number; // 1–12

export const MIN_TIER: FrequencyTier = 1;
export const MAX_TIER: FrequencyTier = 12;
export const TIER_SIZE = 500;

export function getTierLabel(tier: FrequencyTier): string {
  const start = (tier - 1) * TIER_SIZE + 1;
  const end = tier * TIER_SIZE;
  return `${start}–${end}`;
}

export function getAllTiers(): FrequencyTier[] {
  return Array.from({ length: MAX_TIER }, (_, i) => i + 1);
}

// ---- Vocabulary ----
//
// "Travel Topics" used to be a fixed enum. It's now a free-form tag
// system: words optionally ship with a few seed tags (from the import's
// keyword matching), and the user can add their own tags to any word.
// The Home screen's topic filter is built dynamically from whatever
// tags actually exist across the word set, rather than a hardcoded list.

export interface VocabWord {
  id: string;
  english: string;
  japanese: string;
  romaji: string;
  /** Hiragana reading, only needed when `japanese` contains kanji. Used to render furigana. */
  reading?: string;
  tier: FrequencyTier;
  /** Seed tags from import (often empty — see vocabDatabase.ts for why). Merged with user tags at runtime. */
  categories: string[];
  isCustom?: boolean;
}

/** wordId -> user-added tags. Persisted separately from the word data itself. */
export type UserTagStore = Record<string, string[]>;

// ---- Spaced repetition ----

/** Leitner box, 1 = newest/hardest, 5 = most mastered. */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface SRSData {
  wordId: string;
  box: LeitnerBox;
  correctCount: number;
  incorrectCount: number;
  /** Consecutive correct answers in a row. Resets to 0 on any wrong answer. */
  streak: number;
  /** User explicitly marked this word "I know this" — counts as known regardless of streak. */
  manuallyKnown: boolean;
  lastReviewed: number | null; // epoch ms
  nextReview: number; // epoch ms — word is "due" when now >= nextReview
}

export type SRSStore = Record<string, SRSData>;

// ---- Quiz ----

export type GameMode = 'en-to-jp' | 'jp-to-en' | 'mixed';
export type QuestionDirection = 'en-to-jp' | 'jp-to-en';

export interface QuizOption {
  word: VocabWord;
  isCorrect: boolean;
}

export interface QuizQuestion {
  prompt: VocabWord;
  options: QuizOption[];
  direction: QuestionDirection;
}

// ---- Gamification ----

export interface GamificationState {
  /** XP tracked separately per Vocabulary Range, so each range has its own progress bar. */
  xpByTier: Record<number, number>;
  totalCorrect: number;
  totalAnswered: number;
  /** Consecutive-day study streak, shown in the UI as "Roll". */
  rollCount: number;
  /** 'YYYY-MM-DD' of the last day the user completed a session, or null. */
  lastActiveDate: string | null;
  unlockedAchievementIds: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  isUnlocked: (state: GamificationState) => boolean;
}
