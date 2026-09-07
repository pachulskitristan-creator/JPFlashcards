// components/DailyLimitScreen.tsx
// Shown by Quiz/Quick Play/Type It in place of the next card once a
// free-tier user hits FREE_DAILY_CARD_LIMIT cards for the day. Pro
// accounts never see this — each screen skips the check entirely via
// usePurchases().isPro.

import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/theme';
import { FREE_DAILY_CARD_LIMIT } from '../services/gamificationService';

interface DailyLimitScreenProps {
  colors: ThemeColors;
  onExit: () => void;
  onUpgrade: () => void;
}

export default function DailyLimitScreen({ colors, onExit, onUpgrade }: DailyLimitScreenProps) {
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Image source={require('../assets/images/adaptive-icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Daily limit reached</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        You've studied {FREE_DAILY_CARD_LIMIT} cards today — nice work! Your streak is safe. Come back tomorrow for
        more, or go Pro for unlimited daily practice.
      </Text>

      <Pressable onPress={onUpgrade} style={styles.upgradeWrap}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.upgradeButton, { shadowColor: colors.shadow }]}
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.exitButton} onPress={onExit}>
        <Text style={[styles.exitButtonText, { color: colors.textSecondary }]}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 20,
    opacity: 0.9,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  upgradeWrap: {
    width: '100%',
    marginBottom: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 16,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  exitButton: {
    paddingVertical: 10,
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
