// components/CircularProgress.tsx
// SVG-based circular progress ring with an animated sweep and a
// centered label. Requires react-native-svg (npx expo install react-native-svg).

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { ThemeColors } from '../theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  colors: ThemeColors;
  centerLabel: string;
  centerSublabel?: string;
}

export default function CircularProgress({
  percent,
  size = 168,
  strokeWidth = 16,
  colors,
  centerLabel,
  centerSublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percent / 100, { duration: 800 });
  }, [percent]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.centerContent}>
          <Text style={[styles.centerLabel, { color: colors.textPrimary }]}>{centerLabel}</Text>
          {centerSublabel ? (
            <Text style={[styles.centerSublabel, { color: colors.textSecondary }]}>{centerSublabel}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 32,
    fontWeight: '800',
  },
  centerSublabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
