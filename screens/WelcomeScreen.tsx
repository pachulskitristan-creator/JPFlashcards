// screens/WelcomeScreen.tsx
// First-launch only (gated by a persisted flag in App.tsx) — the logo
// pops in, then a speech bubble saying "ようこそ" (welcome) springs up
// next to it with a small continuous float, then the CTA fades in.
// Tapping through leads to the existing Login/Sign Up screen.

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import PatternBackground from '../components/PatternBackground';
import { ThemeColors } from '../theme/theme';

interface WelcomeScreenProps {
  colors: ThemeColors;
  onContinue: () => void;
}

export default function WelcomeScreen({ colors, onContinue }: WelcomeScreenProps) {
  const logoScale = useSharedValue(0);
  const bubbleScale = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const bubbleFloat = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 11, stiffness: 140 });
    bubbleOpacity.value = withDelay(350, withTiming(1, { duration: 250 }));
    bubbleScale.value = withDelay(350, withSpring(1, { damping: 9, stiffness: 180 }));
    bubbleFloat.value = withDelay(
      700,
      withRepeat(withSequence(withTiming(-7, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1, true)
    );
    ctaOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }, { translateY: bubbleFloat.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />

      <View style={styles.center}>
        <Animated.View style={[styles.bubble, { backgroundColor: colors.card, shadowColor: colors.shadow }, bubbleStyle]}>
          <Text style={[styles.bubbleText, { color: colors.primary }]}>ようこそ</Text>
          <View style={[styles.bubbleTail, { backgroundColor: colors.card }]} />
        </Animated.View>

        <Animated.View style={logoStyle}>
          <Image
            source={require('../assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>単語カード</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Japanese Flashcards for Travelers</Text>
      </View>

      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <Pressable onPress={onContinue}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, { shadowColor: colors.shadow }]}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const BUBBLE_TAIL_SIZE = 16;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bubble: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 26,
    marginBottom: 22,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -BUBBLE_TAIL_SIZE / 2 + 2,
    left: '50%',
    marginLeft: -BUBBLE_TAIL_SIZE / 2,
    width: BUBBLE_TAIL_SIZE,
    height: BUBBLE_TAIL_SIZE,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  bubbleText: {
    fontSize: 22,
    fontWeight: '800',
  },
  logo: {
    width: 132,
    height: 132,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  cta: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
