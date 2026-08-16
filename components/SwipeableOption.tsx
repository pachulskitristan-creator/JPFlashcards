// components/SwipeableOption.tsx
// A rectangular multiple-choice option. Tapping the main body selects
// the answer. A small tab on the right edge can be dragged left to
// reveal a Romaji "drawer" without triggering a selection.

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const DRAWER_WIDTH = 96;
const OPEN_THRESHOLD = DRAWER_WIDTH * 0.4;

export type OptionState = 'idle' | 'correct' | 'incorrect' | 'disabled';

interface SwipeableOptionProps {
  label: string;
  romaji: string;
  state: OptionState;
  onPress: () => void;
}

export default function SwipeableOption({ label, romaji, state, onPress }: SwipeableOptionProps) {
  const translateX = useSharedValue(0);
  const drawerOpen = useSharedValue(false);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const triggerHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const base = drawerOpen.value ? -DRAWER_WIDTH : 0;
      const next = base + event.translationX;
      translateX.value = Math.min(0, Math.max(-DRAWER_WIDTH, next));
    })
    .onEnd((event) => {
      const shouldOpen =
        Math.abs(translateX.value) > OPEN_THRESHOLD || event.velocityX < -500;
      translateX.value = withSpring(shouldOpen ? -DRAWER_WIDTH : 0, {
        damping: 18,
        stiffness: 220,
      });
      if (shouldOpen !== drawerOpen.value) {
        drawerOpen.value = shouldOpen;
        runOnJS(triggerHaptic)();
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / DRAWER_WIDTH + 0.15),
  }));

  const stateStyle =
    state === 'correct'
      ? styles.cardCorrect
      : state === 'incorrect'
      ? styles.cardIncorrect
      : styles.cardIdle;

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      {/* Romaji drawer sits behind the card, revealed as the card slides left */}
      <Animated.View style={[styles.drawer, drawerStyle]} pointerEvents="none">
        <Text style={styles.drawerText} numberOfLines={1}>
          {romaji}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.card, stateStyle, cardStyle]}>
        <Pressable
          style={styles.pressableArea}
          onPress={onPress}
          disabled={state === 'disabled' || state === 'correct' || state === 'incorrect'}
          hitSlop={4}
        >
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </Pressable>

        {/* Drag handle / tab indicator */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.tab}>
            <View style={styles.tabDot} />
            <View style={styles.tabDot} />
            <View style={styles.tabDot} />
          </View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 6,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFE8B3',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  drawerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A5200',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    minHeight: 64,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardIdle: {
    borderWidth: 1.5,
    borderColor: '#F0EEF6',
  },
  cardCorrect: {
    borderWidth: 1.5,
    borderColor: '#7ED9A4',
    backgroundColor: '#E8FBF0',
  },
  cardIncorrect: {
    borderWidth: 1.5,
    borderColor: '#F3A6A6',
    backgroundColor: '#FDECEC',
  },
  pressableArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 19,
    fontWeight: '600',
    color: '#2B2B36',
  },
  tab: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#F0EEF6',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9C6D6',
    marginVertical: 2,
  },
});
