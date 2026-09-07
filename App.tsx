// App.tsx
// Navigation model: a persistent BottomTabBar switches between 4 real
// pages (Home/Statistics/Vault/Settings) in a swipeable pager; "Type
// It" is a 5th bar icon but has no page of its own — tapping it starts
// a full-screen session, same as Quiz/Quick Play, which hides the tab
// bar entirely (the same "now playing takes over the screen" pattern
// Apple Music uses) and returns to whichever page was showing when
// it's exited.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import QuizScreen from './screens/QuizScreen';
import QuickPlayScreen from './screens/QuickPlayScreen';
import TypeItScreen from './screens/TypeItScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import VaultScreen from './screens/VaultScreen';
import CustomVocabManager from './components/CustomVocabManager';
import AchievementUnlockOverlay from './components/AchievementUnlockOverlay';
import MilestoneCelebration from './components/MilestoneCelebration';
import BottomTabBar, { PAGER_TABS, TAB_BAR_CONTENT_HEIGHT, TabKey } from './components/BottomTabBar';

import { VOCAB_DATABASE } from './data/vocabDatabase';
import { loadCustomVocab, loadSRSStore } from './services/storageService';
import { loadUserTags } from './services/tagsService';
import { computeMasteryProgress } from './services/srsEngine';
import { configurePurchases } from './services/purchasesService';
import { pullCloudProgress, scheduleCloudPush } from './services/cloudSyncService';
import { FrequencyTier, GameMode, VocabWord, GamificationState, UserTagStore } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PurchasesProvider } from './contexts/PurchasesContext';
import {
  loadGamification,
  saveGamification,
  createInitialGamificationState,
} from './services/gamificationService';
import { checkForNewlyUnlocked } from './services/achievementsEngine';

const HAS_SEEN_WELCOME_KEY = '@jp_flashcards/has_seen_welcome_v1';
const MILESTONE_STEP = 25;

function AppInner() {
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const { session, loading: authLoading, guestMode } = useAuth();
  const cloudSyncedUserId = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const bottomInset = TAB_BAR_CONTENT_HEIGHT + insets.bottom + 16;

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [quizActive, setQuizActive] = useState(false);
  const [quickPlayActive, setQuickPlayActive] = useState(false);
  const [typeItActive, setTypeItActive] = useState(false);
  const [vocabManagerVisible, setVocabManagerVisible] = useState(false);

  const [customWords, setCustomWords] = useState<VocabWord[]>([]);
  const [userTags, setUserTags] = useState<UserTagStore>({});
  const [selectedTiers, setSelectedTiers] = useState<FrequencyTier[]>([1]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>('en-to-jp');

  const [gamification, setGamification] = useState<GamificationState>(createInitialGamificationState());
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);
  const [rollJustIncreased, setRollJustIncreased] = useState(false);
  const [milestoneQueue, setMilestoneQueue] = useState<number[]>([]);
  // Baseline correct-answer count as of app start, so the very first
  // answer of a session doesn't fire a celebration for progress made
  // earlier — null until the real baseline has actually loaded.
  const lastCorrectCountRef = useRef<number | null>(null);

  useEffect(() => {
    configurePurchases();
    loadCustomVocab().then(setCustomWords);
    loadGamification().then((g) => {
      setGamification(g);
      lastCorrectCountRef.current = g.totalCorrect;
    });
    loadUserTags().then(setUserTags);
    AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY).then((v) => setHasSeenWelcome(v === 'true'));
  }, []);

  // Pulls this account's cloud snapshot (if any) into local storage on
  // sign-in, then re-loads the four pieces of state from it — so a
  // reinstall or a new device picks up right where the account left
  // off. Guests (no session) never hit this.
  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (!userId || userId === cloudSyncedUserId.current) return;
    cloudSyncedUserId.current = userId;
    pullCloudProgress(userId).then((snapshot) => {
      setGamification(snapshot.gamification);
      lastCorrectCountRef.current = snapshot.gamification.totalCorrect;
      setCustomWords(snapshot.customVocab);
      setUserTags(snapshot.userTags);
    });
  }, [session?.user?.id]);

  const dismissWelcome = () => {
    setHasSeenWelcome(true);
    AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true').catch(() => {});
  };

  const allWords = useMemo(() => [...VOCAB_DATABASE, ...customWords], [customWords]);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(w.tier);
      const effectiveTags = [...w.categories, ...(userTags[w.id] ?? [])];
      const tagMatch = selectedTags.length === 0 || effectiveTags.some((t) => selectedTags.includes(t));
      return tierMatch && tagMatch;
    });
  }, [allWords, selectedTiers, selectedTags, userTags]);

  const selectTab = (tab: TabKey) => {
    // "typeit" has no page in the pager — it launches a full-screen
    // session instead, same as Quiz/Quick Play, and the tab bar is
    // hidden for the duration anyway, so activeTab is left as whatever
    // real page it already was.
    if (tab === 'typeit') {
      setTypeItActive(true);
      return;
    }
    setActiveTab(tab);
    const index = PAGER_TABS.indexOf(tab);
    // Not animated: a drag across the tab bar can call this several times
    // in under a second (one per tab crossed). Animated scrollTo calls
    // queue/interrupt each other, which is the "jumpy" content flicker —
    // an instant jump per crossing is also what Apple Music itself does.
    pagerRef.current?.scrollTo({ x: index * width, animated: false });
  };

  // Continuous, not just on scroll-end: a one-shot end event that gets
  // dropped or delayed (seen on a sideloaded/no-JIT build, where the JS
  // thread lags) leaves the tab bar stuck on a stale tab forever. Firing
  // on every scroll frame instead makes it self-correct within one frame
  // of any further motion, regardless of whether an end event lands.
  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const tab = PAGER_TABS[index];
    if (tab && tab !== activeTab) setActiveTab(tab);
  };

  const setTierRange = (start: FrequencyTier, end: FrequencyTier) => {
    setSelectedTiers(Array.from({ length: end - start + 1 }, (_, i) => start + i));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const applyGamificationUpdate = async (next: GamificationState) => {
    const srsStore = await loadSRSStore();
    const progress = computeMasteryProgress(allWords, srsStore);
    const newlyUnlocked = checkForNewlyUnlocked(next, progress);
    const withUnlocks = newlyUnlocked.length
      ? { ...next, unlockedAchievementIds: [...next.unlockedAchievementIds, ...newlyUnlocked] }
      : next;
    setGamification(withUnlocks);
    await saveGamification(withUnlocks);
    if (newlyUnlocked.length) {
      setUnlockQueue((q) => [...q, ...newlyUnlocked]);
    }

    const lastCorrect = lastCorrectCountRef.current;
    if (
      lastCorrect !== null &&
      withUnlocks.totalCorrect > lastCorrect &&
      Math.floor(withUnlocks.totalCorrect / MILESTONE_STEP) > Math.floor(lastCorrect / MILESTONE_STEP)
    ) {
      setMilestoneQueue((q) => [...q, withUnlocks.totalCorrect]);
    }
    lastCorrectCountRef.current = withUnlocks.totalCorrect;

    if (session?.user?.id) scheduleCloudPush(session.user.id);
  };

  const updateCustomWords = (words: VocabWord[]) => {
    setCustomWords(words);
    if (session?.user?.id) scheduleCloudPush(session.user.id);
  };

  const updateUserTags = (tags: UserTagStore) => {
    setUserTags(tags);
    if (session?.user?.id) scheduleCloudPush(session.user.id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {authLoading || hasSeenWelcome === null ? null : !hasSeenWelcome ? (
        <WelcomeScreen colors={colors} onContinue={dismissWelcome} />
      ) : !session && !guestMode ? (
        <LoginScreen colors={colors} />
      ) : quizActive ? (
        <QuizScreen
          words={filteredWords}
          allWordsForTagSuggestions={allWords}
          mode={mode}
          activeTierCount={Math.max(1, selectedTiers.length)}
          onExit={() => {
            setQuizActive(false);
            loadUserTags().then(updateUserTags);
          }}
          gamification={gamification}
          onGamificationUpdate={applyGamificationUpdate}
          onRollIncreaseFlag={setRollJustIncreased}
          colors={colors}
        />
      ) : quickPlayActive ? (
        <QuickPlayScreen
          words={filteredWords}
          mode={mode}
          activeTierCount={Math.max(1, selectedTiers.length)}
          onExit={() => setQuickPlayActive(false)}
          gamification={gamification}
          onGamificationUpdate={applyGamificationUpdate}
          onRollIncreaseFlag={setRollJustIncreased}
          colors={colors}
        />
      ) : typeItActive ? (
        <TypeItScreen
          words={filteredWords}
          activeTierCount={Math.max(1, selectedTiers.length)}
          onExit={() => setTypeItActive(false)}
          gamification={gamification}
          onGamificationUpdate={applyGamificationUpdate}
          onRollIncreaseFlag={setRollJustIncreased}
          colors={colors}
          isDark={isDark}
        />
      ) : (
        <>
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPagerScroll}
            scrollEventThrottle={50}
            style={styles.pager}
          >
            <View style={{ width }}>
              <HomeScreen
                allWords={allWords}
                userTags={userTags}
                selectedTiers={selectedTiers}
                onSetTierRange={setTierRange}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
                mode={mode}
                onSetMode={setMode}
                wordCount={filteredWords.length}
                onStart={() => setQuizActive(true)}
                onStartQuickPlay={() => setQuickPlayActive(true)}
                onOpenVocabManager={() => setVocabManagerVisible(true)}
                gamification={gamification}
                rollJustIncreased={rollJustIncreased}
                colors={colors}
                bottomInset={bottomInset}
              />
            </View>
            <View style={{ width }}>
              <StatisticsScreen allWords={allWords} colors={colors} bottomInset={bottomInset} />
            </View>
            <View style={{ width }}>
              <VaultScreen
                allWords={allWords}
                userTags={userTags}
                onTagsChanged={updateUserTags}
                gamification={gamification}
                colors={colors}
                bottomInset={bottomInset}
              />
            </View>
            <View style={{ width }}>
              <SettingsScreen
                colors={colors}
                themePreference={themePreference}
                onSetThemePreference={setThemePreference}
                bottomInset={bottomInset}
                onPreviewMilestone={() => setMilestoneQueue((q) => [...q, 25])}
              />
            </View>
          </ScrollView>
          <BottomTabBar activeTab={activeTab} onSelectTab={selectTab} colors={colors} isDark={isDark} />
        </>
      )}

      <CustomVocabManager
        visible={vocabManagerVisible}
        onClose={() => setVocabManagerVisible(false)}
        onChanged={updateCustomWords}
        colors={colors}
      />
      {/* Achievements take priority; a milestone crossed in the same
          update waits its turn in milestoneQueue rather than stacking
          a second modal on top. */}
      {unlockQueue.length > 0 ? (
        <AchievementUnlockOverlay
          queue={unlockQueue}
          onDismissOne={() => setUnlockQueue((q) => q.slice(1))}
          colors={colors}
        />
      ) : milestoneQueue.length > 0 ? (
        <MilestoneCelebration
          correctCount={milestoneQueue[0]}
          onDismiss={() => setMilestoneQueue((q) => q.slice(1))}
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
          <AuthProvider>
            <PurchasesProvider>
              <AppInner />
            </PurchasesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
});
