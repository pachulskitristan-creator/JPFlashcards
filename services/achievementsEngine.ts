// services/achievementsEngine.ts

import { ACHIEVEMENTS } from '../data/achievements';
import { GamificationState, MasteryProgress } from '../types';

/** Returns the ids of achievements that just became unlocked (not already in state). */
export function checkForNewlyUnlocked(state: GamificationState, progress: MasteryProgress): string[] {
  const newly: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!state.unlockedAchievementIds.includes(achievement.id) && achievement.isUnlocked(state, progress)) {
      newly.push(achievement.id);
    }
  }
  return newly;
}
