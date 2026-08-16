// services/storageService.ts
// Thin wrapper around AsyncStorage for persisting SRS progress and
// user-added custom vocabulary.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SRSStore, VocabWord } from '../types';

const SRS_KEY = '@jp_flashcards/srs_store_v1';
const CUSTOM_VOCAB_KEY = '@jp_flashcards/custom_vocab_v1';

export async function loadSRSStore(): Promise<SRSStore> {
  try {
    const raw = await AsyncStorage.getItem(SRS_KEY);
    return raw ? (JSON.parse(raw) as SRSStore) : {};
  } catch (e) {
    console.warn('Failed to load SRS store', e);
    return {};
  }
}

export async function saveSRSStore(store: SRSStore): Promise<void> {
  try {
    await AsyncStorage.setItem(SRS_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to save SRS store', e);
  }
}

export async function loadCustomVocab(): Promise<VocabWord[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_VOCAB_KEY);
    return raw ? (JSON.parse(raw) as VocabWord[]) : [];
  } catch (e) {
    console.warn('Failed to load custom vocab', e);
    return [];
  }
}

export async function saveCustomVocab(words: VocabWord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CUSTOM_VOCAB_KEY, JSON.stringify(words));
  } catch (e) {
    console.warn('Failed to save custom vocab', e);
  }
}

export async function addCustomWord(word: VocabWord): Promise<VocabWord[]> {
  const current = await loadCustomVocab();
  const updated = [...current, word];
  await saveCustomVocab(updated);
  return updated;
}

export async function deleteCustomWord(wordId: string): Promise<VocabWord[]> {
  const current = await loadCustomVocab();
  const updated = current.filter((w) => w.id !== wordId);
  await saveCustomVocab(updated);
  return updated;
}
