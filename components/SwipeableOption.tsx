// components/SwipeableOption.tsx
// Same interaction model as before (full-card tap/swipe for Japanese
// options, plain tap for English options, static touch-area fix for
// reliable tap-anywhere-to-close) — now theme-aware.

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import JapaneseText from './JapaneseText';
import { ThemeColors } from '../theme/theme';

export type OptionState = 'idle' | 'correct' | 'incorrect' | 'disabled';

interface SwipeableOptionProps {
  label: string;
  romaji: string;
  state: OptionState;
  onPress: () => void;
  isJapaneseLabel?: boolean;
  reading?: string;
  colors: ThemeColors;
}

const OPEN_RATIO = 0.88;

export default function SwipeableOption({
  label,
  romaji,
  state,
  onPress,
  isJapaneseLabel = false,
  reading,
  colors,
}: SwipeableOptionProps) {
  const isInteractive = state === 'idle';

  const stateStyle =
    state === 'correct'
      ? { borderColor: colors.success, backgroundColor: colors.successBg }
      : state === 'incorrect'
      ? { borderColor: colors.error, backgroundColor: colors.errorBg }
      : { borderColor: colors.border, backgroundColor: colors.surface };

  // ---- English options: no swipe at all, just a plain tappable card ----
  if (!isJapaneseLabel) {
    return (
      <View style={styles.wrapper}>
        <Pressable
          style={[styles.card, stateStyle]}
          onPress={onPress}
          disabled={!isInteractive}
          hitSlop={4}
        >
          <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={2}>
            {label}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---- Japanese options: swipe-to-reveal-romaji, tap-anywhere-to-close ----
  const translateX = useSharedValue(0);
  const drawerOpen = useSharedValue(false);
  const cardWidth = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = React.useState(0);

  useEffect(() => {
    if (measuredWidth > 0) cardWidth.value = measuredWidth;
  }, [measuredWidth]);

  useEffect(() => {
    if (!isInteractive) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
      drawerOpen.value = false;
    }
  }, [isInteractive]);

  const onLayout = (e: LayoutChangeEvent) => setMeasuredWidth(e.nativeEvent.layout.width);

  const triggerHaptic = () => Haptics.selectionAsync().catch(() => {});
  const triggerPress = () => onPress();
  const closeDrawer = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
    drawerOpen.value = false;
  };

  const tapGesture = Gesture.Tap()
    .maxDistance(14)
    .enabled(isInteractive)
    .onEnd(() => {
      if (drawerOpen.value) {
        runOnJS(closeDrawer)();
      } else {
        runOnJS(triggerPress)();
      }
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .enabled(isInteractive)
    .onUpdate((event) => {
      const maxOpen = -cardWidth.value * OPEN_RATIO;
      const base = drawerOpen.value ? maxOpen : 0;
      const next = base + event.translationX;
      translateX.value = Math.min(0, Math.max(maxOpen, next));
    })
    .onEnd((event) => {
      const maxOpen = -cardWidth.value * OPEN_RATIO;
      const draggedFar =
        Math.abs(translateX.value - (drawerOpen.value ? maxOpen : 0)) > Math.abs(maxOpen) * 0.15;
      const fastFlick = Math.abs(event.velocityX) > 400;
      const shouldToggle = draggedFar || fastFlick;
      const shouldOpen = shouldToggle ? !drawerOpen.value : drawerOpen.value;

      translateX.value = withSpring(shouldOpen ? maxOpen : 0, {
        damping: 20,
        stiffness: 250,
      });
      if (shouldOpen !== drawerOpen.value) {
        drawerOpen.value = shouldOpen;
        runOnJS(triggerHaptic)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backLayerStyle = useAnimatedStyle(() => {
    const maxOpen = cardWidth.value * OPEN_RATIO || 1;
    return { opacity: Math.min(1, Math.abs(translateX.value) / maxOpen) };
  });

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Animated.View style={[styles.backLayer, { backgroundColor: colors.card }, backLayerStyle]} pointerEvents="none">
        <Text
          style={[styles.romajiText, { color: colors.primary }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {romaji}
        </Text>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <View style={styles.touchArea}>
          <Animated.View style={[styles.card, stateStyle, frontStyle]}>
            <View style={styles.japaneseLabelWrap}>
              <JapaneseText text={label} reading={reading} fontSize={19} numberOfLines={2} color={colors.textPrimary} />
            </View>
            <View style={styles.hint} pointerEvents="none">
              <View style={[styles.hintDot, { backgroundColor: colors.border }]} />
              <View style={[styles.hintDot, { backgroundColor: colors.border }]} />
              <View style={[styles.hintDot, { backgroundColor: colors.border }]} />
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 6,
  },
  backLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  romajiText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    minHeight: 64,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  touchArea: {
    width: '100%',
    minHeight: 64,
  },
  label: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  japaneseLabelWrap: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  hint: {
    paddingRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginVertical: 1.5,
  },
});
