// components/RollBadge.tsx
// The Duolingo-streak equivalent, named "Roll" per the request — puns
// scale with the streak length. Bounces via a spring-like sequence
// whenever `justIncreased` flips true (fired once from QuizScreen
// right after a session completes and the streak actually ticks up).

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

interface RollBadgeProps {
  rollCount: number;
  justIncreased?: boolean;
  colors: ThemeColors;
}

function rollMessage(count: number): string {
  if (count <= 0) return 'Start your roll today';
  if (count < 3) return `On a roll! (${count})`;
  if (count < 7) return `Rolling strong (${count})`;
  if (count < 30) return `Unstoppable roll (${count})`;
  return `Legendary roll (${count})`;
}

export default function RollBadge({ rollCount, justIncreased, colors }: RollBadgeProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (justIncreased) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 180 }),
        withTiming(1, { duration: 220 })
      );
    }
  }, [justIncreased]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.card }, animatedStyle]}
    >
      <Ionicons name="flame" size={18} color={colors.accentRed} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{rollMessage(rollCount)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    fontSize: 13,
  },
});
