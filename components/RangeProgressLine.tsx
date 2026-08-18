// components/RangeProgressLine.tsx
// A horizontal track spanning a literal word-count range (0 to the
// tier's size, e.g. 0–500), with a dot fixed at the start and a
// second dot sliding to the current known-count position. Positions
// are computed in real measured pixels (via onLayout), not percentage
// strings + negative margins — the previous percentage-based approach
// could clip the start dot against the container edge depending on
// context; measuring the actual track width and reserving room for
// the dot radius on both sides guarantees both dots always render
// fully, regardless of where this ends up being used.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

interface RangeProgressLineProps {
  label: string;
  knownCount: number;
  totalCount: number; // e.g. 500 for a standard Vocabulary Range
  colors: ThemeColors;
}

const DOT_SIZE = 14;
const TRACK_HEIGHT = 4;

export default function RangeProgressLine({ label, knownCount, totalCount, colors }: RangeProgressLineProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  const percent = totalCount > 0 ? (knownCount / totalCount) * 100 : 0;
  const clampedFraction = Math.max(0, Math.min(1, totalCount > 0 ? knownCount / totalCount : 0));

  useEffect(() => {
    progress.value = withTiming(clampedFraction, { duration: 600 });
  }, [clampedFraction]);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  // Reserve half a dot's width on each side so a dot at 0% or 100% is
  // never clipped by the row's own edges.
  const padding = DOT_SIZE / 2;
  const innerWidth = Math.max(0, trackWidth - padding * 2);

  const fillStyle = useAnimatedStyle(() => ({
    width: innerWidth * progress.value,
  }));

  const movingDotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: innerWidth * progress.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.percent, { color: colors.textSecondary }]}>
          {knownCount}/{totalCount} · {Math.round(percent)}%
        </Text>
      </View>

      <View style={styles.trackWrap} onLayout={onLayout}>
        <View
          style={[
            styles.track,
            { backgroundColor: colors.border, left: padding, right: padding },
          ]}
        />
        <Animated.View
          style={[styles.fill, fillStyle, { backgroundColor: colors.primary, left: padding }]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.primary, borderColor: colors.surface, left: padding - DOT_SIZE / 2 },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            movingDotStyle,
            { backgroundColor: colors.primary, borderColor: colors.surface, left: padding - DOT_SIZE / 2 },
          ]}
        />
      </View>

      <View style={styles.scaleRow}>
        <Text style={[styles.scaleText, { color: colors.textSecondary }]}>0</Text>
        <Text style={[styles.scaleText, { color: colors.textSecondary }]}>{totalCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    top: (DOT_SIZE - TRACK_HEIGHT) / 2,
  },
  fill: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    top: (DOT_SIZE - TRACK_HEIGHT) / 2,
  },
  dot: {
    position: 'absolute',
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
