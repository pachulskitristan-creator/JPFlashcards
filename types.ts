// types.ts
// Central type definitions shared across the app.

export type FrequencyTier = 1 | 2 | 3;

export const TIER_LABELS: Record<FrequencyTier, string> = {
  1: 'Top 1–500',
  2: '501–1000',
  3: '1001–1500',
};

export type TravelCategory =
  | 'Greetings & Essentials'
  | 'Ordering Food & Restaurants'
  | 'Asking for Directions'
  | 'Shopping & Payments'
  | 'Transportation'
  | 'Numbers & Time'
  | 'Emergencies & Health'
  | 'Accommodation';

export const ALL_CATEGORIES: TravelCategory[] = [
  'Greetings & Essentials',
  'Ordering Food & Restaurants',
  'Asking for Directions',
  'Shopping & Payments',
  'Transportation',
  'Numbers & Time',
  'Emergencies & Health',
  'Accommodation',
];

export interface VocabWord {
  id: string;
  english: string;
  japanese: string;
  romaji: string;
  tier: FrequencyTier;
  categories: TravelCategory[];
  isCustom?: boolean;
}

/** Leitner box, 1 = newest/hardest, 5 = most mastered. */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface SRSData {
  wordId: string;
  box: LeitnerBox;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: number | null; // epoch ms
  nextReview: number; // epoch ms — word is "due" when now >= nextReview
}

export type SRSStore = Record<string, SRSData>;

export type GameMode = 'en-to-jp' | 'jp-to-en';

export interface QuizOption {
  word: VocabWord;
  isCorrect: boolean;
}

export interface QuizQuestion {
  prompt: VocabWord;
  options: QuizOption[];
  mode: GameMode;
}
