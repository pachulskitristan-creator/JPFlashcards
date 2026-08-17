// components/QuizCard.tsx
// The top "prompt" card, now theme-aware (colors prop from the caller's
// useTheme()). Same flip-to-reveal-romaji behavior as before.

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { speakJapanese } from '../services/ttsService';
import JapaneseText from './JapaneseText';
import { ThemeColors } from '../theme/theme';

interface QuizCardProps {
  promptText: string;
  romajiSubtext?: string;
  japaneseToSpeak?: string;
  reading?: string;
  isJapanesePrompt?: boolean;
  colors: ThemeColors;
  onOpenTagEditor?: () => void;
  onMarkKnown?: () => void;
  isKnown?: boolean;
}

const FLIP_DURATION = 420;

export default function QuizCard({
  promptText,
  romajiSubtext,
  japaneseToSpeak,
  reading,
  isJapanesePrompt = false,
  colors,
  onOpenTagEditor,
  onMarkKnown,
  isKnown = false,
}: QuizCardProps) {
  const rotation = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
    rotation.value = 0;
  }, [promptText]);

  const handleSpeak = () => {
    if (japaneseToSpeak) speakJapanese(japaneseToSpeak);
  };

  const toggleFlip = () => {
    setFlipped((prev) => {
      const next = !prev;
      rotation.value = withTiming(next ? 180 : 0, { duration: FLIP_DURATION });
      return next;
    });
  };

  const tapGesture = Gesture.Tap()
    .maxDistance(14)
    .onEnd(() => {
      runOnJS(toggleFlip)();
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 28 || Math.abs(event.velocityX) > 400) {
        runOnJS(toggleFlip)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      {isJapanesePrompt ? (
        <GestureDetector gesture={composedGesture}>
          <View style={styles.flipZone}>
            <Animated.View style={[styles.face, frontStyle]}>
              <JapaneseText text={promptText} reading={reading} fontSize={30} color={colors.textPrimary} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                tap or swipe for romaji
              </Text>
            </Animated.View>
            <Animated.View style={[styles.face, backStyle]}>
              <Text
                style={[styles.romajiBig, { color: colors.primary }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {romajiSubtext}
              </Text>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                tap or swipe to hide
              </Text>
            </Animated.View>
          </View>
        </GestureDetector>
      ) : (
        <Text style={[styles.promptText, { color: colors.textPrimary }]}>{promptText}</Text>
      )}

      {japaneseToSpeak ? (
        <Pressable
          style={[styles.speakerButton, { backgroundColor: colors.surface }]}
          onPress={handleSpeak}
          hitSlop={10}
        >
          <Ionicons name="volume-high" size={22} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.actionRow}>
        {onOpenTagEditor ? (
          <Pressable style={styles.actionButton} onPress={onOpenTagEditor} hitSlop={8}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Tag</Text>
          </Pressable>
        ) : null}
        {onMarkKnown ? (
          <Pressable style={styles.actionButton} onPress={onMarkKnown} hitSlop={8}>
            <Ionicons
              name={isKnown ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={16}
              color={isKnown ? colors.success : colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: isKnown ? colors.success : colors.textSecondary }]}>
              {isKnown ? 'Known' : 'I know this'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  flipZone: {
    width: '100%',
    minHeight: 76,
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
    fontWeight: '700',
    textAlign: 'center',
  },
  romajiBig: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  speakerButton: {
    marginTop: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
