// components/RangeSlider.tsx
// Dual-handle slider across 1–6000, snapping to 500-word increments
// as you drag (1, 500, 1000, 1500, ... 6000) rather than any free
// value — there's no meaningful difference between "523" and "500"
// for this app, and snapping makes the intent ("pick some ranges of
// 500") much clearer to use. The dot jumps notch-to-notch during the
// drag itself (not just on release), with a light haptic tick each
// time it lands on a new notch.
//
// Both handles stay bounded so they can never land on the same notch
// or cross each other — the minimum gap is enforced in snap-point
// space (one full step), not an arbitrary pixel/value distance.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';

interface RangeSliderProps {
  min: number;
  max: number;
  startValue: number;
  endValue: number;
  onChangeEnd: (start: number, end: number) => void;
  colors: ThemeColors;
}

const DOT_SIZE = 24;
const SNAP_STEP = 500;

function valueToPxWorklet(v: number, min: number, max: number, innerWidth: number): number {
  'worklet';
  return ((v - min) / (max - min)) * innerWidth;
}

/**
 * Finds the nearest snap point's INDEX (unrestricted) — bounds are then
 * enforced as index comparisons by the caller, not pixel-distance math.
 * The snap grid isn't uniform (the first gap, min→first-step, is
 * shorter than the rest whenever min isn't itself a multiple of the
 * step), so a pixel-space "one step wide" bound check can land between
 * two real snap points and silently exclude a valid one. Index space
 * can't have that class of bug — it's just integers.
 */
function findNearestSnapIndexWorklet(px: number, snapPxList: number[]): number {
  'worklet';
  let nearestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < snapPxList.length; i++) {
    const dist = Math.abs(px - snapPxList[i]);
    if (dist < bestDist) {
      bestDist = dist;
      nearestIdx = i;
    }
  }
  return nearestIdx;
}

function getSnapValues(min: number, max: number, step: number): number[] {
  const points = [min];
  let v = Math.ceil(min / step) * step;
  if (v === min) v += step;
  for (; v <= max; v += step) points.push(v);
  if (points[points.length - 1] !== max) points.push(max);
  return points;
}

export default function RangeSlider({
  min,
  max,
  startValue,
  endValue,
  onChangeEnd,
  colors,
}: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [liveStart, setLiveStart] = useState(startValue);
  const [liveEnd, setLiveEnd] = useState(endValue);

  const padding = DOT_SIZE / 2;
  const innerWidth = Math.max(1, trackWidth - padding * 2);

  const snapValues = useMemo(() => getSnapValues(min, max, SNAP_STEP), [min, max]);
  const snapPxList = useMemo(
    () => snapValues.map((v) => valueToPxWorklet(v, min, max, innerWidth)),
    [snapValues, min, max, innerWidth]
  );

  const startPx = useSharedValue(0);
  const endPx = useSharedValue(0);
  const startIndex = useSharedValue(0);
  const endIndex = useSharedValue(snapValues.length - 1);
  const startBase = useSharedValue(0);
  const endBase = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const triggerHaptic = () => Haptics.selectionAsync().catch(() => {});

  const nearestIndexForValue = (value: number) => {
    let nearest = 0;
    let bestDist = Infinity;
    for (let i = 0; i < snapValues.length; i++) {
      const dist = Math.abs(value - snapValues[i]);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    return nearest;
  };

  useEffect(() => {
    if (trackWidth > 0) {
      const si = nearestIndexForValue(startValue);
      const ei = nearestIndexForValue(endValue);
      startIndex.value = si;
      endIndex.value = ei;
      startPx.value = snapPxList[si];
      endPx.value = snapPxList[ei];
      setLiveStart(snapValues[si]);
      setLiveEnd(snapValues[ei]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth, startValue, endValue, snapPxList]);

  const startGesture = Gesture.Pan()
    .onBegin(() => {
      startBase.value = startPx.value;
    })
    .onUpdate((e) => {
      const raw = startBase.value + e.translationX;
      let idx = findNearestSnapIndexWorklet(raw, snapPxList);
      idx = Math.max(0, Math.min(idx, endIndex.value - 1));
      startPx.value = snapPxList[idx];
      if (idx !== startIndex.value) {
        startIndex.value = idx;
        runOnJS(triggerHaptic)();
      }
      runOnJS(setLiveStart)(snapValues[idx]);
    })
    .onEnd(() => {
      runOnJS(onChangeEnd)(snapValues[startIndex.value], snapValues[endIndex.value]);
    });

  const endGesture = Gesture.Pan()
    .onBegin(() => {
      endBase.value = endPx.value;
    })
    .onUpdate((e) => {
      const raw = endBase.value + e.translationX;
      let idx = findNearestSnapIndexWorklet(raw, snapPxList);
      idx = Math.min(snapValues.length - 1, Math.max(idx, startIndex.value + 1));
      endPx.value = snapPxList[idx];
      if (idx !== endIndex.value) {
        endIndex.value = idx;
        runOnJS(triggerHaptic)();
      }
      runOnJS(setLiveEnd)(snapValues[idx]);
    })
    .onEnd(() => {
      runOnJS(onChangeEnd)(snapValues[startIndex.value], snapValues[endIndex.value]);
    });

  const fillStyle = useAnimatedStyle(() => ({
    left: padding + startPx.value,
    width: Math.max(0, endPx.value - startPx.value),
  }));

  const startDotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startPx.value }],
  }));

  const endDotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endPx.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.valueLabel, { color: colors.primary }]}>{liveStart}</Text>
        <Text style={[styles.valueLabel, { color: colors.primary }]}>{liveEnd}</Text>
      </View>

      <View style={styles.trackWrap} onLayout={onLayout}>
        <View
          style={[styles.track, { backgroundColor: colors.border, left: padding, right: padding }]}
        />
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: colors.primary }]} />

        <GestureDetector gesture={startGesture}>
          <Animated.View
            style={[
              styles.dot,
              startDotStyle,
              { left: padding - DOT_SIZE / 2, backgroundColor: colors.primary, borderColor: colors.surface },
            ]}
          />
        </GestureDetector>

        <GestureDetector gesture={endGesture}>
          <Animated.View
            style={[
              styles.dot,
              endDotStyle,
              { left: padding - DOT_SIZE / 2, backgroundColor: colors.primary, borderColor: colors.surface },
            ]}
          />
        </GestureDetector>
      </View>

      <View style={styles.scaleRow}>
        <Text style={[styles.scaleText, { color: colors.textSecondary }]}>{min}</Text>
        <Text style={[styles.scaleText, { color: colors.textSecondary }]}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  trackWrap: {
    height: DOT_SIZE,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    top: (DOT_SIZE - 4) / 2,
  },
  fill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    top: (DOT_SIZE - 4) / 2,
  },
  dot: {
    position: 'absolute',
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scaleText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
