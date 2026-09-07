// config/revenueCatConfig.ts
//
// RevenueCat's public SDK key is designed to be embedded in client
// code (same idea as the Supabase publishable key in
// supabaseConfig.ts) — it can only start a purchase flow, never read
// or modify your account server-side. The secret REST API key (if you
// ever need one) must never appear here.
//
// RevenueCat issues a separate public SDK key per store — set both
// before shipping. purchasesService.ts picks the right one by
// Platform.OS and no-ops on a platform whose key is still empty.

export const REVENUECAT_API_KEY_IOS = 'appl_aqBzByRSnfpcekipEINDjPaJxcX';
/** TODO: set this from the RevenueCat dashboard (Project Settings > API keys > Google Play) before an Android release. */
export const REVENUECAT_API_KEY_ANDROID = '';

/** Must match the entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID = 'jpflashcard_pro';

/** Must match the product identifiers configured in App Store Connect / RevenueCat. */
export const PRODUCT_IDS = {
  lifetime: 'lifetime',
  yearly: 'yearly',
  monthly: 'monthly',
} as const;
