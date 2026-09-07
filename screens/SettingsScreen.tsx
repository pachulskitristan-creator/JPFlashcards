// screens/SettingsScreen.tsx
// Persistent tab now, not a Modal overlay.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { ThemeColors } from '../theme/theme';
import { ThemePreference } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { glassSupported } from '../components/Glass';
import PatternBackground from '../components/PatternBackground';
import { restorePurchases, isPurchasesConfigured, isPro as checkIsPro, hasProEntitlement } from '../services/purchasesService';
import { PRO_ENTITLEMENT_ID } from '../config/revenueCatConfig';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, SUPPORT_EMAIL } from '../config/appStoreConfig';

interface SettingsScreenProps {
  colors: ThemeColors;
  themePreference: ThemePreference;
  onSetThemePreference: (pref: ThemePreference) => void;
  bottomInset: number;
  /** Fires a milestone celebration immediately, bypassing the real 25-known-words trigger — for previewing/tuning the animation without grinding 25 words to mastery. */
  onPreviewMilestone: () => void;
}

/** A settings row with a flat, transparent background — used ~10x below, so it's a helper rather than repeated inline. */
function Row({
  children,
  onPress,
  colors,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  colors: ThemeColors;
  style?: object;
}) {
  const Container = onPress ? Pressable : View;
  return (
    <Container style={[styles.row, { backgroundColor: `${colors.surfaceAlt}A6` }, style]} onPress={onPress}>
      {children}
    </Container>
  );
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
  bottomInset,
  onPreviewMilestone,
}: SettingsScreenProps) {
  const { user, signOut, setGuestMode, deleteAccount } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    if (isPurchasesConfigured()) checkIsPro().then(setIsProUser);
  }, []);

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

  const handleUpgrade = async () => {
    if (!isPurchasesConfigured()) {
      Alert.alert('Not available', 'Purchases aren\'t available on this build.');
      return;
    }
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    });
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      setIsProUser(true);
    }
  };

  const handleManageSubscription = () => {
    RevenueCatUI.presentCustomerCenter().catch(() => {});
  };

  const handleRestore = async () => {
    if (!isPurchasesConfigured()) return;
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const nowPro = info ? hasProEntitlement(info) : false;
      setIsProUser(nowPro);
      Alert.alert(nowPro ? 'Restored' : 'Nothing to restore', nowPro ? 'Your Pro purchase is active.' : 'No previous purchase was found for this account.');
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all data associated with it. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) Alert.alert('Couldn\'t delete account', error);
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        {user ? (
          <>
            <Row colors={colors}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {user.email}
              </Text>
            </Row>
            <Pressable style={[styles.signOutButton, { borderColor: colors.error }]} onPress={handleSignOut}>
              <Text style={[styles.signOutButtonText, { color: colors.error }]}>Sign Out</Text>
            </Pressable>
            <Pressable onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
              <Text style={[styles.deleteAccountText, { color: colors.error }]}>Delete Account</Text>
            </Pressable>
          </>
        ) : (
          <Row colors={colors} onPress={handleLogInPrompt}>
            <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Log In / Sign Up</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Row>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Membership</Text>
        {isProUser ? (
          <Row colors={colors}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Pro Member</Text>
          </Row>
        ) : (
          <Row colors={colors} onPress={handleUpgrade}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Upgrade to Pro</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Row>
        )}
        {isProUser ? (
          <Row colors={colors} onPress={handleManageSubscription}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Manage Subscription</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Row>
        ) : null}
        <Row colors={colors} onPress={handleRestore}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
            {restoring ? 'Checking…' : 'Restore Purchases'}
          </Text>
        </Row>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const active = themePreference === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[
                  styles.themeOption,
                  { backgroundColor: active ? colors.primary : `${colors.card}A6` },
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
          <Row key={row.label} colors={colors}>
            <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
            <View style={[styles.soonBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.soonBadgeText, { color: colors.textSecondary }]}>Soon</Text>
            </View>
          </Row>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Legal & Support</Text>
        <Row colors={colors} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </Row>
        <Row colors={colors} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Terms of Service</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </Row>
        <Row colors={colors} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Contact Support</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </Row>

        <Row colors={colors}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Version {appVersion}</Text>
        </Row>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Debug</Text>
        <Row colors={colors}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
            {Platform.OS} {Platform.Version} · Liquid Glass: {glassSupported ? 'available' : 'unavailable'}
          </Text>
        </Row>
        <Row colors={colors} onPress={onPreviewMilestone}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Preview Celebration Animation</Text>
        </Row>
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
    letterSpacing: 0.4,
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
    overflow: 'hidden',
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
    overflow: 'hidden',
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
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
});
