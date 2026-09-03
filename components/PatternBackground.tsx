// components/PatternBackground.tsx
// Tiles the seigaiha (wave) pattern as a subtle textured backdrop, with
// a gradient fade at the top and bottom edges so it blends into the
// screen's own background color instead of cutting off hard where the
// tiled image meets a solid-colored container (the hero card, the tab
// bar area, etc). The pattern reads most clearly in the middle of the
// screen and dissolves smoothly at both ends.

import React from 'react';
import { View, ImageBackground, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PatternBackgroundProps {
  opacity?: number;
  /** The screen's own background color (e.g. colors.background) — the fades blend to this. */
  fadeColor: string;
  fadeHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export default function PatternBackground({
  opacity = 0.5,
  fadeColor,
  fadeHeight = 140,
  style,
}: PatternBackgroundProps) {
  const transparentFade = `${fadeColor}00`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ImageBackground
        source={require('../assets/images/adaptive-icon-background.png')}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity }, style]}
      />
      <LinearGradient
        colors={[fadeColor, transparentFade]}
        style={[styles.topFade, { height: fadeHeight }]}
      />
      <LinearGradient
        colors={[transparentFade, fadeColor]}
        style={[styles.bottomFade, { height: fadeHeight * 1.3 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
