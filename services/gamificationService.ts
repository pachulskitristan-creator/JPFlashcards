// services/gamificationService.ts
// XP is now tracked per Vocabulary Range (tier), so each range gets its
// own progress bar instead of one combined one. When a session studies
// multiple ranges at once, each correct answer's XP is divided by how
// many ranges are active — so any single range's bar fills slower the
// more ranges you're mixing together. Studying one range alone always
// gives that range's bar the full, undiluted XP per correct answer.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GamificationState } from '../types';

const GAMIFICATION_KEY = '@jp_flashcards/gamification_v2';

const XP_PER_CORRECT = 10;
const XP_PER_LEVEL = 100;

export function createInitialGamificationState(): GamificationState {
  return {
    xpByTier: {},
    totalCorrect: 0,
    totalAnswered: 0,
    rollCount: 0,
    lastActiveDate: null,
    unlockedAchievementIds: [],
  };
}

export async function loadGamification(): Promise<GamificationState> {
  try {
    const raw = await AsyncStorage.getItem(GAMIFICATION_KEY);
    return raw
      ? { ...createInitialGamificationState(), ...JSON.parse(raw) }
      : createInitialGamificationState();
  } catch (e) {
    console.warn('Failed to load gamification state', e);
    return createInitialGamificationState();
  }
}

export async function saveGamification(state: GamificationState): Promise<void> {
  try {
    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save gamification state', e);
  }
}

export function getTierXP(state: GamificationState, tier: number): number {
  return state.xpByTier[tier] ?? 0;
}

export function getTotalXP(state: GamificationState): number {
  return Object.values(state.xpByTier).reduce((sum, xp) => sum + xp, 0);
}

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXPIntoLevel(xp: number): { current: number; needed: number } {
  return { current: xp % XP_PER_LEVEL, needed: XP_PER_LEVEL };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(earlierISO: string, laterISO: string): number {
  const d1 = new Date(`${earlierISO}T00:00:00`);
  const d2 = new Date(`${laterISO}T00:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

/**
 * Records one answer's result against a specific tier's XP bar.
 * `activeTierCount` is how many ranges are selected in the current
 * session — the XP awarded to `tier` is divided by that count, so
 * mixing many ranges together makes each individual bar fill harder.
 */
export function addAnswerResult(
  state: GamificationState,
  wasCorrect: boolean,
  tier: number,
  activeTierCount: number
): GamificationState {
  const divisor = Math.max(1, activeTierCount);
  const earnedXP = wasCorrect ? Math.max(1, Math.round(XP_PER_CORRECT / divisor)) : 0;

  return {
    ...state,
    xpByTier: {
      ...state.xpByTier,
      [tier]: getTierXP(state, tier) + earnedXP,
    },
    totalCorrect: state.totalCorrect + (wasCorrect ? 1 : 0),
    totalAnswered: state.totalAnswered + 1,
  };
}

export function registerDailyActivity(state: GamificationState): {
  next: GamificationState;
  rollIncreased: boolean;
} {
  const today = todayISO();

  if (state.lastActiveDate === today) {
    return { next: state, rollIncreased: false };
  }

  let nextRoll = 1;
  if (state.lastActiveDate) {
    const gap = daysBetween(state.lastActiveDate, today);
    nextRoll = gap === 1 ? state.rollCount + 1 : 1;
  }

  const next = { ...state, rollCount: nextRoll, lastActiveDate: today };
  return { next, rollIncreased: nextRoll > state.rollCount };
}
