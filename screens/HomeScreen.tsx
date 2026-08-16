// screens/HomeScreen.tsx

import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CategoryFilter from '../components/CategoryFilter';
import { ALL_CATEGORIES, FrequencyTier, GameMode, TIER_LABELS } from '../types';

interface HomeScreenProps {
  selectedTiers: FrequencyTier[];
  onToggleTier: (tier: FrequencyTier) => void;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  mode: GameMode;
  onSetMode: (mode: GameMode) => void;
  wordCount: number;
  onStart: () => void;
  onOpenVocabManager: () => void;
}

export default function HomeScreen({
  selectedTiers,
  onToggleTier,
  selectedCategories,
  onToggleCategory,
  mode,
  onSetMode,
  wordCount,
  onStart,
  onOpenVocabManager,
}: HomeScreenProps) {
  const handleModeSwitch = (m: GameMode) => {
    Haptics.selectionAsync().catch(() => {});
    onSetMode(m);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>単語カード</Text>
      <Text style={styles.subtitle}>Japanese Flashcards for Travelers</Text>

      <Text style={styles.sectionLabel}>Mode</Text>
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeButton, mode === 'en-to-jp' && styles.modeButtonActive]}
          onPress={() => handleModeSwitch('en-to-jp')}
        >
          <Text style={[styles.modeText, mode === 'en-to-jp' && styles.modeTextActive]}>
            English → 日本語
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === 'jp-to-en' && styles.modeButtonActive]}
          onPress={() => handleModeSwitch('jp-to-en')}
        >
          <Text style={[styles.modeText, mode === 'jp-to-en' && styles.modeTextActive]}>
            日本語 → English
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Frequency Tier</Text>
      <CategoryFilter
        options={[1, 2, 3].map((t) => ({ key: String(t), label: TIER_LABELS[t as FrequencyTier] }))}
        selectedKeys={selectedTiers.map(String)}
        onToggle={(key) => onToggleTier(Number(key) as FrequencyTier)}
      />

      <Text style={styles.sectionLabel}>Travel Topics</Text>
      <CategoryFilter
        options={ALL_CATEGORIES.map((c) => ({ key: c, label: c }))}
        selectedKeys={selectedCategories}
        onToggle={onToggleCategory}
      />

      <Pressable style={styles.vocabManagerButton} onPress={onOpenVocabManager}>
        <Ionicons name="add-circle-outline" size={20} color="#5A4FCF" />
        <Text style={styles.vocabManagerText}>Manage My Vocabulary</Text>
      </Pressable>

      <View style={styles.spacer} />

      <Pressable
        style={[styles.startButton, wordCount === 0 && styles.startButtonDisabled]}
        onPress={onStart}
        disabled={wordCount === 0}
      >
        <Text style={styles.startButtonText}>
          {wordCount === 0 ? 'No cards match your filters' : `Start Quiz (${wordCount} cards)`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFBFF',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2B2B36',
  },
  subtitle: {
    fontSize: 15,
    color: '#8B85B8',
    marginTop: 4,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B85B8',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 22,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F4F2FF',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#5A4FCF',
  },
  modeText: {
    fontWeight: '700',
    color: '#8B85B8',
    fontSize: 14,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  vocabManagerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    gap: 8,
  },
  vocabManagerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4FCF',
  },
  spacer: {
    height: 30,
  },
  startButton: {
    backgroundColor: '#5A4FCF',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#5A4FCF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  startButtonDisabled: {
    backgroundColor: '#D8D5EE',
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
