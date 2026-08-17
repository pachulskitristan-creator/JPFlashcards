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
];
