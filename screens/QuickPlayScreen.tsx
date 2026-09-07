// screens/QuickPlayScreen.tsx
// A faster, simpler review loop than the multiple-choice Quiz: the
// word appears, you say/think the answer, tap to reveal it, then
// self-grade with "Got it" / "Missed it" — same idea as Duolingo's
// quick review or a physical flashcard deck. Feeds the same SRS and
// gamification systems as the regular Quiz, so Quick Play sessions
// count toward XP, Roll, and "known" status too.
//
// This is the safe, Expo-Go-compatible half of the feature. Hands-free
// mic input lives separately in future-handsfree/ — see that folder's
// README for why, and what it takes to turn it on.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import JapaneseText from '../components/JapaneseText';
import PatternBackground from '../components/PatternBackground';
import DailyLimitScreen from '../components/DailyLimitScreen';
import { GameMode, GamificationState, QuestionDirection, SRSStore, VocabWord } from '../types';
import { buildStudyQueue, getOrCreateSRSData, updateAfterAnswer } from '../services/srsEngine';
import { loadSRSStore, saveSRSStore } from '../services/storageService';
import { speakJapanese } from '../services/ttsService';
import { addAnswerResult, recordDailyCard, FREE_DAILY_CARD_LIMIT } from '../services/gamificationService';
import { usePurchases } from '../contexts/PurchasesContext';
import { ThemeColors } from '../theme/theme';

interface QuickPlayScreenProps {
  words: VocabWord[];
  mode: GameMode;
  activeTierCount: number;
  onExit: () => void;
  gamification: GamificationState;
  onGamificationUpdate: (next: GamificationState) => void;
  onRollIncreaseFlag: (value: boolean) => void;
  colors: ThemeColors;
}

const MAX_CONTENT_WIDTH = 480;
const FLIP_DURATION = 350;

function resolveDirection(mode: GameMode): QuestionDirection {
  if (mode === 'mixed') return Math.random() < 0.5 ? 'en-to-jp' : 'jp-to-en';
  return mode;
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuickPlayScreen({
  words,
  mode,
  activeTierCount,
  onExit,
  gamification,
  onGamificationUpdate,
  onRollIncreaseFlag,
  colors,
}: QuickPlayScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - 40);
  const insets = useSafeAreaInsets();
  const { isPro, presentPaywall } = usePurchases();

  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [direction, setDirection] = useState<QuestionDirection>('en-to-jp');
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [limitReached, setLimitReached] = useState(false);

  const rotation = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const store = await loadSRSStore();
      setSrsStore(store);
      setQueue(shuffled(buildStudyQueue(words, store)));
      setQueueIndex(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const currentWord = queue[queueIndex];

  useEffect(() => {
    if (currentWord) {
      setDirection(resolveDirection(mode));
      setRevealed(false);
      rotation.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueIndex, queue]);

  const promptIsJapanese = direction === 'jp-to-en';

  const reveal = useCallback(() => {
    if (revealed) return;
    Haptics.selectionAsync().catch(() => {});
    setRevealed(true);
    rotation.value = withTiming(180, { duration: FLIP_DURATION });
    if (!promptIsJapanese && currentWord) {
      // In en-to-jp, the answer being revealed is the Japanese word — say it.
      speakJapanese(currentWord.japanese);
    }
  }, [revealed, promptIsJapanese, currentWord, rotation]);

  const grade = useCallback(
    async (gotIt: boolean) => {
      if (!currentWord || !revealed) return;

      if (gotIt) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setStreak((s) => s + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setStreak(0);
      }
      setScore((s) => ({ correct: s.correct + (gotIt ? 1 : 0), total: s.total + 1 }));

      const existing = getOrCreateSRSData(srsStore, currentWord.id);
      const updated = updateAfterAnswer(existing, gotIt);
      const nextStore = { ...srsStore, [currentWord.id]: updated };
      setSrsStore(nextStore);
      await saveSRSStore(nextStore);

      const afterAnswer = addAnswerResult(gamification, gotIt, currentWord.tier, activeTierCount);
      const { next, rollIncreased, dailyCount } = recordDailyCard(afterAnswer);
      onGamificationUpdate(next);
      if (rollIncreased) {
        onRollIncreaseFlag(true);
        setTimeout(() => onRollIncreaseFlag(false), 1200);
      }

      if (!isPro && dailyCount >= FREE_DAILY_CARD_LIMIT) {
        setLimitReached(true);
      } else {
        setQueueIndex((i) => i + 1);
      }
    },
    [currentWord, revealed, srsStore, gamification, onGamificationUpdate, onRollIncreaseFlag, activeTierCount, isPro]
  );

  const translateX = useSharedValue(0);
  const gradeAfterSwipe = useCallback(
    (gotIt: boolean) => {
      setTimeout(() => grade(gotIt), 150);
    },
    [grade]
  );
  const swipeGesture = Gesture.Pan()
    .enabled(revealed)
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = 90;
      if (e.translationX > threshold) {
        translateX.value = withTiming(500, { duration: 200 });
        runOnJS(gradeAfterSwipe)(true);
      } else if (e.translationX < -threshold) {
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(gradeAfterSwipe)(false);
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  useEffect(() => {
    translateX.value = 0;
  }, [queueIndex]);

  const cardSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${translateX.value / 20}deg` }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const progressLabel = useMemo(() => `${score.correct}/${score.total}`, [score]);

  if (limitReached) {
    return <DailyLimitScreen colors={colors} onExit={onExit} onUpgrade={presentPaywall} />;
  }

  if (!currentWord && queue.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  const isDone = queueIndex >= queue.length;
  if (isDone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>Quick Play complete ⚡</Text>
        <Text style={[styles.doneScore, { color: colors.textSecondary }]}>{progressLabel} correct</Text>
        <Pressable style={[styles.exitButton, { backgroundColor: colors.primary }]} onPress={onExit}>
          <Text style={styles.exitButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <View style={[styles.contentWrap, { width: contentWidth }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onExit} hitSlop={16}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.topBarRight}>
            {streak > 1 ? (
              <View style={[styles.streakPill, { backgroundColor: colors.card }]}>
                <Ionicons name="flash" size={13} color={colors.accentRed} />
                <Text style={[styles.streakText, { color: colors.textPrimary }]}>{streak}</Text>
              </View>
            ) : null}
            <Text style={[styles.scoreText, { color: colors.textSecondary }]}>{progressLabel}</Text>
          </View>
        </View>

        <View style={styles.playArea}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={cardSwipeStyle}>
            <Pressable onPress={reveal} disabled={revealed}>
              <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <View style={styles.flipZone}>
                  <Animated.View style={[styles.face, frontStyle]}>
                    {promptIsJapanese ? (
                      <JapaneseText
                        text={currentWord.japanese}
                        reading={currentWord.reading}
                        fontSize={32}
                        color={colors.textPrimary}
                      />
                    ) : (
                      <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                        {currentWord.english}
                      </Text>
                    )}
                    {!revealed ? (
                      <Text style={[styles.tapHint, { color: colors.textSecondary }]}>tap to reveal</Text>
                    ) : null}
                  </Animated.View>

                  <Animated.View style={[styles.face, backStyle]}>
                    {promptIsJapanese ? (
                      <Text style={[styles.answerText, { color: colors.primary }]}>
                        {currentWord.english}
                      </Text>
                    ) : (
                      <>
                        <JapaneseText
                          text={currentWord.japanese}
                          reading={currentWord.reading}
                          fontSize={30}
                          color={colors.primary}
                        />
                        <Text style={[styles.romajiText, { color: colors.textSecondary }]}>
                          {currentWord.romaji}
                        </Text>
                      </>
                    )}
                  </Animated.View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>

        {revealed ? (
          <View style={styles.gradeRow}>
            <Pressable
              style={[styles.gradeButton, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
              onPress={() => grade(false)}
            >
              <Ionicons name="close" size={22} color={colors.error} />
              <Text style={[styles.gradeButtonText, { color: colors.error }]}>Missed it</Text>
            </Pressable>
            <Pressable
              style={[styles.gradeButton, { backgroundColor: colors.successBg, borderColor: colors.success }]}
              onPress={() => grade(true)}
            >
              <Ionicons name="checkmark" size={22} color={colors.success} />
              <Text style={[styles.gradeButtonText, { color: colors.success }]}>Got it</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>
            Tap the card, then swipe right if you got it, left if you missed it
          </Text>
        )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrap: {
    flex: 1,
    maxWidth: 480,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    borderRadius: 28,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  flipZone: {
    width: '100%',
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  answerText: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  romajiText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  tapHint: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  gradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  gradeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  swipeHint: {
    marginTop: 24,
    fontSize: 12.5,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  doneScore: {
    fontSize: 17,
    marginBottom: 28,
  },
  exitButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
