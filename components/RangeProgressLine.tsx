// components/RangeProgressLine.tsx
// A horizontal track with two dots: one fixed at the start (0%), one
// that slides along the line to the current progress position. The
// filled segment between them shows progress at a glance; the dashed-
// looking remainder of the track shows what's left.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

interface RangeProgressLineProps {
  label: string;
  percent: number; // 0-100
  colors: ThemeColors;
}

const DOT_SIZE = 12;

export default function RangeProgressLine({ label, percent, colors }: RangeProgressLineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, percent)) / 100, { duration: 600 });
  }, [percent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.percent, { color: colors.textSecondary }]}>{Math.round(percent)}%</Text>
      </View>
      <View style={styles.trackWrap}>
        <View style={[styles.track, { backgroundColor: colors.border }]} />
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: colors.primary }]} />
        <View style={[styles.dot, styles.startDot, { backgroundColor: colors.primary, borderColor: colors.surface }]} />
        <Animated.View
          style={[styles.dot, dotStyle, { backgroundColor: colors.primary, borderColor: colors.surface }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackWrap: {
    height: DOT_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  fill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    left: 0,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    marginLeft: -(DOT_SIZE / 2),
  },
  startDot: {
    left: 0,
  },
});
