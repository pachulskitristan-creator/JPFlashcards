// components/JapaneseText.tsx
// Renders a Japanese word with its hiragana reading (furigana) shown
// smaller, directly above it — so a learner can read the word aloud
// without already knowing the kanji.
//
// LIMITATION: this shows the reading for the *whole word*, centered
// above it, rather than aligning each hiragana character over its
// specific kanji character (true per-character furigana, like <ruby>
// in HTML). React Native has no built-in ruby-text layout, and hand-
// building character-aligned furigana requires a kanji/kana boundary
// mapping in the data (e.g. "お|会計" -> "お|かいけい") that the seed
// data doesn't have yet. Whole-word furigana is a reasonable approx-
// imation for short vocabulary words and is far simpler to maintain —
// but if you want precise per-character alignment later, that's the
// data structure change to make.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const KANJI_REGEX = /[\u4E00-\u9FFF]/;

interface JapaneseTextProps {
  text: string;
  reading?: string;
  fontSize?: number;
  furiganaFontSize?: number;
  color?: string;
  numberOfLines?: number;
}

export default function JapaneseText({
  text,
  reading,
  fontSize = 22,
  furiganaFontSize = 12,
  color = '#2B2B36',
  numberOfLines = 2,
}: JapaneseTextProps) {
  const showFurigana = !!reading && reading !== text && KANJI_REGEX.test(text);

  return (
    <View style={styles.container}>
      {showFurigana ? (
        <Text style={[styles.furigana, { fontSize: furiganaFontSize, color }]} numberOfLines={1}>
          {reading}
        </Text>
      ) : null}
      <Text
        style={[styles.main, { fontSize, color }]}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  furigana: {
    fontWeight: '600',
    opacity: 0.65,
    marginBottom: 1,
  },
  main: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
