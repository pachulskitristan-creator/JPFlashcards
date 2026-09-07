// services/purchasesService.ts
// RevenueCat integration — real SDK (react-native-purchases), not a
// stub. Configure once at app startup (see App.tsx), then read
// entitlement state via customerInfo. Purchasing/restoring/presenting
// a paywall goes through RevenueCat's own hosted UI
// (react-native-purchases-ui) rather than hand-built screens — see
// SettingsScreen.tsx's "Upgrade to Pro" / "Manage Subscription" rows.

import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_API_KEY_ANDROID,
  PRO_ENTITLEMENT_ID,
} from '../config/revenueCatConfig';

let configured = false;

/** Call once at app startup. No-op on a platform whose key in revenueCatConfig.ts is still empty. */
export function configurePurchases(): void {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
}

export function isPurchasesConfigured(): boolean {
  return configured;
}

export function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

/** Current entitlement state, straight from RevenueCat (cached locally by the SDK, refreshed from the store in the background). */
export async function isPro(): Promise<boolean> {
  if (!configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasProEntitlement(info);
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.restorePurchases();
}
