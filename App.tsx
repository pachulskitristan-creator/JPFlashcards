// App.tsx
// Navigation model: a persistent BottomTabBar switches between 5 tabs
// (Home/Statistics/Tags/Achievements/Settings). Starting a quiz goes
// full-screen and hides the tab bar entirely — the same "now playing
// takes over the screen" pattern Apple Music uses — then returns to
// whichever tab you were on when you exit.

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import TaggedWordsScreen from './screens/TaggedWordsScreen';
import CustomVocabManager from './components/CustomVocabManager';
import AchievementUnlockOverlay from './components/AchievementUnlockOverlay';
import BottomTabBar, { TabKey } from './components/BottomTabBar';

import { VOCAB_DATABASE } from './data/vocabDatabase';
import { loadCustomVocab } from './services/storageService';
import { loadUserTags } from './services/tagsService';
import { FrequencyTier, GameMode, VocabWord, GamificationState, UserTagStore } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
  loadGamification,
  saveGamification,
  createInitialGamificationState,
} from './services/gamificationService';
import { checkForNewlyUnlocked } from './services/achievementsEngine';

function AppInner() {
  const { colors, isDark, themePreference, setThemePreference } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [quizActive, setQuizActive] = useState(false);
  const [vocabManagerVisible, setVocabManagerVisible] = useState(false);

  const [customWords, setCustomWords] = useState<VocabWord[]>([]);
  const [userTags, setUserTags] = useState<UserTagStore>({});
  const [selectedTiers, setSelectedTiers] = useState<FrequencyTier[]>([1]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>('en-to-jp');

  const [gamification, setGamification] = useState<GamificationState>(createInitialGamificationState());
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);
  const [rollJustIncreased, setRollJustIncreased] = useState(false);

  useEffect(() => {
    loadCustomVocab().then(setCustomWords);
    loadGamification().then(setGamification);
    loadUserTags().then(setUserTags);
  }, []);

  const allWords = useMemo(() => [...VOCAB_DATABASE, ...customWords], [customWords]);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(w.tier);
      const effectiveTags = [...w.categories, ...(userTags[w.id] ?? [])];
      const tagMatch = selectedTags.length === 0 || effectiveTags.some((t) => selectedTags.includes(t));
      return tierMatch && tagMatch;
    });
  }, [allWords, selectedTiers, selectedTags, userTags]);

  const toggleTier = (tier: FrequencyTier) => {
    setSelectedTiers((prev) => (prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const applyGamificationUpdate = async (next: GamificationState) => {
    const newlyUnlocked = checkForNewlyUnlocked(next);
    const withUnlocks = newlyUnlocked.length
      ? { ...next, unlockedAchievementIds: [...next.unlockedAchievementIds, ...newlyUnlocked] }
      : next;
    setGamification(withUnlocks);
    await saveGamification(withUnlocks);
    if (newlyUnlocked.length) {
      setUnlockQueue((q) => [...q, ...newlyUnlocked]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {quizActive ? (
        <QuizScreen
          words={filteredWords}
          allWordsForTagSuggestions={allWords}
          mode={mode}
          activeTierCount={Math.max(1, selectedTiers.length)}
          onExit={() => {
            setQuizActive(false);
            loadUserTags().then(setUserTags);
          }}
          gamification={gamification}
          onGamificationUpdate={applyGamificationUpdate}
          onRollIncreaseFlag={setRollJustIncreased}
          colors={colors}
        />
      ) : (
        <>
          <View style={styles.tabContent}>
            {activeTab === 'home' ? (
              <HomeScreen
                allWords={allWords}
                userTags={userTags}
                selectedTiers={selectedTiers}
                onToggleTier={toggleTier}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
                mode={mode}
                onSetMode={setMode}
                wordCount={filteredWords.length}
                onStart={() => setQuizActive(true)}
                onOpenVocabManager={() => setVocabManagerVisible(true)}
                gamification={gamification}
                rollJustIncreased={rollJustIncreased}
                colors={colors}
              />
            ) : null}
            {activeTab === 'statistics' ? (
              <StatisticsScreen allWords={allWords} selectedTiers={selectedTiers} colors={colors} />
            ) : null}
            {activeTab === 'tags' ? (
              <TaggedWordsScreen
                allWords={allWords}
                userTags={userTags}
                onTagsChanged={setUserTags}
                colors={colors}
              />
            ) : null}
            {activeTab === 'achievements' ? (
              <AchievementsScreen gamification={gamification} colors={colors} />
            ) : null}
            {activeTab === 'settings' ? (
              <SettingsScreen
                colors={colors}
                themePreference={themePreference}
                onSetThemePreference={setThemePreference}
              />
            ) : null}
          </View>
          <BottomTabBar activeTab={activeTab} onSelectTab={setActiveTab} colors={colors} />
        </>
      )}

      <CustomVocabManager
        visible={vocabManagerVisible}
        onClose={() => setVocabManagerVisible(false)}
        onChanged={setCustomWords}
        colors={colors}
      />
      {unlockQueue.length > 0 ? (
        <AchievementUnlockOverlay
          queue={unlockQueue}
          onDismissOne={() => setUnlockQueue((q) => q.slice(1))}
          colors={colors}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});
