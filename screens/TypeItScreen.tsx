// screens/TypeItScreen.tsx
// A third study mode alongside Quiz (multiple choice) and Quick Play
// (self-graded flip): the Japanese word is shown (with its romaji
// underneath, as a reading aid), and the user types it back — either
// in Japanese (hiragana, katakana, or kanji all accepted) or in
// romaji, whichever they pick with the mode switch. Getting it right
// flips the card to reveal the English translation, as a reward
// rather than a hint. Feeds the same SRS/gamification pipeline as
// Quiz and Quick Play.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import JapaneseText from '../components/JapaneseText';
import PatternBackground from '../components/PatternBackground';
import GlassSurface from '../components/Glass';
import KanaTipsModal from '../components/KanaTipsModal';
import DailyLimitScreen from '../components/DailyLimitScreen';
import { GamificationState, SRSStore, VocabWord } from '../types';
import { buildStudyQueue, getOrCreateSRSData, updateAfterAnswer } from '../services/srsEngine';
import { loadSRSStore, saveSRSStore } from '../services/storageService';
import { addAnswerResult, recordDailyCard, FREE_DAILY_CARD_LIMIT } from '../services/gamificationService';
import { usePurchases } from '../contexts/PurchasesContext';
import { speakJapanese } from '../services/ttsService';
import { ThemeColors } from '../theme/theme';

interface TypeItScreenProps {
  words: VocabWord[];
  activeTierCount: number;
  onExit: () => void;
  gamification: GamificationState;
  onGamificationUpdate: (next: GamificationState) => void;
  onRollIncreaseFlag: (value: boolean) => void;
  colors: ThemeColors;
  isDark: boolean;
}

type InputMode = 'japanese' | 'romaji';

const MAX_CONTENT_WIDTH = 480;
const FLIP_DURATION = 350;
const SWITCH_WIDTH = 44;
const SWITCH_HEIGHT = 26;
const THUMB_SIZE = 20;
const SWITCH_PADDING = 3;

// Zero-width space/joiners and a BOM — some IMEs leave one of these
// behind at the composition boundary, which is otherwise invisible
// but breaks a strict string-equality check.
const INVISIBLE_CHARS_RE = /[\u200B-\u200D\uFEFF]/g;

/** Katakana -> hiragana, so either script matches the same word. Kanji/romaji are untouched. */
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** NFC-normalized, invisible-character-stripped, hiragana-normalized — the canonical form used for comparison. */
function normalizeForCompare(s: string): string {
  return toHiragana(s.normalize('NFC').replace(INVISIBLE_CHARS_RE, '').trim());
}

/**
 * Hiragana/katakana/kanji are always accepted, in either mode — someone
 * who correctly typed the word's actual reading shouldn't get marked
 * wrong just because the switch happened to be on "Romaji". Romaji
 * itself is only accepted in "romaji" mode, since that's the easier
 * shortcut the switch exists to gate.
 */
function checkAnswer(input: string, word: VocabWord, mode: InputMode): boolean {
  const normalizedInput = normalizeForCompare(input);
  if (!normalizedInput) return false;

  if (normalizedInput === normalizeForCompare(word.japanese)) return true;
  if (word.reading && normalizedInput === normalizeForCompare(word.reading)) return true;

  if (mode === 'romaji') {
    return input.trim().toLowerCase() === word.romaji.trim().toLowerCase();
  }
  return false;
}

export default function TypeItScreen({
  words,
  activeTierCount,
  onExit,
  gamification,
  onGamificationUpdate,
  onRollIncreaseFlag,
  colors,
  isDark,
}: TypeItScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - 40);
  const insets = useSafeAreaInsets();
  const { isPro, presentPaywall } = usePurchases();

  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [limitReached, setLimitReached] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('romaji');
  const [tipsVisible, setTipsVisible] = useState(false);

  const rotation = useSharedValue(0);
  // 0 = thumb at the "japanese" (あ) side, 1 = "romaji" (EN) side — must
  // match inputMode's own initial value above, or the switch renders on
  // one side while the placeholder/validation act like it's on the other.
  const switchThumb = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const store = await loadSRSStore();
      setSrsStore(store);
      setQueue(buildStudyQueue(words, store));
      setQueueIndex(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const currentWord = queue[queueIndex];

  useEffect(() => {
    setInput('');
    setResult(null);
    rotation.value = 0;
  }, [queueIndex, rotation]);

  const toggleInputMode = () => {
    Haptics.selectionAsync().catch(() => {});
    setInputMode((prev) => {
      const next = prev === 'japanese' ? 'romaji' : 'japanese';
      switchThumb.value = withTiming(next === 'japanese' ? 0 : 1, { duration: 200 });
      return next;
    });
  };

  const switchThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: switchThumb.value * (SWITCH_WIDTH - THUMB_SIZE - SWITCH_PADDING * 2) }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const handleCheck = useCallback(async () => {
    if (!currentWord || result) return;
    const isCorrect = checkAnswer(input, currentWord, inputMode);
    setResult(isCorrect ? 'correct' : 'incorrect');
    Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});

    if (isCorrect) {
      rotation.value = withTiming(180, { duration: FLIP_DURATION });
      speakJapanese(currentWord.japanese);
    }

    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    const existing = getOrCreateSRSData(srsStore, currentWord.id);
    const updated = updateAfterAnswer(existing, isCorrect);
    const nextStore = { ...srsStore, [currentWord.id]: updated };
    setSrsStore(nextStore);
    await saveSRSStore(nextStore);

    const afterAnswer = addAnswerResult(gamification, isCorrect, currentWord.tier, activeTierCount);
    const { next, rollIncreased, dailyCount } = recordDailyCard(afterAnswer);
    onGamificationUpdate(next);
    if (rollIncreased) {
      onRollIncreaseFlag(true);
      setTimeout(() => onRollIncreaseFlag(false), 1200);
    }

    setTimeout(() => {
      if (!isPro && dailyCount >= FREE_DAILY_CARD_LIMIT) {
        setLimitReached(true);
      } else {
        setQueueIndex((i) => i + 1);
      }
    }, isCorrect ? 1700 : 1400);
  }, [
    currentWord,
    result,
    input,
    inputMode,
    srsStore,
    gamification,
    onGamificationUpdate,
    onRollIncreaseFlag,
    activeTierCount,
    rotation,
    isPro,
  ]);

  const progressLabel = useMemo(() => `${score.correct}/${score.total}`, [score]);

  if (limitReached) {
    return <DailyLimitScreen colors={colors} onExit={onExit} onUpgrade={presentPaywall} />;
  }

  if (!currentWord && queue.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading your queue…</Text>
      </View>
    );
  }

  const isDone = queueIndex >= queue.length;
  if (isDone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>Session complete ⌨️</Text>
        <Text style={[styles.doneScore, { color: colors.textSecondary }]}>{progressLabel} correct</Text>
        <Pressable style={[styles.exitButton, { backgroundColor: colors.primary }]} onPress={onExit}>
          <Text style={styles.exitButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <View style={[styles.contentWrap, { width: contentWidth }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onExit} hitSlop={16}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.topBarRight}>
            <View style={styles.topBarRow}>
              <Text style={[styles.scoreText, { color: colors.textSecondary }]}>{progressLabel}</Text>
              <Pressable
                onPress={() => setTipsVisible(true)}
                hitSlop={8}
                style={[styles.tipsBadge, { backgroundColor: `${colors.card}A6`, borderColor: colors.border }]}
              >
                <Text style={[styles.tipsBadgeChar, { color: colors.textPrimary }]}>つ</Text>
                <Ionicons name="arrow-forward" size={9} color={colors.textSecondary} />
                <Text style={[styles.tipsBadgeChar, styles.tipsBadgeSmallChar, { color: colors.primary }]}>っ</Text>
              </Pressable>
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>あ</Text>
              <Pressable onPress={toggleInputMode} hitSlop={8}>
                <View style={[styles.switchTrack, { borderColor: colors.border }]}>
                  <GlassSurface
                    style={StyleSheet.absoluteFill}
                    colors={colors}
                    isDark={isDark}
                    tintColor={colors.card}
                    variant="clear"
                  />
                  <Animated.View
                    style={[styles.switchThumb, { backgroundColor: colors.primary }, switchThumbStyle]}
                  />
                </View>
              </Pressable>
              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>EN</Text>
            </View>
          </View>
        </View>

        <View style={styles.playArea}>
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.flipZone}>
              <Animated.View style={[styles.face, frontStyle]}>
                <JapaneseText
                  text={currentWord.japanese}
                  reading={currentWord.reading}
                  fontSize={32}
                  color={colors.textPrimary}
                />
                {inputMode === 'japanese' ? (
                  <Text style={[styles.romajiHint, { color: colors.textSecondary }]}>{currentWord.romaji}</Text>
                ) : null}
                <Pressable
                  style={[styles.speakerButton, { backgroundColor: colors.surface }]}
                  onPress={() => speakJapanese(currentWord.japanese)}
                  hitSlop={10}
                >
                  <Ionicons name="volume-high" size={20} color={colors.primary} />
                </Pressable>
              </Animated.View>

              <Animated.View style={[styles.face, backStyle]}>
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                <Text style={[styles.translationBig, { color: colors.primary }]}>{currentWord.english}</Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.textPrimary,
                  borderColor:
                    result === 'correct' ? colors.success : result === 'incorrect' ? colors.error : colors.border,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder={inputMode === 'japanese' ? 'Type in hiragana, katakana, or kanji…' : 'Type in romaji…'}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!result}
              onSubmitEditing={handleCheck}
              returnKeyType="done"
            />
          </View>

          {result ? (
            <View
              style={[
                styles.resultBanner,
                { backgroundColor: result === 'correct' ? colors.successBg : colors.errorBg },
              ]}
            >
              <Ionicons
                name={result === 'correct' ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={result === 'correct' ? colors.success : colors.error}
              />
              <View style={styles.resultTextWrap}>
                <Text style={[styles.resultText, { color: result === 'correct' ? colors.success : colors.error }]}>
                  {result === 'correct' ? 'Correct!' : `Answer: ${currentWord.romaji} (${currentWord.japanese})`}
                </Text>
                {result === 'incorrect' ? (
                  <Text style={[styles.resultSubtext, { color: colors.textSecondary }]}>
                    You typed: {input.trim()}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.checkButton, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
              onPress={handleCheck}
              disabled={!input.trim()}
            >
              <Text style={styles.checkButtonText}>Check</Text>
            </Pressable>
          )}
        </View>
      </View>

      <KanaTipsModal visible={tipsVisible} onClose={() => setTipsVisible(false)} colors={colors} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrap: {
    flex: 1,
    maxWidth: 560,
    paddingHorizontal: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topBarRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  tipsBadgeChar: {
    fontSize: 15,
    fontWeight: '800',
  },
  tipsBadgeSmallChar: {
    fontSize: 12,
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchTrack: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  switchThumb: {
    position: 'absolute',
    left: SWITCH_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  flipZone: {
    width: '100%',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  romajiHint: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  translationBig: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  speakerButton: {
    marginTop: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputRow: {
    marginTop: 28,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkButton: {
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  resultBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  resultTextWrap: {
    flexShrink: 1,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
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
