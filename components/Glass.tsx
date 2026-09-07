// components/Glass.tsx
// Shared liquid-glass surface: real native iOS 26 glass (expo-glass-effect)
// when available, expo-blur + tint approximation everywhere else. Extracted
// from BottomTabBar so every floating surface (sheets, dropdown triggers,
// buttons) gets the same material instead of a copy of this ternary each.

import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { ThemeColors } from '../theme/theme';

export const glassSupported = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  colors: ThemeColors;
  isDark: boolean;
  tintColor?: string;
  variant?: 'regular' | 'clear';
  isInteractive?: boolean;
  /** Inset "picture-frame" ring for a matte edge, separating the glass from its surroundings. Needs matching borderRadius. */
  matte?: boolean;
  borderRadius?: number;
  /** 0-1. Overrides the variant's default tint opacity (0.8 regular / 0.2 clear) when a surface needs to read as more or less see-through than the shared default. */
  opacityOverride?: number;
  children?: React.ReactNode;
}

export default function GlassSurface({
  style,
  colors,
  isDark,
  tintColor,
  variant = 'regular',
  isInteractive,
  matte,
  borderRadius = 0,
  opacityOverride,
  children,
}: GlassSurfaceProps) {
  // The real GlassView has no intensity/blur-radius knob (only style,
  // tint, colorScheme) — a stronger-hued tint at real alpha is the only
  // way to make it read as bolder rather than near-invisible. 'clear' is
  // already the lighter/more see-through system material, so pair it
  // with a lighter tint too, or it ends up just as opaque as 'regular'.
  const defaultOpacity = variant === 'clear' ? 0.2 : 0.8;
  const alphaHex = Math.round((opacityOverride ?? defaultOpacity) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  const boldTint = `${tintColor ?? colors.card}${alphaHex}`;

  return (
    <View style={style}>
      {glassSupported ? (
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle={variant}
          tintColor={boldTint}
          colorScheme={isDark ? 'dark' : 'light'}
          isInteractive={isInteractive}
        />
      ) : (
        <>
          <BlurView
            intensity={variant === 'clear' ? 100 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: boldTint,
                opacity: (variant === 'clear' ? 0.1 : 0.3) * ((opacityOverride ?? defaultOpacity) / defaultOpacity),
              },
            ]}
          />
        </>
      )}
      {matte ? (
        <View
          pointerEvents="none"
          style={[
            styles.matte,
            {
              borderRadius: Math.max(0, borderRadius - 1.5),
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  matte: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderWidth: 1,
  },
});
