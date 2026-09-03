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
  children?: React.ReactNode;
}

export default function GlassSurface({
  style,
  colors,
  isDark,
  tintColor,
  variant = 'regular',
  isInteractive,
  children,
}: GlassSurfaceProps) {
  return (
    <View style={style}>
      {glassSupported ? (
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle={variant}
          tintColor={tintColor ?? colors.surface}
          isInteractive={isInteractive}
        />
      ) : (
        <>
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: tintColor ?? colors.surface, opacity: 0.18 },
            ]}
          />
        </>
      )}
      {children}
    </View>
  );
}
