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

import React, { useRef } from 'react';
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
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';
import GlassSurface from './Glass';

export type TabKey = 'home' | 'statistics' | 'vault' | 'typeit' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const TABS: TabDef[] = [
  { key: 'home', label: 'Study', icon: 'home-outline', activeIcon: 'home' },
  { key: 'typeit', label: 'Type It', icon: 'create-outline', activeIcon: 'create' },
  { key: 'statistics', label: 'Stats', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { key: 'vault', label: 'Vault', icon: 'file-tray-stacked-outline', activeIcon: 'file-tray-stacked' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

/** Tabs that switch to real pages in the swipeable pager. "typeit" instead launches a full-screen session, like Quiz/Quick Play. */
export const PAGER_TABS: TabKey[] = ['home', 'statistics', 'vault', 'settings'];

export const TAB_BAR_CONTENT_HEIGHT = 60;
const PILL_MARGIN = 16;
// Pill-shaped, not a circle: wider than tall, fully rounded ends.
const LENS_WIDTH = 96;
const LENS_HEIGHT = 64;
// Matches the tab icons' own vertical center within the 60px pill
// (icon + gap + label, centered) — was set too high before, floating
// the bubble mostly above the bar instead of sitting on it.
const LENS_CENTER_Y = 22;
const LENS_OVERHANG = 12;

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
  // "typeit" launches a full-screen session rather than switching a
  // page — committing it mid-drag (like every other tab does) yanks
  // the screen away before the user can keep dragging past it toward
  // Settings. So it's held pending and only fires on release.
  const pendingTypeIt = useRef(false);

  const onLayout = (e: LayoutChangeEvent) => {
    pillWidth.value = e.nativeEvent.layout.width;
  };

  const selectFromX = (x: number) => {
    if (!pillWidth.value) return;
    const index = Math.max(0, Math.min(TABS.length - 1, Math.floor((x / pillWidth.value) * TABS.length)));
    const tab = TABS[index];

    if (tab.key === 'typeit') {
      if (!pendingTypeIt.current) Haptics.selectionAsync().catch(() => {});
      pendingTypeIt.current = true;
      return;
    }
    pendingTypeIt.current = false;

    if (tab.key !== activeTab) {
      Haptics.selectionAsync().catch(() => {});
      onSelectTab(tab.key);
    }
  };

  const commitPendingTypeIt = () => {
    if (pendingTypeIt.current) {
      pendingTypeIt.current = false;
      onSelectTab('typeit');
    }
  };

  // 1:1 with the finger, not snapped to each tab's center — direct
  // manipulation (touch and content move together, no spring while
  // actively dragging) is what makes it feel glued to the finger
  // instead of hopping discretely between tabs. Selection (which tab
  // is highlighted/committed) is still discrete, via selectFromX below —
  // only the bubble's own position tracks continuously.
  const clampLensX = (x: number) => {
    'worklet';
    return Math.max(-LENS_OVERHANG, Math.min(pillWidth.value - LENS_WIDTH + LENS_OVERHANG, x - LENS_WIDTH / 2));
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      lensX.value = clampLensX(e.x);
      lensOpacity.value = withTiming(1, { duration: 100 });
      // A little past 1 — reads as the glass zooming in on grab, not just fading in.
      lensScale.value = withSpring(1.15, { damping: 14, stiffness: 260 });
      runOnJS(selectFromX)(e.x);
    })
    .onUpdate((e) => {
      lensX.value = clampLensX(e.x);
      runOnJS(selectFromX)(e.x);
    })
    .onFinalize(() => {
      lensOpacity.value = withTiming(0, { duration: 150 });
      lensScale.value = withTiming(0.6, { duration: 150 });
      runOnJS(commitPendingTypeIt)();
    });

  const lensStyle = useAnimatedStyle(() => ({
    opacity: lensOpacity.value,
    transform: [{ translateX: lensX.value }, { scale: lensScale.value }],
  }));

  // The lens window itself moves (translateX(lensX)); this strip is a
  // child of that moving, clipped window and counter-shifts by -lensX,
  // so the NET transform is zero — the enlarged icons stay glued to
  // their real, natural position in the row (verified: (i+0.5)*cellWidth
  // for icon i, same formula the real row below uses). The window
  // moving + the content canceling that movement is what makes whatever
  // icon is under the window appear magnified in place, like a loupe.
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
            {/* More transparent than the shared default (0.8 -> 0.5 opacity). */}
            <GlassSurface
              style={StyleSheet.absoluteFill}
              colors={colors}
              isDark={isDark}
              opacityOverride={0.5}
            />
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
            style={[styles.lens, { top: LENS_CENTER_Y - LENS_HEIGHT / 2 }, lensStyle]}
            pointerEvents="none"
          >
            <View style={styles.lensClip}>
              <GlassSurface style={StyleSheet.absoluteFill} colors={colors} isDark={isDark} variant="clear" isInteractive />
              <Animated.View style={[styles.lensStrip, stripStyle]}>
                {TABS.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <View key={tab.key} style={styles.lensStripCell}>
                      <Ionicons
                        name={active ? tab.activeIcon : tab.icon}
                        size={34}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                    </View>
                  );
                })}
              </Animated.View>
            </View>

            {/* Faint prismatic rim — real glass splits light slightly at the edge. */}
            <Svg width={LENS_WIDTH} height={LENS_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <SvgLinearGradient id="chroma" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ff9de2" stopOpacity={0.55} />
                  <Stop offset="50%" stopColor="#ffffff" stopOpacity={0.25} />
                  <Stop offset="100%" stopColor="#9dd4ff" stopOpacity={0.55} />
                </SvgLinearGradient>
              </Defs>
              <Rect
                x={1}
                y={1}
                width={LENS_WIDTH - 2}
                height={LENS_HEIGHT - 2}
                rx={(LENS_HEIGHT - 2) / 2}
                ry={(LENS_HEIGHT - 2) / 2}
                stroke="url(#chroma)"
                strokeWidth={2}
                fill="none"
              />
            </Svg>
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
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
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
    width: LENS_WIDTH,
    height: LENS_HEIGHT,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  lensClip: {
    flex: 1,
    borderRadius: LENS_HEIGHT / 2,
    overflow: 'hidden',
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
