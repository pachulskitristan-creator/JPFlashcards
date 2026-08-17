// components/XPBar.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { getLevel, getXPIntoLevel } from '../services/gamificationService';
import { ThemeColors } from '../theme/theme';

interface XPBarProps {
  xp: number;
  colors: ThemeColors;
  label?: string;
}

export default function XPBar({ xp, colors, label }: XPBarProps) {
  const level = getLevel(xp);
  const { current, needed } = getXPIntoLevel(xp);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(current / needed, { duration: 600 });
  }, [current, needed]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, progress.value * 100)}%`,
  }));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={styles.container}>
        <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.fill, barStyle, { backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.xpText, { color: colors.textSecondary }]}>
          {current}/{needed} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
