// screens/HomeScreen.tsx

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '../components/Dropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import RangeSlider from '../components/RangeSlider';
import PatternBackground from '../components/PatternBackground';
import XPBar from '../components/XPBar';
import RollBadge from '../components/RollBadge';
import {
  FrequencyTier,
  GameMode,
  GamificationState,
  MAX_TIER,
  TIER_SIZE,
  UserTagStore,
  VocabWord,
  getTierLabel,
} from '../types';
import { getAllKnownTags } from '../services/tagsService';
import { getTierXP } from '../services/gamificationService';
import { usePurchases } from '../contexts/PurchasesContext';
import { ThemeColors } from '../theme/theme';

interface HomeScreenProps {
  allWords: VocabWord[];
  userTags: UserTagStore;
  selectedTiers: FrequencyTier[];
  onSetTierRange: (start: FrequencyTier, end: FrequencyTier) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  mode: GameMode;
  onSetMode: (mode: GameMode) => void;
  wordCount: number;
  onStart: () => void;
  onStartQuickPlay: () => void;
  onOpenVocabManager: () => void;
  gamification: GamificationState;
  rollJustIncreased: boolean;
  colors: ThemeColors;
  bottomInset: number;
}

const MODE_OPTIONS: { key: GameMode; label: string }[] = [
  { key: 'en-to-jp', label: 'English → 日本語' },
  { key: 'jp-to-en', label: '日本語 → English' },
  { key: 'mixed', label: '🔀 Mixed' },
];

const MAX_CONTENT_WIDTH = 560;

export default function HomeScreen({
  allWords,
  userTags,
  selectedTiers,
  onSetTierRange,
  selectedTags,
  onToggleTag,
  mode,
  onSetMode,
  wordCount,
  onStart,
  onStartQuickPlay,
  onOpenVocabManager,
  gamification,
  rollJustIncreased,
  colors,
  bottomInset,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - 44);
  const { isPro, presentPaywall } = usePurchases();
  const rangeMax = isPro ? MAX_TIER * TIER_SIZE : TIER_SIZE;

  const availableTags = useMemo(() => getAllKnownTags(allWords, userTags), [allWords, userTags]);

  const tierWordCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const w of allWords) counts[w.tier] = (counts[w.tier] ?? 0) + 1;
    return counts;
  }, [allWords]);

  // The tier range slider works in the same 1–6000 value space as the
  // one on Statistics, snapped to 500-word steps — which line up
  // exactly with tier boundaries, so converting between "value" and
  // "tier" is just a division.
  const minTier = selectedTiers.length > 0 ? Math.min(...selectedTiers) : 1;
  const maxTier = selectedTiers.length > 0 ? Math.max(...selectedTiers) : 1;
  const rangeStartValue = (minTier - 1) * TIER_SIZE + 1;
  const rangeEndValue = maxTier * TIER_SIZE;
  const rangeWordCount = useMemo(() => {
    let total = 0;
    for (let t = minTier; t <= maxTier; t++) total += tierWordCounts[t] ?? 0;
    return total;
  }, [tierWordCounts, minTier, maxTier]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
      >
      <View style={[styles.content, { width: contentWidth }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>単語カード</Text>
            <Text style={styles.heroSubtitle}>Japanese Flashcards for Travelers</Text>
          </View>
          <Image
            source={require('../assets/images/adaptive-icon.png')}
            style={styles.heroMascot}
            resizeMode="contain"
          />
        </LinearGradient>

        <View style={styles.gamificationBlock}>
          <RollBadge rollCount={gamification.rollCount} justIncreased={rollJustIncreased} colors={colors} />

          {selectedTiers.length > 0 ? (
            <View style={styles.xpBarsWrap}>
              {selectedTiers
                .slice()
                .sort((a, b) => a - b)
                .map((tier) => (
                  <XPBar
                    key={tier}
                    xp={getTierXP(gamification, tier)}
                    colors={colors}
                    label={`Range ${tier} (${getTierLabel(tier)})`}
                  />
                ))}
            </View>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Mode</Text>
        <Dropdown
          options={MODE_OPTIONS}
          selectedKey={mode}
          onSelect={(key) => onSetMode(key as GameMode)}
          colors={colors}
        />
        {mode === 'mixed' ? (
          <Text style={[styles.modeHint, { color: colors.textSecondary }]}>
            Each card randomly asks English → Japanese or Japanese → English.
          </Text>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vocabulary Range</Text>
        <RangeSlider
          min={1}
          max={rangeMax}
          startValue={Math.min(rangeStartValue, rangeMax)}
          endValue={Math.min(rangeEndValue, rangeMax)}
          onChangeEnd={(start, end) => {
            const startTier = Math.ceil(start / TIER_SIZE);
            const endTier = Math.min(Math.ceil(end / TIER_SIZE), isPro ? MAX_TIER : 1);
            onSetTierRange(startTier, endTier);
          }}
          colors={colors}
        />
        <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
          {minTier === maxTier ? `Range ${minTier}` : `Ranges ${minTier}–${maxTier}`} · {rangeWordCount} words
        </Text>
        {!isPro ? (
          <Pressable style={styles.unlockRangesRow} onPress={presentPaywall}>
            <Ionicons name="lock-closed" size={13} color={colors.primary} />
            <Text style={[styles.unlockRangesText, { color: colors.primary }]}>
              Unlock Ranges 2–12 with Pro
            </Text>
          </Pressable>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Travel Topics</Text>
        <MultiSelectDropdown
          options={availableTags.map((t) => ({ key: t, label: t }))}
          selectedKeys={selectedTags}
          onToggle={onToggleTag}
          colors={colors}
          placeholder="All topics"
          sheetTitle="Travel Topics"
          emptyMessage="No tags yet — add some while studying and they'll appear here."
        />

        <Pressable style={styles.vocabManagerButton} onPress={onOpenVocabManager}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.vocabManagerText, { color: colors.primary }]}>Add to the Vocabulary</Text>
        </Pressable>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.quickPlayButton, { borderColor: colors.primary }]}
          onPress={onStartQuickPlay}
          disabled={wordCount === 0}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: wordCount === 0 ? colors.border : `${colors.card}A6` },
            ]}
          />
          <Ionicons name="flash" size={18} color={wordCount === 0 ? colors.textSecondary : colors.primary} />
          <Text style={[styles.quickPlayButtonText, { color: wordCount === 0 ? colors.textSecondary : colors.primary }]}>
            Quick Play
          </Text>
        </Pressable>

        <Pressable onPress={onStart} disabled={wordCount === 0}>
          {wordCount === 0 ? (
            <View style={[styles.startButton, { backgroundColor: colors.border }]}>
              <Text style={styles.startButtonText}>No cards match your filters</Text>
            </View>
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.startButton, { shadowColor: colors.shadow }]}
            >
              <Text style={styles.startButtonText}>Start Quiz ({wordCount} cards)</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    maxWidth: 560,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 26,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  heroMascot: {
    width: 68,
    height: 68,
  },
  gamificationBlock: {
    marginBottom: 6,
    gap: 10,
  },
  xpBarsWrap: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 20,
  },
  sectionSubtext: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  modeHint: {
    fontSize: 12.5,
    marginTop: 8,
  },
  unlockRangesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  unlockRangesText: {
    fontSize: 12.5,
    fontWeight: '700',
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
  },
  spacer: {
    height: 30,
  },
  quickPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  quickPlayButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  startButton: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
