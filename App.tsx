// App.tsx
// Root component. Keeps navigation intentionally simple (a two-screen
// state machine) since the app's complexity lives in the quiz mechanics,
// not in routing.

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import CustomVocabManager from './components/CustomVocabManager';

import { VOCAB_DATABASE } from './data/vocabDatabase';
import { loadCustomVocab } from './services/storageService';
import { FrequencyTier, GameMode, VocabWord } from './types';

type Screen = 'home' | 'quiz';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [vocabManagerVisible, setVocabManagerVisible] = useState(false);

  const [customWords, setCustomWords] = useState<VocabWord[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<FrequencyTier[]>([1]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>('en-to-jp');

  useEffect(() => {
    loadCustomVocab().then(setCustomWords);
  }, []);

  const allWords = useMemo(() => [...VOCAB_DATABASE, ...customWords], [customWords]);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(w.tier);
      const categoryMatch =
        selectedCategories.length === 0 ||
        w.categories.some((c) => selectedCategories.includes(c));
      return tierMatch && categoryMatch;
    });
  }, [allWords, selectedTiers, selectedCategories]);

  const toggleTier = (tier: FrequencyTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <StatusBar style="dark" />

          {screen === 'home' ? (
            <HomeScreen
              selectedTiers={selectedTiers}
              onToggleTier={toggleTier}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              mode={mode}
              onSetMode={setMode}
              wordCount={filteredWords.length}
              onStart={() => setScreen('quiz')}
              onOpenVocabManager={() => setVocabManagerVisible(true)}
            />
          ) : (
            <QuizScreen
              words={filteredWords}
              mode={mode}
              onExit={() => setScreen('home')}
            />
          )}

          <CustomVocabManager
            visible={vocabManagerVisible}
            onClose={() => setVocabManagerVisible(false)}
            onChanged={setCustomWords}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFBFF',
  },
});
