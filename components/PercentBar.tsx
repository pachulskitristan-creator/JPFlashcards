// components/PercentBar.tsx
// A plain horizontal bar chart row — used on the Progress screen for
// "% known" per range. No chart library needed, just an animated width.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

interface PercentBarProps {
  label: string;
  percent: number; // 0-100
  colors: ThemeColors;
  barColor?: string;
}

export default function PercentBar({ label, percent, colors, barColor }: PercentBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percent / 100, { duration: 600 });
  }, [percent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, progress.value * 100)}%`,
  }));

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.fill, fillStyle, { backgroundColor: barColor ?? colors.primary }]}
        />
      </View>
      <Text style={[styles.percentText, { color: colors.textPrimary }]}>{Math.round(percent)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  label: {
    width: 76,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  percentText: {
    width: 40,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});
