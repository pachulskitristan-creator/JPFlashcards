// components/PatternBackground.tsx
// Tiles the seigaiha (wave) pattern as a subtle textured backdrop.
// The image itself is the semi-transparent layer — rendering it at
// reduced opacity over a screen's own background color lets that
// color "show through" the pattern rather than looking like a flat
// grey overlay sitting on top of the design.

import React from 'react';
import { ImageBackground, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface PatternBackgroundProps {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export default function PatternBackground({ opacity = 0.5, style }: PatternBackgroundProps) {
  return (
    <ImageBackground
      source={require('../assets/images/adaptive-icon-background.png')}
      resizeMode="repeat"
      style={[StyleSheet.absoluteFillObject, { opacity }, style]}
      pointerEvents="none"
    />
  );
}
