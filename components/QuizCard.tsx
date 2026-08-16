// components/QuizCard.tsx
// The top "prompt" card. In jp-to-en mode it shows the Japanese word
// plus its Romaji, with a speaker button to hear native pronunciation.
// In en-to-jp mode it simply shows the English prompt.

import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speakJapanese } from '../services/ttsService';

interface QuizCardProps {
  promptText: string;
  romajiSubtext?: string;
  japaneseToSpeak?: string; // present only when japanese audio is available for this prompt
}

export default function QuizCard({ promptText, romajiSubtext, japaneseToSpeak }: QuizCardProps) {
  const handleSpeak = () => {
    if (japaneseToSpeak) speakJapanese(japaneseToSpeak);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.promptText}>{promptText}</Text>
      {romajiSubtext ? <Text style={styles.romajiText}>{romajiSubtext}</Text> : null}

      {japaneseToSpeak ? (
        <Pressable style={styles.speakerButton} onPress={handleSpeak} hitSlop={10}>
          <Ionicons name="volume-high" size={22} color="#5A4FCF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F2FF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    shadowColor: '#5A4FCF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  promptText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2B2B36',
    textAlign: 'center',
  },
  romajiText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '500',
    color: '#8B85B8',
    textAlign: 'center',
  },
  speakerButton: {
    marginTop: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
