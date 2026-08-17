// components/AchievementUnlockOverlay.tsx
// Shows achievements one at a time from a queue, with a spring-in
// scale + fade animation. Tapping "Nice!" advances to the next one
// in the queue, or dismisses entirely if the queue is empty.

import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ACHIEVEMENTS } from '../data/achievements';
import { ThemeColors } from '../theme/theme';

interface AchievementUnlockOverlayProps {
  queue: string[];
  onDismissOne: () => void;
  colors: ThemeColors;
}

export default function AchievementUnlockOverlay({
  queue,
  onDismissOne,
  colors,
}: AchievementUnlockOverlayProps) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const currentId = queue[0];
  const achievement = ACHIEVEMENTS.find((a) => a.id === currentId);

  useEffect(() => {
    if (currentId) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 250 });
    }
  }, [currentId]);

  if (!achievement) return null;

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name={achievement.icon as any} size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.unlockedLabel, { color: colors.primary }]}>
            Achievement Unlocked
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{achievement.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {achievement.description}
          </Text>
          <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onDismissOne}>
            <Text style={styles.buttonText}>Nice!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,15,25,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unlockedLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
