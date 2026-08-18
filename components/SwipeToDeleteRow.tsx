// components/SwipeToDeleteRow.tsx
// Wraps any row content with swipe-left-to-reveal-delete. Same lesson
// applied here as in SwipeableOption: the GestureDetector wraps a
// STATIC container so its hit-region never moves, while only the
// visual content inside slides via translateX. Tapping the row while
// open closes it instead of doing nothing (or worse, mis-triggering
// whatever the row's own tap action is).

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';

const DELETE_WIDTH = 84;

interface SwipeToDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  colors: ThemeColors;
}

export default function SwipeToDeleteRow({ children, onDelete, onPress, colors }: SwipeToDeleteRowProps) {
  const translateX = useSharedValue(0);
  const open = useSharedValue(false);
  const [, setMeasured] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.height);

  const close = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
    open.value = false;
  };
  const triggerHaptic = () => Haptics.selectionAsync().catch(() => {});
  const triggerPress = () => onPress?.();

  const tapGesture = Gesture.Tap()
    .maxDistance(14)
    .onEnd(() => {
      if (open.value) {
        runOnJS(close)();
      } else if (onPress) {
        runOnJS(triggerPress)();
      }
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const base = open.value ? -DELETE_WIDTH : 0;
      const next = base + event.translationX;
      translateX.value = Math.min(0, Math.max(-DELETE_WIDTH, next));
    })
    .onEnd((event) => {
      const shouldOpen = translateX.value < -DELETE_WIDTH * 0.4 || event.velocityX < -500;
      translateX.value = withSpring(shouldOpen ? -DELETE_WIDTH : 0, { damping: 20, stiffness: 250 });
      if (shouldOpen !== open.value) {
        open.value = shouldOpen;
        runOnJS(triggerHaptic)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // FIX: the delete background used to be a plain always-rendered View,
  // relying entirely on the sliding content to visually cover it at
  // rest. That's fragile — any gap in coverage (padding/margin math,
  // a child that doesn't stretch full-width, etc.) lets red bleed
  // through even when nothing has been swiped. Tying opacity directly
  // to swipe progress guarantees it's invisible at rest regardless.
  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / DELETE_WIDTH),
  }));

  const handleDelete = () => {
    translateX.value = withTiming(-500, { duration: 200 });
    setTimeout(onDelete, 180);
  };

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle, { backgroundColor: colors.error }]}>
        <Pressable style={styles.deleteButton} onPress={handleDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <View style={styles.touchArea}>
          <Animated.View style={contentStyle}>{children}</Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    gap: 2,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  touchArea: {
    width: '100%',
  },
});
