// screens/QuizScreen.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QuizCard from '../components/QuizCard';
import SwipeableOption, { OptionState } from '../components/SwipeableOption';
import { GameMode, QuizQuestion, SRSStore, VocabWord } from '../types';
import { buildStudyQueue, getOrCreateSRSData, updateAfterAnswer } from '../services/srsEngine';
import { loadSRSStore, saveSRSStore } from '../services/storageService';

interface QuizScreenProps {
  words: VocabWord[]; // already filtered by tier / category
  mode: GameMode;
  onExit: () => void;
}

const OPTIONS_PER_QUESTION = 3;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestion(pool: VocabWord[], correctWord: VocabWord, mode: GameMode): QuizQuestion {
  const distractorPool = pool.filter((w) => w.id !== correctWord.id);
  const distractors = shuffled(distractorPool).slice(0, OPTIONS_PER_QUESTION - 1);
  const options = shuffled([
    { word: correctWord, isCorrect: true },
    ...distractors.map((w) => ({ word: w, isCorrect: false })),
  ]);
  return { prompt: correctWord, options, mode };
}

export default function QuizScreen({ words, mode, onExit }: QuizScreenProps) {
  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Initial load
  useEffect(() => {
    (async () => {
      const store = await loadSRSStore();
      setSrsStore(store);
      const builtQueue = buildStudyQueue(words, store);
      setQueue(builtQueue);
      setQueueIndex(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  // Advance question whenever the queue/index changes
  useEffect(() => {
    if (queue.length === 0) return;
    if (queueIndex >= queue.length) return;
    const current = queue[queueIndex];
    setQuestion(buildQuestion(words, current, mode));
    setOptionStates({});
    setAnswered(false);
  }, [queue, queueIndex, words, mode]);

  const handleSelect = useCallback(
    async (optionWord: VocabWord, isCorrect: boolean) => {
      if (!question || answered) return;
      setAnswered(true);

      if (isCorrect) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      const nextStates: Record<string, OptionState> = {};
      for (const opt of question.options) {
        if (opt.word.id === optionWord.id) {
          nextStates[opt.word.id] = isCorrect ? 'correct' : 'incorrect';
        } else if (opt.isCorrect) {
          nextStates[opt.word.id] = 'correct'; // reveal the right answer
        } else {
          nextStates[opt.word.id] = 'disabled';
        }
      }
      setOptionStates(nextStates);
      setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

      // Update SRS for the prompt word being tested
      const existing = getOrCreateSRSData(srsStore, question.prompt.id);
      const updated = updateAfterAnswer(existing, isCorrect);
      const nextStore = { ...srsStore, [question.prompt.id]: updated };
      setSrsStore(nextStore);
      await saveSRSStore(nextStore);

      setTimeout(() => {
        setQueueIndex((i) => i + 1);
      }, 900);
    },
    [question, answered, srsStore]
  );

  const progressLabel = useMemo(() => `${score.correct}/${score.total}`, [score]);

  if (!question) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Loading your queue…</Text>
      </View>
    );
  }

  const isDone = queueIndex >= queue.length;
  if (isDone) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneTitle}>Session complete 🎉</Text>
        <Text style={styles.doneScore}>{progressLabel} correct</Text>
        <Pressable style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const promptIsJapanese = mode === 'jp-to-en';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={10}>
          <Ionicons name="close" size={26} color="#8B85B8" />
        </Pressable>
        <Text style={styles.scoreText}>{progressLabel}</Text>
      </View>

      <QuizCard
        promptText={promptIsJapanese ? question.prompt.japanese : question.prompt.english}
        romajiSubtext={promptIsJapanese ? question.prompt.romaji : undefined}
        japaneseToSpeak={promptIsJapanese ? question.prompt.japanese : undefined}
      />

      <View style={styles.optionsArea}>
        {question.options.map((opt) => (
          <SwipeableOption
            key={opt.word.id}
            label={promptIsJapanese ? opt.word.english : opt.word.japanese}
            romaji={opt.word.romaji}
            state={optionStates[opt.word.id] ?? 'idle'}
            onPress={() => handleSelect(opt.word, opt.isCorrect)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFBFF',
    paddingHorizontal: 20,
    paddingTop: 12,
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
    color: '#8B85B8',
  },
  optionsArea: {
    marginTop: 28,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFBFF',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B85B8',
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2B2B36',
    marginBottom: 8,
  },
  doneScore: {
    fontSize: 17,
    color: '#8B85B8',
    marginBottom: 28,
  },
  exitButton: {
    backgroundColor: '#5A4FCF',
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
