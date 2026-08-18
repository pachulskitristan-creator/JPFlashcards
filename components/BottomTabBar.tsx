// components/BottomTabBar.tsx
// Floating pill-shaped tab bar with a real frosted-glass blur behind
// it (expo-blur's BlurView), approximating the "Liquid Glass" material
// look — a true dynamic light-refraction effect is an iOS system-level
// rendering feature we can't replicate exactly in JS, but a blurred,
// semi-translucent, fully-rounded pill with a soft highlight border
// gets close. Sits in normal document flow with horizontal margins
// (not touching the screen edges) rather than absolute-positioned
// floating, so it doesn't require guessing safe bottom-padding math
// for the scrollable content above it.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';

export type TabKey = 'home' | 'statistics' | 'tags' | 'achievements' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDef[] = [
  { key: 'home', label: 'Study', icon: 'home-outline', activeIcon: 'home' },
  { key: 'statistics', label: 'Stats', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { key: 'tags', label: 'Tags', icon: 'folder-outline', activeIcon: 'folder' },
  { key: 'achievements', label: 'Awards', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  colors: ThemeColors;
  isDark: boolean;
}

export default function BottomTabBar({ activeTab, onSelectTab, colors, isDark }: BottomTabBarProps) {
  return (
    <View style={styles.outerWrap}>
      <View style={[styles.pill, { borderColor: colors.border }]}>
        <BlurView
          intensity={65}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface, opacity: 0.35 }]} />

        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => {
                if (!active) Haptics.selectionAsync().catch(() => {});
                onSelectTab(tab.key);
              }}
            >
              {active ? (
                <View style={[styles.activeHighlight, { backgroundColor: colors.primary + '26' }]} />
              ) : null}
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={21}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.label, { color: active ? colors.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const PILL_HEIGHT = 64;

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 6,
  },
  pill: {
    flexDirection: 'row',
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeHighlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: (PILL_HEIGHT - 12) / 2,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
