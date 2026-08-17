// screens/SettingsScreen.tsx

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';
import { ThemePreference } from '../contexts/ThemeContext';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  themePreference: ThemePreference;
  onSetThemePreference: (pref: ThemePreference) => void;
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'contrast-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const COMING_SOON_ROWS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Profile', icon: 'person-circle-outline' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Account', icon: 'key-outline' },
];

export default function SettingsScreen({
  visible,
  onClose,
  colors,
  themePreference,
  onSetThemePreference,
}: SettingsScreenProps) {
  const selectTheme = (pref: ThemePreference) => {
    Haptics.selectionAsync().catch(() => {});
    onSetThemePreference(pref);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themePreference === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.themeOption,
                    { backgroundColor: active ? colors.primary : colors.card },
                  ]}
                  onPress={() => selectTheme(opt.key)}
                >
                  <Ionicons name={opt.icon} size={20} color={active ? '#FFFFFF' : colors.textPrimary} />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: active ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
          {COMING_SOON_ROWS.map((row) => (
            <View key={row.label} style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <View style={[styles.soonBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.soonBadgeText, { color: colors.textSecondary }]}>Soon</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
