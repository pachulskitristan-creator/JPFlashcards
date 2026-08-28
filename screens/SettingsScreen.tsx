// screens/SettingsScreen.tsx
// Persistent tab now, not a Modal overlay.

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';
import { ThemePreference } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsScreenProps {
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
];

export default function SettingsScreen({
  colors,
  themePreference,
  onSetThemePreference,
}: SettingsScreenProps) {
  const { user, signOut, setGuestMode } = useAuth();

  const selectTheme = (pref: ThemePreference) => {
    Haptics.selectionAsync().catch(() => {});
    onSetThemePreference(pref);
  };

  const handleSignOut = async () => {
    Haptics.selectionAsync().catch(() => {});
    await signOut();
  };

  const handleLogInPrompt = () => {
    Haptics.selectionAsync().catch(() => {});
    setGuestMode(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        {user ? (
          <>
            <View style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <Pressable style={[styles.signOutButton, { borderColor: colors.error }]} onPress={handleSignOut}>
              <Text style={[styles.signOutButtonText, { color: colors.error }]}>Sign Out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.row, { backgroundColor: colors.surfaceAlt }]} onPress={handleLogInPrompt}>
            <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Log In / Sign Up</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        )}

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

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>More</Text>
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
  signOutButton: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
