// services/cloudSyncService.ts
// Backs up the four AsyncStorage-only stores (SRS progress,
// gamification/XP, custom vocab, user tags) to Supabase for signed-in
// accounts, so progress survives a reinstall or a new device — guests
// stay purely local, same as before this existed.
//
// One row per user (see supabase/migrations/20260905000000_user_progress.sql),
// pulled once on sign-in and pushed (debounced) after local changes.

import { supabase } from './supabaseClient';
import { SRSStore, GamificationState, VocabWord, UserTagStore } from '../types';
import { loadSRSStore, saveSRSStore, loadCustomVocab, saveCustomVocab } from './storageService';
import { loadGamification, saveGamification } from './gamificationService';
import { loadUserTags, saveUserTags } from './tagsService';

interface ProgressSnapshot {
  srsStore: SRSStore;
  gamification: GamificationState;
  customVocab: VocabWord[];
  userTags: UserTagStore;
}

async function loadLocalSnapshot(): Promise<ProgressSnapshot> {
  const [srsStore, gamification, customVocab, userTags] = await Promise.all([
    loadSRSStore(),
    loadGamification(),
    loadCustomVocab(),
    loadUserTags(),
  ]);
  return { srsStore, gamification, customVocab, userTags };
}

async function saveLocalSnapshot(snapshot: ProgressSnapshot): Promise<void> {
  await Promise.all([
    saveSRSStore(snapshot.srsStore),
    saveGamification(snapshot.gamification),
    saveCustomVocab(snapshot.customVocab),
    saveUserTags(snapshot.userTags),
  ]);
}

/**
 * Called once when a session starts. If the account already has a
 * cloud snapshot (e.g. a reinstall, or signing in on a new device),
 * that snapshot overwrites local storage — cloud wins, since it's the
 * more complete record. If this is the account's first sync (row
 * doesn't exist yet), whatever progress already exists locally —
 * likely made as a guest before creating the account — is pushed up
 * as the starting snapshot instead of being discarded.
 */
export async function pullCloudProgress(userId: string): Promise<ProgressSnapshot> {
  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    console.warn('Failed to pull cloud progress', error);
    return loadLocalSnapshot();
  }

  if (!data) {
    const local = await loadLocalSnapshot();
    await pushCloudProgress(userId, local);
    return local;
  }

  const snapshot: ProgressSnapshot = {
    srsStore: data.srs_store ?? {},
    gamification: { ...(await loadGamification()), ...data.gamification },
    customVocab: data.custom_vocab ?? [],
    userTags: data.user_tags ?? {},
  };
  await saveLocalSnapshot(snapshot);
  return snapshot;
}

export async function pushCloudProgress(userId: string, snapshot: ProgressSnapshot): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    srs_store: snapshot.srsStore,
    gamification: snapshot.gamification,
    custom_vocab: snapshot.customVocab,
    user_tags: snapshot.userTags,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn('Failed to push cloud progress', error);
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced push of the current local state — call after any change while signed in. */
export function scheduleCloudPush(userId: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    loadLocalSnapshot().then((snapshot) => pushCloudProgress(userId, snapshot));
  }, 2000);
}
