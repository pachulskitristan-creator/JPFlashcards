// components/BottomTabBar.tsx
// Persistent bottom navigation, Apple-Music-style: icon + label per tab,
// active tab tinted with the theme's primary color. No navigation
// library — this is a plain state switch in App.tsx, kept lightweight
// on purpose given how much dependency friction this project has hit.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
}

export default function BottomTabBar({ activeTab, onSelectTab, colors }: BottomTabBarProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={23}
              color={active ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.label, { color: active ? colors.primary : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
