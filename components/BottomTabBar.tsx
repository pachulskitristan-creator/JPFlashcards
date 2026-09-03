// components/BottomTabBar.tsx
// Floating glass pill (Apple Music / TikTok / Instagram style), inset
// from the edges, over full-bleed content — not a flat edge-to-edge
// Android-style bar. Real native iOS 26 Liquid Glass (expo-glass-effect)
// when available, expo-blur approximation elsewhere. Selection works
// two ways: a plain tap, or a press-and-drag across the pill that
// switches tabs live as your finger crosses each one, with a floating
// glass "lens" bubble that follows the finger and magnifies whichever
// icon is underneath — the same loupe effect Apple Music's real
// Liquid Glass tab bar does when you drag across it.

import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';
import GlassSurface from './Glass';

export type TabKey = 'home' | 'statistics' | 'tags' | 'achievements' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const TABS: TabDef[] = [
  { key: 'home', label: 'Study', icon: 'home-outline', activeIcon: 'home' },
  { key: 'statistics', label: 'Stats', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { key: 'tags', label: 'Tags', icon: 'folder-outline', activeIcon: 'folder' },
  { key: 'achievements', label: 'Awards', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

export const TAB_BAR_CONTENT_HEIGHT = 60;
const PILL_MARGIN = 16;
const LENS_SIZE = 60;
const LENS_CENTER_Y = 22;

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  colors: ThemeColors;
  isDark: boolean;
}

export default function BottomTabBar({ activeTab, onSelectTab, colors, isDark }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const pillWidth = useSharedValue(0);
  const lensX = useSharedValue(0);
  const lensOpacity = useSharedValue(0);
  const lensScale = useSharedValue(0.6);

  const onLayout = (e: LayoutChangeEvent) => {
    pillWidth.value = e.nativeEvent.layout.width;
  };

  const selectFromX = (x: number) => {
    if (!pillWidth.value) return;
    const index = Math.max(0, Math.min(TABS.length - 1, Math.floor((x / pillWidth.value) * TABS.length)));
    const tab = TABS[index];
    if (tab.key !== activeTab) {
      Haptics.selectionAsync().catch(() => {});
      onSelectTab(tab.key);
    }
  };

  const clampLensX = (x: number) => {
    'worklet';
    return Math.max(0, Math.min(pillWidth.value - LENS_SIZE, x - LENS_SIZE / 2));
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      lensX.value = clampLensX(e.x);
      lensOpacity.value = withTiming(1, { duration: 100 });
      lensScale.value = withSpring(1, { damping: 14, stiffness: 260 });
      runOnJS(selectFromX)(e.x);
    })
    .onUpdate((e) => {
      lensX.value = clampLensX(e.x);
      runOnJS(selectFromX)(e.x);
    })
    .onFinalize(() => {
      lensOpacity.value = withTiming(0, { duration: 150 });
      lensScale.value = withTiming(0.6, { duration: 150 });
    });

  const lensStyle = useAnimatedStyle(() => ({
    opacity: lensOpacity.value,
    transform: [{ translateX: lensX.value }, { scale: lensScale.value }],
  }));

  // The lens is a fixed circular window; the strip behind it holds every
  // icon laid out exactly like the real tab row and slides opposite to
  // the lens's own position, so whatever the finger is over appears
  // centered — same idea as looking through a magnifying loupe at the
  // row underneath. Purely UI-thread (no React state), so it can't lag.
  const stripStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    transform: [{ translateX: -lensX.value }],
  }));

  return (
    <View
      style={[styles.outerWrap, { paddingBottom: insets.bottom + 10 }]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.pill, { height: TAB_BAR_CONTENT_HEIGHT }]} onLayout={onLayout}>
          <View style={[StyleSheet.absoluteFill, styles.pillClip]}>
            <GlassSurface style={StyleSheet.absoluteFill} colors={colors} isDark={isDark} />
            <View
              style={[
                styles.hairline,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.65)' },
              ]}
            />
          </View>

          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <View key={tab.key} style={styles.tab} pointerEvents="none">
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={22}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.label, { color: active ? colors.primary : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </View>
            );
          })}

          <Animated.View
            style={[styles.lens, { top: LENS_CENTER_Y - LENS_SIZE / 2 }, lensStyle]}
            pointerEvents="none"
          >
            <GlassSurface
              style={StyleSheet.absoluteFill}
              colors={colors}
              isDark={isDark}
              tintColor={colors.primary}
              variant="clear"
              isInteractive
            />
            <Animated.View style={[styles.lensStrip, stripStyle]}>
              {TABS.map((tab) => (
                <View key={tab.key} style={styles.lensStripCell}>
                  <Ionicons name={tab.activeIcon} size={26} color={colors.primary} />
                </View>
              ))}
            </Animated.View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PILL_MARGIN,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: TAB_BAR_CONTENT_HEIGHT / 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pillClip: {
    borderRadius: TAB_BAR_CONTENT_HEIGHT / 2,
    overflow: 'hidden',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  lens: {
    position: 'absolute',
    left: 0,
    width: LENS_SIZE,
    height: LENS_SIZE,
    borderRadius: LENS_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  lensStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  lensStripCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
