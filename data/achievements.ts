// data/achievements.ts

import { Achievement } from '../types';
import { getLevel, getTotalXP } from '../services/gamificationService';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Answer your first card',
    icon: 'footsteps-outline',
    isUnlocked: (s) => s.totalAnswered >= 1,
  },
  {
    id: 'ten_correct',
    title: 'Getting Sharp',
    description: 'Answer 10 cards correctly',
    icon: 'flash-outline',
    isUnlocked: (s) => s.totalCorrect >= 10,
  },
  {
    id: 'fifty_correct',
    title: 'Vocabulary Machine',
    description: 'Answer 50 cards correctly',
    icon: 'rocket-outline',
    isUnlocked: (s) => s.totalCorrect >= 50,
  },
  {
    id: 'hundred_correct',
    title: 'Fluent-ish',
    description: 'Answer 100 cards correctly',
    icon: 'ribbon-outline',
    isUnlocked: (s) => s.totalCorrect >= 100,
  },
  {
    id: 'roll_3',
    title: 'On a Roll',
    description: 'Study 3 days in a row',
    icon: 'flame-outline',
    isUnlocked: (s) => s.rollCount >= 3,
  },
  {
    id: 'roll_7',
    title: 'Rolling Thunder',
    description: 'Study 7 days in a row',
    icon: 'flame',
    isUnlocked: (s) => s.rollCount >= 7,
  },
  {
    id: 'roll_30',
    title: 'Unstoppable Roll',
    description: 'Study 30 days in a row',
    icon: 'trophy-outline',
    isUnlocked: (s) => s.rollCount >= 30,
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    icon: 'star-outline',
    isUnlocked: (s) => getLevel(getTotalXP(s)) >= 5,
  },
  {
    id: 'level_10',
    title: 'Word Wizard',
    description: 'Reach level 10',
    icon: 'sparkles-outline',
    isUnlocked: (s) => getLevel(getTotalXP(s)) >= 10,
  },
  {
    id: 'known_1',
    title: 'First Word Mastered',
    description: 'Fully learn your first word',
    icon: 'checkmark-circle-outline',
    isUnlocked: (_s, p) => p.knownCount >= 1,
  },
  {
    id: 'known_25',
    title: 'Quarter Century',
    description: 'Fully learn 25 words',
    icon: 'book-outline',
    isUnlocked: (_s, p) => p.knownCount >= 25,
  },
  {
    id: 'known_100',
    title: 'Century Club',
    description: 'Fully learn 100 words',
    icon: 'library-outline',
    isUnlocked: (_s, p) => p.knownCount >= 100,
  },
  {
    id: 'known_250',
    title: 'Deep Vocabulary',
    description: 'Fully learn 250 words',
    icon: 'layers-outline',
    isUnlocked: (_s, p) => p.knownCount >= 250,
  },
  {
    id: 'known_500',
    title: 'Range Master',
    description: 'Fully learn 500 words',
    icon: 'medal-outline',
    isUnlocked: (_s, p) => p.knownCount >= 500,
  },
  {
    id: 'known_1000',
    title: 'Thousand Words',
    description: 'Fully learn 1,000 words',
    icon: 'diamond-outline',
    isUnlocked: (_s, p) => p.knownCount >= 1000,
  },
  {
    id: 'tier1_cleared',
    title: 'Foundations Complete',
    description: 'Fully learn every word in Range 1 (1–500)',
    icon: 'flag-outline',
    isUnlocked: (_s, p) => (p.tierKnownCounts[1] ?? 0) >= 500,
  },
];
