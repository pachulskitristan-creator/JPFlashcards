// services/tagsService.ts
// User-added tags, keyed by word id. This is what "Travel Topics" is
// built from now — combined with each word's sparse seed `categories`
// from vocabDatabase.ts, merged at runtime by getEffectiveTags().

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserTagStore, VocabWord } from '../types';

const USER_TAGS_KEY = '@jp_flashcards/user_tags_v1';

export async function loadUserTags(): Promise<UserTagStore> {
  try {
    const raw = await AsyncStorage.getItem(USER_TAGS_KEY);
    return raw ? (JSON.parse(raw) as UserTagStore) : {};
  } catch (e) {
    console.warn('Failed to load user tags', e);
    return {};
  }
}

export async function saveUserTags(store: UserTagStore): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_TAGS_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to save user tags', e);
  }
}

function normalizeTag(tag: string): string {
  return tag.trim();
}

export async function addTagToWord(wordId: string, tag: string): Promise<UserTagStore> {
  const clean = normalizeTag(tag);
  if (!clean) return loadUserTags();
  const store = await loadUserTags();
  const existing = store[wordId] ?? [];
  if (existing.some((t) => t.toLowerCase() === clean.toLowerCase())) {
    return store; // already tagged, no-op
  }
  const updated = { ...store, [wordId]: [...existing, clean] };
  await saveUserTags(updated);
  return updated;
}

export async function removeTagFromWord(wordId: string, tag: string): Promise<UserTagStore> {
  const store = await loadUserTags();
  const existing = store[wordId] ?? [];
  const updated = { ...store, [wordId]: existing.filter((t) => t !== tag) };
  await saveUserTags(updated);
  return updated;
}

/** A word's tags for filtering/display purposes: seed tags + user tags, deduped. */
export function getEffectiveTags(word: VocabWord, userTags: UserTagStore): string[] {
  const combined = [...word.categories, ...(userTags[word.id] ?? [])];
  return Array.from(new Set(combined));
}

/** Every tag currently in use across the word set — this is what populates the Home screen filter. */
export function getAllKnownTags(words: VocabWord[], userTags: UserTagStore): string[] {
  const set = new Set<string>();
  for (const w of words) {
    for (const t of getEffectiveTags(w, userTags)) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** All words carrying a given tag — powers the Tagged Words folder drill-down. */
export function getWordsForTag(tag: string, words: VocabWord[], userTags: UserTagStore): VocabWord[] {
  return words.filter((w) =>
    getEffectiveTags(w, userTags).some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/** Tag name + word count, sorted alphabetically — the "folder list" view. */
export function getTagCounts(words: VocabWord[], userTags: UserTagStore): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const w of words) {
    for (const t of getEffectiveTags(w, userTags)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
