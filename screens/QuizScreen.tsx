// screens/QuizScreen.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QuizCard from '../components/QuizCard';
import SwipeableOption, { OptionState } from '../components/SwipeableOption';
import TagEditorModal from '../components/TagEditorModal';
import { GameMode, GamificationState, QuestionDirection, QuizQuestion, SRSStore, UserTagStore, VocabWord } from '../types';
import { buildStudyQueue, getOrCreateSRSData, updateAfterAnswer, isWordKnown, markWordKnownManually, unmarkWordKnown } from '../services/srsEngine';
import { loadSRSStore, saveSRSStore } from '../services/storageService';
import { speakJapanese } from '../services/ttsService';
import { addAnswerResult, registerDailyActivity } from '../services/gamificationService';
import { loadUserTags, addTagToWord, removeTagFromWord, getEffectiveTags, getAllKnownTags } from '../services/tagsService';
import { ThemeColors } from '../theme/theme';

interface QuizScreenProps {
  words: VocabWord[];
  allWordsForTagSuggestions: VocabWord[];
  mode: GameMode;
  activeTierCount: number;
  onExit: () => void;
  gamification: GamificationState;
  onGamificationUpdate: (next: GamificationState) => void;
  onRollIncreaseFlag: (value: boolean) => void;
  colors: ThemeColors;
}

const OPTIONS_PER_QUESTION = 3;
const MAX_CONTENT_WIDTH = 560;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveDirection(mode: GameMode): QuestionDirection {
  if (mode === 'mixed') {
    return Math.random() < 0.5 ? 'en-to-jp' : 'jp-to-en';
  }
  return mode;
}

function buildQuestion(pool: VocabWord[], correctWord: VocabWord, mode: GameMode): QuizQuestion {
  const distractorPool = pool.filter((w) => w.id !== correctWord.id);
  const distractors = shuffled(distractorPool).slice(0, OPTIONS_PER_QUESTION - 1);
  const options = shuffled([
    { word: correctWord, isCorrect: true },
    ...distractors.map((w) => ({ word: w, isCorrect: false })),
  ]);
  return { prompt: correctWord, options, direction: resolveDirection(mode) };
}

export default function QuizScreen({
  words,
  allWordsForTagSuggestions,
  mode,
  activeTierCount,
  onExit,
  gamification,
  onGamificationUpdate,
  onRollIncreaseFlag,
  colors,
}: QuizScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - 40);

  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [userTags, setUserTags] = useState<UserTagStore>({});
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [sessionEnded, setSessionEnded] = useState(false);
  const [tagEditorVisible, setTagEditorVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const store = await loadSRSStore();
      setSrsStore(store);
      const tags = await loadUserTags();
      setUserTags(tags);
      const builtQueue = buildStudyQueue(words, store);
      setQueue(builtQueue);
      setQueueIndex(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => {
    if (queue.length === 0) return;
    if (queueIndex >= queue.length) return;
    const current = queue[queueIndex];
    setQuestion(buildQuestion(words, current, mode));
    setOptionStates({});
    setAnswered(false);
  }, [queue, queueIndex, words, mode]);

  useEffect(() => {
    const isDone = queue.length > 0 && queueIndex >= queue.length;
    if (isDone && !sessionEnded && score.total > 0) {
      setSessionEnded(true);
      const { next, rollIncreased } = registerDailyActivity(gamification);
      onGamificationUpdate(next);
      if (rollIncreased) {
        onRollIncreaseFlag(true);
        setTimeout(() => onRollIncreaseFlag(false), 1200);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueIndex, queue.length, sessionEnded, score.total]);

  const handleSelect = useCallback(
    async (optionWord: VocabWord, isCorrect: boolean) => {
      if (!question || answered) return;
      setAnswered(true);

      if (isCorrect) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      if (isCorrect && question.direction === 'en-to-jp') {
        speakJapanese(question.prompt.japanese);
      }

      const nextStates: Record<string, OptionState> = {};
      for (const opt of question.options) {
        if (opt.word.id === optionWord.id) {
          nextStates[opt.word.id] = isCorrect ? 'correct' : 'incorrect';
        } else if (opt.isCorrect) {
          nextStates[opt.word.id] = 'correct';
        } else {
          nextStates[opt.word.id] = 'disabled';
        }
      }
      setOptionStates(nextStates);
      setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

      const existing = getOrCreateSRSData(srsStore, question.prompt.id);
      const updatedSRS = updateAfterAnswer(existing, isCorrect);
      const nextStore = { ...srsStore, [question.prompt.id]: updatedSRS };
      setSrsStore(nextStore);
      await saveSRSStore(nextStore);

      onGamificationUpdate(addAnswerResult(gamification, isCorrect, question.prompt.tier, activeTierCount));

      setTimeout(() => {
        setQueueIndex((i) => i + 1);
      }, 900);
    },
    [question, answered, srsStore, gamification, onGamificationUpdate, activeTierCount]
  );

  const handleMarkKnown = useCallback(async () => {
    if (!question) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const existing = getOrCreateSRSData(srsStore, question.prompt.id);
    const isCurrentlyKnown = isWordKnown(existing);
    const updated = isCurrentlyKnown ? unmarkWordKnown(existing) : markWordKnownManually(existing);
    const nextStore = { ...srsStore, [question.prompt.id]: updated };
    setSrsStore(nextStore);
    await saveSRSStore(nextStore);
  }, [question, srsStore]);

  const handleAddTag = useCallback(
    async (tag: string) => {
      if (!question) return;
      const updated = await addTagToWord(question.prompt.id, tag);
      setUserTags(updated);
    },
    [question]
  );

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      if (!question) return;
      const updated = await removeTagFromWord(question.prompt.id, tag);
      setUserTags(updated);
    },
    [question]
  );

  const progressLabel = useMemo(() => `${score.correct}/${score.total}`, [score]);

  const tagSuggestions = useMemo(
    () => getAllKnownTags(allWordsForTagSuggestions, userTags),
    [allWordsForTagSuggestions, userTags]
  );

  if (!question) {
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
        <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>Session complete 🎉</Text>
        <Text style={[styles.doneScore, { color: colors.textSecondary }]}>{progressLabel} correct</Text>
        <Pressable style={[styles.exitButton, { backgroundColor: colors.primary }]} onPress={onExit}>
          <Text style={styles.exitButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const promptIsJapanese = question.direction === 'jp-to-en';
  const currentSRS = srsStore[question.prompt.id];
  const currentTags = getEffectiveTags(question.prompt, userTags);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.contentWrap, { width: contentWidth }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onExit} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.scoreText, { color: colors.textSecondary }]}>{progressLabel}</Text>
        </View>

        <QuizCard
          promptText={promptIsJapanese ? question.prompt.japanese : question.prompt.english}
          romajiSubtext={promptIsJapanese ? question.prompt.romaji : undefined}
          japaneseToSpeak={promptIsJapanese ? question.prompt.japanese : undefined}
          reading={promptIsJapanese ? question.prompt.reading : undefined}
          isJapanesePrompt={promptIsJapanese}
          colors={colors}
          onOpenTagEditor={() => setTagEditorVisible(true)}
          onMarkKnown={handleMarkKnown}
          isKnown={isWordKnown(currentSRS)}
        />

        <View style={styles.optionsArea}>
          {question.options.map((opt) => (
            <SwipeableOption
              key={opt.word.id}
              label={promptIsJapanese ? opt.word.english : opt.word.japanese}
              romaji={opt.word.romaji}
              state={optionStates[opt.word.id] ?? 'idle'}
              onPress={() => handleSelect(opt.word, opt.isCorrect)}
              isJapaneseLabel={!promptIsJapanese}
              reading={!promptIsJapanese ? opt.word.reading : undefined}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <TagEditorModal
        visible={tagEditorVisible}
        onClose={() => setTagEditorVisible(false)}
        wordLabel={question.prompt.japanese}
        currentTags={currentTags}
        suggestions={tagSuggestions}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
  },
  contentWrap: {
    maxWidth: 560,
    paddingHorizontal: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionsArea: {
    marginTop: 28,
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
